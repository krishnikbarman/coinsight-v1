/**
 * Historical API Service
 * Fetch historical price data from CoinGecko API
 * Used for market comparison charts (BTC, ETH vs Portfolio)
 */

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'
const CACHE_DURATION = 7200000 // 2 hours in milliseconds (increased to reduce API calls)
const REQUEST_TIMEOUT = 15000 // 15 seconds
const MAX_RETRIES = 2
const RETRY_DELAY = 3000 // 3 seconds

// In-memory cache to reduce API calls
const priceCache = new Map()
let lastHistoricalRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000 // Minimum 2 seconds between historical requests

/**
 * Generate cache key
 * @param {string} coinId - Coin identifier
 * @param {number} days - Number of days
 * @returns {string} - Cache key
 */
const getCacheKey = (coinId, days) => `${coinId}_${days}`

/**
 * Check if cached data is still valid
 * @param {number} timestamp - Cache timestamp
 * @returns {boolean} - Is valid
 */
const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION
}

/**
 * Fetch historical market data from CoinGecko with retry logic
 * @param {string} coinId - Coin ID (bitcoin, ethereum)
 * @param {number} days - Number of days (7, 30, 90)
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - Historical data with success flag
 */
export const fetchHistoricalData = async (coinId, days, retryCount = 0) => {
  const cacheKey = getCacheKey(coinId, days)
  
  // Check cache first
  if (priceCache.has(cacheKey)) {
    const cached = priceCache.get(cacheKey)
    if (isCacheValid(cached.timestamp)) {
      return { success: true, data: cached.data, source: 'cache' }
    }
  }
  
  try {
    // Rate limiting - wait if needed
    const now = Date.now()
    const timeSinceLastRequest = now - lastHistoricalRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }
    lastHistoricalRequestTime = Date.now()

    const url = `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    // Handle rate limiting
    if (response.status === 429) {
      console.warn(`Rate limit hit for ${coinId} historical data`)
      throw new Error('RATE_LIMIT_EXCEEDED')
    }
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // Format data: convert timestamps to dates and extract prices
    const formattedData = data.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      timestamp,
      value: price
    }))
    
    // Cache the result
    priceCache.set(cacheKey, {
      data: formattedData,
      timestamp: Date.now()
    })
    
    return {
      success: true,
      data: formattedData,
      source: 'api'
    }
  } catch (error) {
    console.error(`Error fetching historical data for ${coinId}:`, error)
    
    // Retry logic for network errors (not rate limits)
    if (retryCount < MAX_RETRIES && error.message !== 'RATE_LIMIT_EXCEEDED') {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
      return fetchHistoricalData(coinId, days, retryCount + 1)
    }
    
    // Fall through to mock data
    error = error
    console.error(`Error fetching historical data for ${coinId}:`, error)
    
    // Return mock data as fallback
    return {
      success: false,
      data: generateMockHistoricalData(days),
      source: 'mock',
      error: error.message
    }
  }
}

/**
 * Fetch Bitcoin historical data
 * @param {number} days - Number of days (7, 30, 90)
 * @returns {Promise<Object>} - BTC historical data
 */
export const fetchBitcoinHistory = async (days) => {
  return await fetchHistoricalData('bitcoin', days)
}

/**
 * Fetch Ethereum historical data
 * @param {number} days - Number of days (7, 30, 90)
 * @returns {Promise<Object>} - ETH historical data
 */
export const fetchEthereumHistory = async (days) => {
  return await fetchHistoricalData('ethereum', days)
}

/**
 * Fetch both BTC and ETH historical data
 * @param {number} days - Number of days (7, 30, 90)
 * @returns {Promise<Object>} - Combined data for both coins
 */
export const fetchMarketComparison = async (days) => {
  try {
    const [btcResult, ethResult] = await Promise.all([
      fetchBitcoinHistory(days),
      fetchEthereumHistory(days)
    ])
    
    return {
      success: btcResult.success && ethResult.success,
      bitcoin: btcResult.data,
      ethereum: ethResult.data,
      source: btcResult.source === 'api' && ethResult.source === 'api' ? 'api' : 'mixed'
    }
  } catch (error) {
    console.error('Error fetching market comparison:', error)
    return {
      success: false,
      bitcoin: generateMockHistoricalData(days),
      ethereum: generateMockHistoricalData(days),
      source: 'mock',
      error: error.message
    }
  }
}

/**
 * Generate mock historical data for fallback
 * @param {number} days - Number of days
 * @returns {Array} - Mock price data
 */
const generateMockHistoricalData = (days) => {
  const data = []
  const basePrice = 50000 + Math.random() * 10000
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // Generate somewhat realistic price movement
    const variance = (Math.random() - 0.5) * 0.05 // ±5% daily variance
    const price = basePrice * (1 + variance * i)
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      value: price
    })
  }
  
  return data
}

/**
 * Clear price cache
 */
export const clearCache = () => {
  priceCache.clear()
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export const getCacheStats = () => {
  return {
    size: priceCache.size,
    keys: Array.from(priceCache.keys())
  }
}

/**
 * Normalize historical data to percentage (base 100)
 * @param {Array} data - Historical data array
 * @returns {Array} - Normalized data with percentage field
 */
export const normalizeHistoricalData = (data) => {
  if (data.length === 0) return []
  
  const baseValue = data[0].value
  if (baseValue === 0) return data.map(item => ({ ...item, percentage: 100 }))
  
  return data.map(item => ({
    ...item,
    percentage: (item.value / baseValue) * 100
  }))
}

/**
 * Merge multiple historical datasets by date
 * @param {Object} datasets - Object with dataset names as keys
 * @returns {Array} - Merged array with all datasets by date
 */
export const mergeHistoricalDatasets = (datasets) => {
  const merged = new Map()
  
  Object.entries(datasets).forEach(([name, data]) => {
    data.forEach(item => {
      if (!merged.has(item.date)) {
        merged.set(item.date, { date: item.date })
      }
      merged.get(item.date)[name] = item.percentage || item.value
    })
  })
  
  return Array.from(merged.values()).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  )
}

export default {
  fetchHistoricalData,
  fetchBitcoinHistory,
  fetchEthereumHistory,
  fetchMarketComparison,
  normalizeHistoricalData,
  mergeHistoricalDatasets,
  clearCache,
  getCacheStats
}
