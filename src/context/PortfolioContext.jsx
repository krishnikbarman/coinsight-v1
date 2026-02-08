import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'
import { fetchPricesWithFallback, getCoinId } from '../services/cryptoApi'
import { calculatePortfolioMetrics } from '../utils/calculations'
import { savePortfolioSnapshot } from '../utils/historyUtils'
import { useAppStatus } from './AppStatusContext'
import { fetchExchangeRates, convertCurrency, formatCurrencyValue, SUPPORTED_CURRENCIES } from '../services/currencyApi'
import { useNotifications } from './NotificationContext'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../utils/storage'

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
  
  const [coins, setCoins] = useState(() => {
    return getStorageItem(STORAGE_KEYS.PORTFOLIO, [])
  })
  
  const [transactions, setTransactions] = useState(() => {
    return getStorageItem(STORAGE_KEYS.TRANSACTIONS, [])
  })
  
  // Load currency from localStorage or default to USD
  const [currency, setCurrency] = useState(() => {
    const saved = getStorageItem(STORAGE_KEYS.CURRENCY, null)
    if (saved && SUPPORTED_CURRENCIES[saved]) {
      return saved
    }
    return 'USD'
  })
  
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [lastUpdateLocal, setLastUpdateLocal] = useState(null)
  const [apiStatus, setApiStatus] = useState({ success: true, source: 'initial' })
  const [refreshInterval, setRefreshInterval] = useState(PRICE_REFRESH_INTERVAL)
  const [exchangeRates, setExchangeRates] = useState(null)
  
  const intervalRef = useRef(null)

  // Save to localStorage whenever coins change
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.PORTFOLIO, coins)
  }, [coins])

  // Save to localStorage whenever transactions change
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.TRANSACTIONS, transactions)
  }, [transactions])

  // Fetch exchange rates on mount and periodically
  useEffect(() => {
    const loadExchangeRates = async () => {
      const rates = await fetchExchangeRates()
      setExchangeRates(rates)
    }
    
    loadExchangeRates()
    
    // Refresh rates every hour
    const ratesInterval = setInterval(loadExchangeRates, 3600000)
    
    return () => clearInterval(ratesInterval)
  }, [])

  // Save currency to localStorage whenever it changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.CURRENCY, currency)
  }, [currency])

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

      // Update coins with new prices
      const updatedCoins = coins.map(coin => {
        const coinId = coin.coinId || getCoinId(coin.symbol)
        const priceData = result.data[coinId]
        
        if (priceData && priceData.usd) {
          return {
            ...coin,
            currentPrice: priceData.usd,
            priceChange24h: priceData.usd_24h_change || 0
          }
        }
        
        // Keep existing price if no new data available (e.g., rate limited)
        return coin
      })

      setCoins(updatedCoins)
      const now = new Date()
      setLastUpdateLocal(now)
      setLastUpdate(now)
      
      // Save portfolio snapshot after price update
      const metrics = calculatePortfolioMetrics(updatedCoins)
      if (metrics.totalValue > 0) {
        savePortfolioSnapshot(metrics.totalValue)
      }
    } catch (error) {
      console.error('Error updating prices:', error)
      setIsLiveData(false)
      setApiStatusSource('error')
      setApiStatus({
        success: false,
        source: 'error',
        error: error.message
      })
    } finally {
      setPriceLoading(false)
      setIsLoadingPrices(false)
    }
  }, [coins, setIsLiveData, setIsLoadingPrices, setLastUpdate, setApiStatusSource])

  /**with dynamic interval
    intervalRef.current = setInterval(() => {
      fetchCurrentPrices()
    }, refreshInterval)

    // Cleanup interval on unmount or when interval changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchCurrentPrices, refreshInterval]) // Re-run when fetchCurrentPrices or refreshInterval changes
      fetchCurrentPrices()
    }, PRICE_REFRESH_INTERVAL)

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchCurrentPrices]) // Re-run when fetchCurrentPrices changes (which happens when coins change)

  /**
   * Manual refresh trigger
   */
  const refreshPrices = useCallback(() => {
    fetchCurrentPrices()
  }, [fetchCurrentPrices])

  const addCoin = (coin) => {
    try {
      const coinIdToCheck = coin.coinId || getCoinId(coin.symbol)
      
      // Check if coin already exists in portfolio (by coinId or symbol)
      const existingCoinIndex = coins.findIndex(c => 
        c.coinId === coinIdToCheck || 
        c.symbol.toLowerCase() === coin.symbol.toLowerCase()
      )
      
      // Create transaction record
      const transaction = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        coinId: coinIdToCheck,
        symbol: coin.symbol,
        name: coin.name,
        action: 'BUY',
        quantity: coin.quantity,
        price: coin.buyPrice,
        total: coin.quantity * coin.buyPrice
      }
      
      // Add transaction to history
      setTransactions(prev => [transaction, ...prev])
      
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
        
        // Update existing coin
        const updatedCoin = {
          ...existingCoin,
          quantity: totalQuantity,
          buyPrice: avgBuyPrice,
          // Keep the existing currentPrice (will be updated by price fetching)
        }
        
        const updatedCoins = [...coins]
        updatedCoins[existingCoinIndex] = updatedCoin
        setCoins(updatedCoins)
        
        return true
      } else {
        // Coin doesn't exist - add as new
        const newCoin = {
          ...coin,
          id: Date.now(),
          coinId: coinIdToCheck,
          currentPrice: coin.buyPrice, // Initially set current price to buy price
          priceChange24h: 0
        }
        const updatedCoins = [...coins, newCoin]
        setCoins(updatedCoins)
        
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

  const deleteCoin = (id) => {
    const coin = coins.find(c => c.id === id)
    if (coin) {
      // Trigger notification for delete action
      addNotification('delete', coin.symbol, coin.quantity, 0)
    }
    setCoins(coins.filter(coin => coin.id !== id))
  }

  const sellCoin = (id, sellQuantity, sellPrice) => {
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

      // Create SELL transaction record
      const transaction = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        coinId: coin.coinId,
        symbol: coin.symbol,
        name: coin.name,
        action: 'SELL',
        quantity: sellQuantity,
        price: sellPrice || coin.currentPrice,
        total: sellQuantity * (sellPrice || coin.currentPrice)
      }

      // Add transaction to history
      setTransactions(prev => [transaction, ...prev])

      // Trigger notification for sell action
      addNotification('sell', coin.symbol, sellQuantity, sellPrice || coin.currentPrice)

      // Calculate remaining quantity
      const remainingQuantity = coin.quantity - sellQuantity

      if (remainingQuantity <= 0) {
        // Remove coin if quantity reaches zero
        setCoins(coins.filter(c => c.id !== id))
      } else {
        // Update coin with reduced quantity
        setCoins(coins.map(c => 
          c.id === id ? { ...c, quantity: remainingQuantity } : c
        ))
      }

      return true
    } catch (error) {
      console.error('Error selling coin:', error)
      return false
    }
  }

  const changeCurrency = (newCurrency) => {
    if (SUPPORTED_CURRENCIES[newCurrency]) {
      setCurrency(newCurrency)
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
    if (coins.length > 0) {
      const metrics = calculatePortfolioMetrics(coins)
      if (metrics.totalValue > 0) {
        savePortfolioSnapshot(metrics.totalValue)
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

    