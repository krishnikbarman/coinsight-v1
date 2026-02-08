import React, { useState, useEffect, useRef } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { searchCryptoCoins, fetchTopCoins, fetchCurrentPrices, getCoinId } from '../services/cryptoApi'

// Cache for top coins (shared across modal instances)
let topCoinsCache = null
let topCoinsCacheTime = 0
const TOP_COINS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Cache for coin prices (shared across modal instances)
let pricesCache = {}
let pricesCacheTime = {}

const AddCoinModal = ({ isOpen = false, onClose = () => {} }) => {
  const { addCoin } = usePortfolio()

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    quantity: '',
    buyPrice: '',
    image: '',
    coinId: '',
    currentMarketPrice: null
  })

  const [errors, setErrors] = useState({})
  const [topCoins, setTopCoins] = useState([])
  const [loadingTopCoins, setLoadingTopCoins] = useState(false)
  const [topCoinsError, setTopCoinsError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [pricesData, setPricesData] = useState({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  
  const searchTimeoutRef = useRef(null)
  const searchInputRef = useRef(null)

  // Fetch top coins on mount
  useEffect(() => {
    if (isOpen) {
      loadTopCoins()
    }
  }, [isOpen])

  // Load top coins with caching
  const loadTopCoins = async () => {
    try {
      // Check cache first
      const now = Date.now()
      if (topCoinsCache && (now - topCoinsCacheTime) < TOP_COINS_CACHE_DURATION) {
        setTopCoins(topCoinsCache)
        setTopCoinsError(null)
        return
      }

      setLoadingTopCoins(true)
      setTopCoinsError(null)
      const coins = await fetchTopCoins('usd', 6, 1)
      
      if (!coins || !Array.isArray(coins)) {
        throw new Error('Invalid response from API')
      }
      
      const formattedCoins = coins.map(coin => ({
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        coinId: coin.id,
        image: coin.image,
        currentPrice: coin.current_price
      }))
      
      // Update cache
      topCoinsCache = formattedCoins
      topCoinsCacheTime = now
      setTopCoins(formattedCoins)
      setTopCoinsError(null)
    } catch (error) {
      console.error('Error loading top coins:', error)
      setTopCoinsError('Unable to load top coins. You can still search or enter manually.')
      // Fallback to minimal set on error
      setTopCoins([
        { name: 'Bitcoin', symbol: 'BTC', coinId: 'bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
        { name: 'Ethereum', symbol: 'ETH', coinId: 'ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
      ])
    } finally {
      setLoadingTopCoins(false)
    }
  }

  // Debounced search handler
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim().length < 2) {
      setSearchResults([])
      setShowSearchDropdown(false)
      setSearchError(null)
      return
    }

    setSearchLoading(true)
    setShowSearchDropdown(true)

    // Debounce search by 500ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearchError(null)
        const results = await searchCryptoCoins(query)
        
        if (!results || !Array.isArray(results)) {
          throw new Error('Invalid search results')
        }
        
        const limitedResults = results.slice(0, 8) // Limit to 8 results
        setSearchResults(limitedResults)
        setSearchError(null)
        
        // Fetch prices for search results
        await fetchPricesForCoins(limitedResults)
      } catch (error) {
        console.error('Search error:', error)
        setSearchError('Search failed. Please try again or enter details manually.')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 500)
  }

  // Fetch prices for a list of coins
  const fetchPricesForCoins = async (coins) => {
    if (!coins || coins.length === 0) return

    try {
      setLoadingPrices(true)
      const coinObjects = coins.map(coin => ({ 
        coinId: coin.id, 
        symbol: coin.symbol 
      })).filter(obj => obj.coinId)
      
      if (coinObjects.length === 0) return

      // Check cache first
      const now = Date.now()
      const cacheDuration = 2 * 60 * 1000 // 2 minutes
      const uncachedCoins = coinObjects.filter(coin => {
        return !pricesCacheTime[coin.coinId] || (now - pricesCacheTime[coin.coinId]) > cacheDuration
      })

      if (uncachedCoins.length > 0) {
        const prices = await fetchCurrentPrices(uncachedCoins, 'usd')
        
        // Update cache
        uncachedCoins.forEach(coin => {
          if (prices[coin.coinId]) {
            pricesCache[coin.coinId] = prices[coin.coinId]
            pricesCacheTime[coin.coinId] = now
          }
        })
      }

      // Set prices data from cache
      const allPrices = {}
      coinObjects.forEach(coin => {
        if (pricesCache[coin.coinId]) {
          allPrices[coin.coinId] = pricesCache[coin.coinId]
        }
      })
      setPricesData(allPrices)
    } catch (error) {
      console.error('Error fetching prices:', error)
    } finally {
      setLoadingPrices(false)
    }
  }

  // Handle coin selection from search or quick select
  const selectCoin = (coin) => {
    const coinId = coin.id || coin.coinId || ''
    const marketPrice = pricesData[coinId]?.usd || coin.currentPrice || coin.current_price || null
    
    setFormData(prev => ({
      ...prev,
      name: coin.name || '',
      symbol: (coin.symbol || '').toUpperCase(),
      image: coin.image || coin.large || coin.thumb || '',
      coinId: coinId,
      currentMarketPrice: marketPrice,
      buyPrice: marketPrice ? marketPrice.toString() : prev.buyPrice
    }))
    setSearchQuery('')
    setSearchResults([])
    setShowSearchDropdown(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Coin name is required'
    if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required'
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0'
    if (!formData.buyPrice || parseFloat(formData.buyPrice) <= 0) newErrors.buyPrice = 'Buy price must be greater than 0'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const symbolUpper = formData.symbol.trim().toUpperCase()

    const newCoin = {
      name: formData.name.trim(),
      symbol: symbolUpper,
      coinId: formData.coinId || symbolUpper.toLowerCase(),
      quantity: parseFloat(formData.quantity),
      buyPrice: parseFloat(formData.buyPrice),
      currentPrice: formData.currentMarketPrice || parseFloat(formData.buyPrice),
      image: formData.image || `https://via.placeholder.com/32?text=${symbolUpper.charAt(0)}`
    }

    addCoin(newCoin)
    handleClose()
  }

  const handleClose = () => {
    setFormData({ name: '', symbol: '', quantity: '', buyPrice: '', image: '', coinId: '', currentMarketPrice: null })
    setErrors({})
    setSearchQuery('')
    setSearchResults([])
    setShowSearchDropdown(false)
    setSearchError(null)
    setTopCoinsError(null)
    setPricesData({})
    setLoadingPrices(false)
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    onClose()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      // Cleanup search timeout on unmount
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [isOpen])

  // Early return after all hooks
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-dark-secondary rounded-[20px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 border border-dark-tertiary/50 animate-modalFadeScale">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">Buy Cryptocurrency</h2>
          <p className="text-gray-400/60 text-sm mt-0.5">Purchase and add to your portfolio</p>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Search cryptocurrency</label>
          {searchError && (
            <div className="mb-2 text-xs text-yellow-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {searchError}
            </div>
          )}
          <div className="relative" ref={searchInputRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              className="w-full px-4 py-3 pl-10 bg-dark-tertiary border border-dark-tertiary/50 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 text-white transition-all duration-200"
              placeholder="Search by name or symbol..."
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchLoading && (
              <div className="absolute right-3 top-3.5">
                <div className="w-5 h-5 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
              </div>
            )}

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div 
                className="absolute z-50 mt-2 w-full bg-dark-tertiary border border-neon-blue/30 rounded-lg shadow-2xl max-h-[240px] overflow-y-auto p-1.5 scrollbar-thin"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(59, 130, 246, 0.4) rgba(21, 27, 52, 0.5)'
                }}
              >
                {searchResults.map((coin) => {
                  const priceData = pricesData[coin.id]
                  const price = priceData?.usd
                  const change24h = priceData?.usd_24h_change
                  const hasValidChange = change24h !== null && change24h !== undefined && !isNaN(change24h)
                  const isPositive = hasValidChange && change24h >= 0
                  const isLoadingPrice = loadingPrices && !priceData

                  return (
                    <button
                      key={coin.id}
                      type="button"
                      onClick={() => selectCoin(coin)}
                      className="w-full flex items-center space-x-3 pl-4 pr-4 py-3 min-h-[68px] hover:bg-dark-secondary/60 rounded-lg transition-all duration-200 text-left border-b border-dark-secondary/20 last:border-b-0"
                    >
                      <img 
                        src={coin.thumb || coin.large || coin.image} 
                        alt={coin.name} 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                        onError={(e) => { e.target.src = `https://via.placeholder.com/32?text=${coin.symbol?.charAt(0) || 'C'}` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{coin.name}</div>
                        <div className="text-xs text-gray-400">{coin.symbol?.toUpperCase()}</div>
                      </div>
                      
                      {/* Price and Change */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        {isLoadingPrice ? (
                          <div className="flex flex-col items-end space-y-1">
                            <div className="w-16 h-3.5 bg-gray-700/50 rounded animate-pulse" />
                            <div className="w-12 h-3 bg-gray-700/50 rounded animate-pulse" />
                          </div>
                        ) : price ? (
                          <div className="flex flex-col items-end">
                            <div className="text-sm font-mono font-medium text-white">
                              ${price < 1 
                                ? price.toFixed(6).replace(/\.?0+$/, '') 
                                : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              }
                            </div>
                            {hasValidChange && (
                              <div className={`text-xs font-mono font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 text-right text-xs text-gray-500 font-medium">
                            {coin.market_cap_rank ? `#${coin.market_cap_rank}` : ''}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Coins Quick Select */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-400 mb-3">Top coins by market cap</p>
          {topCoinsError && (
            <div className="mb-3 text-xs text-yellow-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {topCoinsError}
            </div>
          )}
          {loadingTopCoins ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-1.5 p-2.5 rounded-lg bg-dark-tertiary border border-dark-tertiary/50 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-700" />
                  <div className="w-10 h-3 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {topCoins.map((coin) => (
                <button
                  key={coin.symbol}
                  type="button"
                  onClick={() => selectCoin(coin)}
                  className={`flex flex-col items-center space-y-1.5 p-2.5 rounded-lg border transition-all duration-300 ${
                    formData.symbol === coin.symbol
                      ? 'bg-neon-blue/10 border-neon-blue/50 ring-2 ring-neon-blue/30 shadow-lg shadow-neon-blue/20'
                      : 'bg-dark-tertiary border-dark-tertiary/50 hover:border-neon-blue/30 hover:shadow-lg hover:shadow-neon-blue/10'
                  }`}
                >
                  <img 
                    src={coin.image} 
                    alt={coin.name} 
                    className="w-8 h-8 rounded-full"
                    onError={(e) => { e.target.src = `https://via.placeholder.com/32?text=${coin.symbol.charAt(0)}` }}
                  />
                  <span className="text-xs font-semibold text-white">{coin.symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Coin name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-tertiary border rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 text-white transition-all duration-200 ${
                  errors.name ? 'border-neon-pink ring-2 ring-neon-pink/30' : 'border-dark-tertiary/50'
                }`}
                placeholder="e.g., Bitcoin"
              />
              {errors.name && <p className="text-neon-pink text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Symbol *</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-tertiary border rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 text-white transition-all duration-200 ${
                  errors.symbol ? 'border-neon-pink ring-2 ring-neon-pink/30' : 'border-dark-tertiary/50'
                }`}
                placeholder="e.g., BTC"
              />
              {errors.symbol && <p className="text-neon-pink text-xs mt-1">{errors.symbol}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-tertiary border rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 text-white transition-all duration-200 ${
                  errors.quantity ? 'border-neon-pink ring-2 ring-neon-pink/30' : 'border-dark-tertiary/50'
                }`}
                placeholder="0.00"
                step="0.00000001"
              />
              {errors.quantity && <p className="text-neon-pink text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Buy price (USD) *</label>
              <input
                type="number"
                name="buyPrice"
                value={formData.buyPrice}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-tertiary border rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue/50 text-white transition-all duration-200 ${
                  errors.buyPrice ? 'border-neon-pink ring-2 ring-neon-pink/30' : 'border-dark-tertiary/50'
                }`}
                placeholder="0.00"
                step="0.01"
              />
              {errors.buyPrice && <p className="text-neon-pink text-xs mt-1">{errors.buyPrice}</p>}
              {formData.currentMarketPrice && (
                <p className="text-xs mt-1.5 flex items-center text-gray-400">
                  <svg className="w-3.5 h-3.5 mr-1 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Current market price:</span>
                  <span className="ml-1 font-mono font-semibold text-neon-blue">
                    ${formData.currentMarketPrice < 1 
                      ? formData.currentMarketPrice.toFixed(8).replace(/\.?0+$/, '')
                      : formData.currentMarketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Preview */}
          {formData.quantity && formData.buyPrice && (
            <div className="bg-dark-tertiary rounded-lg p-4 border border-neon-blue/20">
              <p className="text-sm text-gray-400 mb-1">Total Investment</p>
              <p className="text-xl font-bold text-neon-blue">
                ${(parseFloat(formData.quantity) * parseFloat(formData.buyPrice)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-lg hover:shadow-lg hover:shadow-neon-blue/30 transition-all duration-300 font-medium"
            >
              Confirm Purchase
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-dark-tertiary/60 text-gray-400 rounded-lg hover:bg-dark-tertiary/80 hover:text-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCoinModal
