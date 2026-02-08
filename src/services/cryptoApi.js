/**
 * CryptoApi Service
 * Handles real-time cryptocurrency price fetching from CoinGecko API
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// Rate limiting and retry configuration
const MAX_RETRIES = 2
const RETRY_DELAY = 2000 // 2 seconds
const CACHE_DURATION = 120000 // 2 minutes (increased from 1 min)
const REQUEST_TIMEOUT = 10000 // 10 seconds

// Simple in-memory cache
const priceCache = new Map()
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1500 // Minimum 1.5 seconds between requests

// Map of common coin symbols to CoinGecko IDs
const COIN_ID_MAP = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'ADA': 'cardano',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'XRP': 'ripple',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AVAX': 'avalanche-2',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'TRX': 'tron',
  'ETC': 'ethereum-classic',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'PEPE': 'pepe',
  'SHIB': 'shiba-inu',
  'BNB': 'binancecoin',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'DAI': 'dai',
  'WBTC': 'wrapped-bitcoin'
}

/**
 * Get CoinGecko ID from symbol
 * @param {string} symbol - Coin symbol (e.g., 'BTC')
 * @returns {string} - CoinGecko ID
 */
export const getCoinId = (symbol) => {
  return COIN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase()
}

/**
 * Wait for rate limit cooldown
 */
const waitForRateLimit = () => {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
    return new Promise(resolve => setTimeout(resolve, waitTime))
  }
  return Promise.resolve()
}

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cacheEntry) => {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION
}

/**
 * Fetch current prices for multiple coins with retry logic
 * @param {Array} coins - Array of coin objects with symbol or coinId
 * @param {string} currency - Currency to fetch prices in (default: 'usd')
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} - Object mapping coin IDs to price data
 */
export const fetchCurrentPrices = async (coins, currency = 'usd', retryCount = 0) => {
  try {
    // Extract coin IDs from portfolio coins
    const coinIds = coins.map(coin => {
      if (coin.coinId) return coin.coinId
      return getCoinId(coin.symbol)
    })

    // Remove duplicates
    const uniqueCoinIds = [...new Set(coinIds)]

    if (uniqueCoinIds.length === 0) {
      return {}
    }

    // Check cache first
    const cacheKey = `${uniqueCoinIds.join(',')}_${currency}`
    if (priceCache.has(cacheKey)) {
      const cached = priceCache.get(cacheKey)
      if (isCacheValid(cached)) {
        return cached.data
      }
    }

    // Wait for rate limit if needed
    await waitForRateLimit()
    lastRequestTime = Date.now()

    // Fetch prices from CoinGecko with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${uniqueCoinIds.join(',')}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    // Handle rate limiting (429)
    if (response.status === 429) {
      console.warn('Rate limit hit (429). Using cached/mock data.')
      throw new Error('RATE_LIMIT_EXCEEDED')
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Cache the result
    priceCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    return data
  } catch (error) {
    console.error('Error fetching current prices:', error)

    // Retry logic for network errors (not rate limits)
    if (retryCount < MAX_RETRIES && error.message !== 'RATE_LIMIT_EXCEEDED') {
      console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
      return fetchCurrentPrices(coins, currency, retryCount + 1)
    }

    throw error
  }
}

/**
 * Fetch price with mock fallback in case of API failure
 * @param {Array} coins - Array of coin objects
 * @param {string} currency - Currency to fetch prices in
 * @returns {Promise<Object>} - Price data or mock data
 */
export const fetchPricesWithFallback = async (coins, currency = 'usd') => {
  try {
    const prices = await fetchCurrentPrices(coins, currency)
    return { success: true, data: prices, source: 'api' }
  } catch (error) {
    const isRateLimit = error.message === 'RATE_LIMIT_EXCEEDED'
    console.warn(
      isRateLimit 
        ? 'CoinGecko rate limit reached. Using cached/mock data. Will retry later.' 
        : 'API fetch failed, using mock data:', 
      error
    )
    
    // Return mock prices with small random variations
    const mockPrices = {}
    coins.forEach(coin => {
      const coinId = coin.coinId || getCoinId(coin.symbol)
      // Use current price if available, otherwise buy price with slight variation
      const basePrice = coin.currentPrice || coin.buyPrice
      const variation = 0.98 + Math.random() * 0.04 // 0.98 to 1.02 (±2% to be more realistic)
      mockPrices[coinId] = {
        [currency]: basePrice * variation,
        [`${currency}_24h_change`]: (Math.random() - 0.5) * 5 // Random -2.5% to +2.5%
      }
    })
    
    return { 
      success: false, 
      data: mockPrices, 
      source: isRateLimit ? 'rate_limited' : 'mock', 
      error: isRateLimit ? 'Rate limit exceeded. Please wait before refreshing.' : error.message 
    }
  }
}

/**
 * Search for coins by name or symbol
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching coins
 */
export const searchCryptoCoins = async (query) => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`)
    }

    const data = await response.json()
    return data.coins || []
  } catch (error) {
    console.error('Error searching coins:', error)
    return []
  }
}

/**
 * Fetch detailed coin information including market data
 * @param {string} coinId - CoinGecko coin ID
 * @returns {Promise<Object>} - Detailed coin data
 */
export const fetchCoinInfo = async (coinId) => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Coin info API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching coin info:', error)
    throw error
  }
}

/**
 * Fetch market chart data for a coin
 * @param {string} coinId - CoinGecko coin ID
 * @param {string} currency - Currency (usd, eur, etc.)
 * @param {number} days - Number of days of data (1, 7, 30, 365, max)
 * @returns {Promise<Object>} - Chart data with prices array
 */
export const fetchMarketChart = async (coinId, currency = 'usd', days = 30) => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Chart API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching market chart:', error)
    throw error
  }
}

/**
 * Fetch trending coins
 * @returns {Promise<Array>} - Array of trending coins
 */
export const fetchTrendingCoins = async () => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/search/trending`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Trending API error: ${response.status}`)
    }

    const data = await response.json()
    return data.coins || []
  } catch (error) {
    console.error('Error fetching trending coins:', error)
    return []
  }
}

/**
 * Fetch top coins by market cap
 * @param {string} currency - Currency (usd, eur, etc.)
 * @param {number} perPage - Number of results per page
 * @param {number} page - Page number
 * @returns {Promise<Array>} - Array of top coins
 */
export const fetchTopCoins = async (currency = 'usd', perPage = 10, page = 1) => {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Top coins API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching top coins:', error)
    return []
  }
}

export default {
  getCoinId,
  fetchCurrentPrices,
  fetchPricesWithFallback,
  searchCryptoCoins,
  fetchCoinInfo,
  fetchMarketChart,
  fetchTrendingCoins,
  fetchTopCoins
}
