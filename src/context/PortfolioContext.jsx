import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { fetchPricesWithFallback, getCoinId } from '../services/cryptoApi'
import { calculatePortfolioMetrics } from '../utils/calculations'
import { savePortfolioSnapshot, migrateHistoryToSupabase } from '../utils/historyUtils'
import { useAppStatus } from './AppStatusContext'
import { fetchExchangeRates, convertCurrency, formatCurrencyValue, SUPPORTED_CURRENCIES } from '../services/currencyApi'
import { useNotifications } from './NotificationContext'
import { STORAGE_KEYS, getStorageItem } from '../utils/storage'
import { useAuth } from './AuthContext'
import * as portfolioService from '../services/portfolioService'
import * as transactionService from '../services/transactionService'

const PortfolioContext = createContext()

export const usePortfolio = () => {
  const context = useContext(PortfolioContext)
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider')
  }
  return context
}

// Price refresh interval (60 seconds)
const PRICE_REFRESH_INTERVAL = 60000

export const PortfolioProvider = ({ children }) => {
  const { setIsLiveData, setIsLoadingPrices, setLastUpdate, setApiStatusSource } = useAppStatus()
  const { addNotification } = useNotifications()
  const { user, session } = useAuth() // Get user from AuthContext
  
  const [coins, setCoins] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Load currency from Supabase user_settings (no localStorage fallback)
  const [currency, setCurrency] = useState('USD')
  const [currencyLoaded, setCurrencyLoaded] = useState(false)
  
  const [priceLoading, setPriceLoading] = useState(false)
  const [lastUpdateLocal, setLastUpdateLocal] = useState(null)
  const [apiStatus, setApiStatus] = useState({ success: true, source: 'initial' })
  const [refreshInterval, setRefreshInterval] = useState(PRICE_REFRESH_INTERVAL)
  const [exchangeRates, setExchangeRates] = useState(null)

  // Load currency from Supabase user_settings
  useEffect(() => {
    const loadCurrency = async () => {
      if (!user) {
        setCurrency('USD')
        setCurrencyLoaded(true)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('currency')
          .eq('user_id', user.id)
          .single()

        if (error) {
          // If settings don't exist, create default
          if (error.code === 'PGRST116') {
            // Migrate currency from localStorage if present
            const localCurrency = getStorageItem(STORAGE_KEYS.CURRENCY, 'USD')
            
            await supabase
              .from('user_settings')
              .insert({
                user_id: user.id,
                currency: localCurrency,
                portfolio_updates: true,
                market_trends: false
              })

            setCurrency(localCurrency)
            
            // Clear localStorage currency after migration
            localStorage.removeItem(STORAGE_KEYS.CURRENCY)
          } else {
            console.error('Error loading currency:', error)
            setCurrency('USD')
          }
        } else if (data) {
          setCurrency(data.currency || 'USD')
        }
      } catch (error) {
        console.error('Error loading currency:', error)
        setCurrency('USD')
      } finally {
        setCurrencyLoaded(true)
      }
    }

    loadCurrency()
  }, [user])

  // Load portfolio data from Supabase on mount (always fetch fresh)
  useEffect(() => {
    const loadPortfolioData = async () => {
      setLoading(true)
      
      try {
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setCoins([])
          setTransactions([])
          setLoading(false)
          return
        }

        // If no session, clear data
        if (!currentSession) {
          setCoins([])
          setTransactions([])
          setLoading(false)
          return
        }

        // Extract user ID
        const userId = currentSession.user.id

        // Check if migration is needed (one-time check for localStorage data)
        const localCoins = getStorageItem(STORAGE_KEYS.PORTFOLIO, [])
        const localTxs = getStorageItem(STORAGE_KEYS.TRANSACTIONS, [])
        const localHistory = getStorageItem(STORAGE_KEYS.HISTORY, [])
        
        if (localCoins.length > 0 || localTxs.length > 0 || localHistory.length > 0) {
          try {
            await Promise.all([
              portfolioService.migrateLocalStorageToSupabase(userId),
              transactionService.migrateTransactionsToSupabase(userId),
              migrateHistoryToSupabase(userId)
            ])
          } catch (migrationError) {
            console.warn('⚠️ Migration failed:', migrationError.message)
          }
        }

        // Always fetch from Supabase (fresh data)
        const [holdings, txs] = await Promise.all([
          portfolioService.getHoldings(userId),
          transactionService.getTransactions(userId)
        ])

        // Set coin images using CoinCap.io (more reliable than CoinGecko)
        if (holdings.length > 0) {
          holdings.forEach(holding => {
            // Use CoinCap.io as primary image source with fallback
            if (!holding.image) {
              holding.image = `https://assets.coincap.io/assets/icons/${holding.symbol.toLowerCase()}@2x.png`
            }
          })
        }

        // Update state with fetched data
        setCoins(holdings)
        setTransactions(txs)
      } catch (error) {
        console.error('❌ Error loading portfolio data:', error)
        setCoins([])
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    loadPortfolioData()
  }, [session]) // Re-run when session changes

  // DISABLED: Exchange rate fetching (only USD supported in v1)
  // Multi-currency support coming soon
  useEffect(() => {
    // Set USD-only rates immediately (no API call needed)
    setExchangeRates({
      base: 'USD',
      rates: { USD: 1 },
      timestamp: new Date().toISOString(),
      disabled: true
    })
    
    /* Original multi-currency logic (will be re-enabled in future)
    const loadExchangeRates = async () => {
      const rates = await fetchExchangeRates()
      setExchangeRates(rates)
    }
    
    loadExchangeRates()
    
    // Refresh rates every hour
    const ratesInterval = setInterval(loadExchangeRates, 3600000)
    
    return () => clearInterval(ratesInterval)
    */
  }, [])

  /**
   * Fetch current prices from CoinGecko API
   */
  const fetchCurrentPrices = useCallback(async () => {
    if (coins.length === 0) return

    setPriceLoading(true)
    setIsLoadingPrices(true)
    
    try {
      const result = await fetchPricesWithFallback(coins, 'usd')
      
      // Update global state
      setIsLiveData(result.success && result.source === 'api')
      setApiStatusSource(result.source)
      
      setApiStatus({
        success: result.success,
        source: result.source,
        error: result.error
      })

      // Adjust refresh interval based on API status
      if (result.source === 'rate_limited') {
        // Increase interval to 3 minutes if rate limited
        setRefreshInterval(180000)
      } else if (result.success && result.source === 'api') {
        // Reset to normal interval if API is working
        setRefreshInterval(PRICE_REFRESH_INTERVAL)
      }

      // Update coins with new prices and preserve images
      const updatedCoins = coins.map(coin => {
        const coinId = coin.coinId || getCoinId(coin.symbol)
        const priceData = result.data[coinId]
        
        if (priceData && priceData.usd) {
          return {
            ...coin,
            currentPrice: priceData.usd,
            priceChange24h: priceData.usd_24h_change || 0,
            image: coin.image || `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
          }
        }
        
        // Keep existing price and image if no new data available (e.g., rate limited)
        return {
          ...coin,
          image: coin.image || `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
        }
      })

      setCoins(updatedCoins)
      const now = new Date()
      setLastUpdateLocal(now)
      setLastUpdate(now)
      
      // Update prices in Supabase (async, don't block UI)
      const userId = session?.user?.id
      if (userId && result.success) {
        const priceUpdates = updatedCoins
          .map(coin => {
            const coinId = coin.coinId || getCoinId(coin.symbol)
            const priceData = result.data[coinId]
            if (priceData && priceData.usd) {
              return {
                coinId,
                currentPrice: priceData.usd,
                priceChange24h: priceData.usd_24h_change || 0
              }
            }
            return null
          })
          .filter(Boolean)
        
        if (priceUpdates.length > 0) {
          portfolioService.bulkUpdatePrices(priceUpdates, userId).catch(err => 
            console.warn('Failed to update prices in Supabase:', err)
          )
        }
      }
      
      // Save portfolio snapshot after price update
      const metrics = calculatePortfolioMetrics(updatedCoins)
      if (metrics.totalValue > 0 && userId) {
        // Async snapshot save - don't block UI
        savePortfolioSnapshot(metrics.totalValue, userId).catch(err => 
          console.warn('Failed to save portfolio snapshot:', err)
        )
      }
    } catch (error) {
      console.error('⚠️ Error updating prices:', error)
      setIsLiveData(false)
      setApiStatusSource('error')
      setApiStatus({
        success: false,
        source: 'error',
        error: error.message || 'Failed to fetch prices'
      })
      // Keep existing coins data even if update fails
    } finally {
      setPriceLoading(false)
      setIsLoadingPrices(false)
    }
  }, [coins, session, setIsLiveData, setIsLoadingPrices, setLastUpdate, setApiStatusSource])

  /**
   * Manual refresh trigger
   */
  const refreshPrices = useCallback(() => {
    fetchCurrentPrices()
  }, [fetchCurrentPrices])

  const addCoin = async (coin) => {
    try {
      const coinIdToCheck = coin.coinId || getCoinId(coin.symbol)
      const userId = session?.user?.id
      
      if (!userId) {
        console.error('User must be logged in to add coins')
        return false
      }
      
      // Check if coin already exists in portfolio (by coinId or symbol)
      const existingCoinIndex = coins.findIndex(c => 
        c.coinId === coinIdToCheck || 
        c.symbol.toLowerCase() === coin.symbol.toLowerCase()
      )
      
      // Create transaction record
      const transactionData = {
        coinId: coinIdToCheck,
        symbol: coin.symbol,
        name: coin.name,
        action: 'BUY',
        quantity: coin.quantity,
        price: coin.buyPrice,
        total: coin.quantity * coin.buyPrice
      }
      
      // Add transaction to Supabase
      const newTransaction = await transactionService.addTransaction(transactionData, userId)
      setTransactions(prev => [newTransaction, ...prev])
      
      // Trigger notification for buy action
      addNotification('buy', coin.symbol, coin.quantity, coin.buyPrice)
      
      if (existingCoinIndex !== -1) {
        // Coin exists - update the existing entry
        const existingCoin = coins[existingCoinIndex]
        const oldQuantity = existingCoin.quantity
        const oldBuyPrice = existingCoin.buyPrice
        const newQuantity = coin.quantity
        const newBuyPrice = coin.buyPrice
        
        // Calculate new total quantity
        const totalQuantity = oldQuantity + newQuantity
        
        // Calculate weighted average buy price
        const avgBuyPrice = ((oldQuantity * oldBuyPrice) + (newQuantity * newBuyPrice)) / totalQuantity
        
        // Update in Supabase
        const updated = await portfolioService.updateHolding(
          existingCoin.id,
          {
            quantity: totalQuantity,
            buy_price: avgBuyPrice
          },
          userId
        )
        
        const updatedCoins = [...coins]
        // Preserve image from existing coin or new coin data
        updatedCoins[existingCoinIndex] = {
          ...updated,
          image: existingCoin.image || coin.image
        }
        setCoins(updatedCoins)
        
        return true
      } else {
        // Coin doesn't exist - add as new
        const newHoldingData = {
          coinId: coinIdToCheck,
          symbol: coin.symbol,
          name: coin.name,
          quantity: coin.quantity,
          buyPrice: coin.buyPrice,
          currentPrice: coin.buyPrice,
          priceChange24h: 0
        }
        
        const newHolding = await portfolioService.addOrUpdateHolding(newHoldingData, userId)
        // Add image to the new holding for display
        setCoins(prev => [...prev, { ...newHolding, image: coin.image }])
        
        return true
      }
    } catch (error) {
      console.error('Error adding coin:', error)
      return false
    }
  }

  const updateCoin = (id, updatedData) => {
    setCoins(coins.map(coin => 
      coin.id === id ? { ...coin, ...updatedData } : coin
    ))
  }

  const deleteCoin = async (id) => {
    try {
      const coin = coins.find(c => c.id === id)
      if (!coin) return
      
      const userId = session?.user?.id
      
      if (!userId) {
        console.error('User must be logged in to delete coins')
        return
      }
      
      // Trigger notification for delete action
      addNotification('delete', coin.symbol, coin.quantity, 0)
      
      // Delete from Supabase
      await portfolioService.deleteHolding(id, userId)
      setCoins(coins.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting coin:', error)
    }
  }

  const sellCoin = async (id, sellQuantity, sellPrice) => {
    try {
      const coin = coins.find(c => c.id === id)
      if (!coin) {
        console.error('Coin not found')
        return false
      }

      if (sellQuantity <= 0 || sellQuantity > coin.quantity) {
        console.error('Invalid sell quantity')
        return false
      }

      const userId = session?.user?.id
      
      if (!userId) {
        console.error('User must be logged in to sell coins')
        return false
      }
      
      // Create SELL transaction record
      const transactionData = {
        coinId: coin.coinId,
        symbol: coin.symbol,
        name: coin.name,
        action: 'SELL',
        quantity: sellQuantity,
        price: sellPrice || coin.currentPrice,
        total: sellQuantity * (sellPrice || coin.currentPrice)
      }

      // Add transaction to Supabase
      const newTransaction = await transactionService.addTransaction(transactionData, userId)
      setTransactions(prev => [newTransaction, ...prev])

      // Trigger notification for sell action
      addNotification('sell', coin.symbol, sellQuantity, sellPrice || coin.currentPrice)

      // Calculate remaining quantity
      const remainingQuantity = coin.quantity - sellQuantity

      if (remainingQuantity <= 0) {
        // Remove coin if quantity reaches zero
        await portfolioService.deleteHolding(id, userId)
        setCoins(coins.filter(c => c.id !== id))
      } else {
        // Update coin with reduced quantity
        const updated = await portfolioService.updateHolding(
          id,
          { quantity: remainingQuantity },
          userId
        )
        setCoins(coins.map(c => c.id === id ? updated : c))
      }

      return true
    } catch (error) {
      console.error('Error selling coin:', error)
      return false
    }
  }

  const changeCurrency = async (newCurrency) => {
    if (!SUPPORTED_CURRENCIES[newCurrency]) return
    
    setCurrency(newCurrency)
    
    // Save to Supabase if user is logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .update({ currency: newCurrency })
          .eq('user_id', user.id)

        if (error) {
          console.error('Error updating currency:', error)
        }
      } catch (error) {
        console.error('Error updating currency:', error)
      }
    }
  }

  const formatCurrency = (amountInUSD) => {
    if (!exchangeRates) {
      // Fallback if rates not loaded yet
      return formatCurrencyValue(amountInUSD, 'USD')
    }
    
    const convertedAmount = convertCurrency(amountInUSD, currency, exchangeRates)
    return formatCurrencyValue(convertedAmount, currency)
  }

  // Calculate portfolio metrics using utility function
  const calculateMetrics = () => {
    return calculatePortfolioMetrics(coins)
  }

  // Save initial snapshot on mount if portfolio has value
  useEffect(() => {
    if (coins.length > 0 && user) {
      const metrics = calculatePortfolioMetrics(coins)
      if (metrics.totalValue > 0) {
        savePortfolioSnapshot(metrics.totalValue, user.id).catch(err => 
          console.warn('Failed to save initial snapshot:', err)
        )
      }
    }
  }, []) // Run once on mount

  const value = {
    coins,
    addCoin,
    updateCoin,
    deleteCoin,
    sellCoin,
    currency,
    changeCurrency,
    formatCurrency,
    calculateMetrics,
    loading,
    setLoading,
    priceLoading,
    lastUpdate: lastUpdateLocal,
    apiStatus,
    refreshPrices,
    exchangeRates,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    transactions
  }

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  )
}

    