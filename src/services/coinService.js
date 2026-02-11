/**
 * Coin Service - Unified API for all coin-related data
 * Single source of truth for coin information across the app
 * Uses CoinGecko API with caching and fallback logic
 */

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'
const REQUEST_TIMEOUT = 25000 // 25 seconds (increased)
const CACHE_DURATION = 180000 // 3 minutes cache
const MAX_RETRIES = 3
const BASE_RETRY_DELAY = 1500 // 1.5 seconds

// In-memory cache
const coinCache = new Map()

// Track consecutive failures
let consecutiveFailures = 0
const MAX_CONSECUTIVE_FAILURES = 5

// Map of common symbols to CoinGecko IDs for fallback
const SYMBOL_TO_ID_MAP = {
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
 * Fetch with timeout and retry logic
 */
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT, retryCount = 0) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    console.log(`🌐 Fetching: ${url.substring(0, 80)}...`)
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    
    // Handle rate limiting
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfter = response.headers.get('Retry-After')
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : BASE_RETRY_DELAY * Math.pow(2, retryCount)
      const jitter = Math.random() * 0.3 * delay
      const totalDelay = delay + jitter
      
      console.warn(`⚠️ Rate limited. Retry ${retryCount + 1}/${MAX_RETRIES} in ${Math.round(totalDelay/1000)}s`)
      await new Promise(resolve => setTimeout(resolve, totalDelay))
      return fetchWithTimeout(url, options, timeout, retryCount + 1)
    }
    
    if (response.ok) {
      // Reset failure counter on success
      if (consecutiveFailures > 0) {
        console.log(`✅ API recovered after ${consecutiveFailures} failures`)
        consecutiveFailures = 0
      }
    } else {
      consecutiveFailures++
    }
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    consecutiveFailures++
    
    if (error.name === 'AbortError') {
      console.error(`❌ Request timeout after ${timeout}ms`)
      throw new Error('Request timeout')
    }
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES && error.message.includes('fetch')) {
      const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount)
      const jitter = Math.random() * 0.3 * delay
      const totalDelay = delay + jitter
      
      console.warn(`⟳ Network error. Retry ${retryCount + 1}/${MAX_RETRIES} in ${Math.round(totalDelay/1000)}s`)
      await new Promise(resolve => setTimeout(resolve, totalDelay))
      return fetchWithTimeout(url, options, timeout, retryCount + 1)
    }
    
    throw error
  }
}

/**
 * Get coin details by coin ID
 * @param {string} coinId - CoinGecko coin ID (e.g., 'bitcoin')
 * @param {string} currency - Currency for prices (default: 'usd')
 * @returns {Promise<Object>} Coin details with current price, market data, etc.
 */
export const getCoinById = async (coinId, currency = 'usd') => {
  if (!coinId) {
    throw new Error('Coin ID is required')
  }

  const cacheKey = `${coinId}-${currency}`
  
  try {
    // Check cache first
    const cached = coinCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✓ Using cached coin data for ${coinId}`)
      return cached.data
    }

    // If too many failures, use stale cache if available
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && cached) {
      const age = Math.round((Date.now() - cached.timestamp) / 1000)
      console.warn(`⚠️ Using stale cache for ${coinId} (${age}s old) due to repeated failures`)
      return cached.data
    }

    // Fetch from API
    const url = `${COINGECKO_BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
    const response = await fetchWithTimeout(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch coin: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Format the response
    const coinDetails = {
      id: data.id,
      symbol: data.symbol?.toUpperCase() || '',
      name: data.name,
      image: data.image?.large || data.image?.small || data.image?.thumb,
      currentPrice: data.market_data?.current_price?.[currency.toLowerCase()] || 0,
      priceChange24h: data.market_data?.price_change_24h || 0,
      priceChangePercentage24h: data.market_data?.price_change_percentage_24h || 0,
      marketCap: data.market_data?.market_cap?.[currency.toLowerCase()] || 0,
      marketCapRank: data.market_cap_rank || 0,
      totalVolume: data.market_data?.total_volume?.[currency.toLowerCase()] || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      totalSupply: data.market_data?.total_supply || 0,
      maxSupply: data.market_data?.max_supply || null,
      ath: data.market_data?.ath?.[currency.toLowerCase()] || 0,
      athDate: data.market_data?.ath_date?.[currency.toLowerCase()] || null,
      atl: data.market_data?.atl?.[currency.toLowerCase()] || 0,
      atlDate: data.market_data?.atl_date?.[currency.toLowerCase()] || null,
    }

    // Cache the result
    coinCache.set(cacheKey, {
      data: coinDetails,
      timestamp: Date.now()
    })

    console.log(`✅ Fetched coin details for ${coinId}`)
    return coinDetails
  } catch (error) {
    console.error(`❌ Error fetching coin ${coinId}:`, error.message)
    
    // Try to use stale cache
    const cached = coinCache.get(cacheKey)
    if (cached) {
      const age = Math.round((Date.now() - cached.timestamp) / 1000)
      console.warn(`⚠️ Using stale cache for ${coinId} (${age}s old) as fallback`)
      return cached.data
    }
    
    throw error
  }
}

/**
 * Search for coins by query
 * @param {string} query - Search term (coin name or symbol)
 * @returns {Promise<Array>} Array of matching coins
 */
export const searchCoins = async (query) => {
  if (!query || query.length < 2) {
    return []
  }

  try {
    const url = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`
    const response = await fetchWithTimeout(url)

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data = await response.json()
    
    // Return formatted coin list
    return (data.coins || []).slice(0, 20).map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.large || coin.thumb,
      marketCapRank: coin.market_cap_rank || 0
    }))
  } catch (error) {
    console.error('Error searching coins:', error)
    return []
  }
}

/**
 * Find coin ID by symbol (fallback for old holdings without ID)
 * @param {string} symbol - Coin symbol (e.g., 'BTC')
 * @returns {Promise<string|null>} Coin ID or null if not found
 */
export const findCoinIdBySymbol = async (symbol) => {
  if (!symbol) {
    return null
  }

  const symbolUpper = symbol.toUpperCase()

  // Check hardcoded map first (fast path)
  if (SYMBOL_TO_ID_MAP[symbolUpper]) {
    return SYMBOL_TO_ID_MAP[symbolUpper]
  }

  // Search API as fallback
  try {
    const results = await searchCoins(symbol)
    
    // Find exact symbol match
    const exactMatch = results.find(coin => coin.symbol === symbolUpper)
    if (exactMatch) {
      return exactMatch.id
    }

    // Return first result if available
    if (results.length > 0) {
      return results[0].id
    }

    return null
  } catch (error) {
    console.error(`Error finding coin ID for symbol ${symbol}:`, error)
    return null
  }
}

/**
 * Get multiple coin prices by IDs
 * @param {Array<string>} coinIds - Array of coin IDs
 * @param {string} currency - Currency for prices (default: 'usd')
 * @returns {Promise<Object>} Object mapping coin IDs to price data
 */
export const getCoinPrices = async (coinIds, currency = 'usd') => {
  if (!coinIds || coinIds.length === 0) {
    return {}
  }

  const cacheKey = `prices-${coinIds.join(',')}-${currency}`
  
  try {
    // Check cache first
    const cached = coinCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✓ Using cached prices')
      return cached.data
    }

    // If too many failures, use stale cache if available
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && cached) {
      const age = Math.round((Date.now() - cached.timestamp) / 1000)
      console.warn(`⚠️ Using stale price cache (${age}s old) due to repeated failures`)
      return cached.data
    }

    const ids = coinIds.join(',')
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=${currency}&include_24hr_change=true`
    const response = await fetchWithTimeout(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.status}`)
    }

    const data = await response.json()
    
    // Format response
    const prices = {}
    Object.keys(data).forEach(coinId => {
      prices[coinId] = {
        price: data[coinId][currency.toLowerCase()],
        change24h: data[coinId][`${currency.toLowerCase()}_24h_change`] || 0
      }
    })

    // Cache the result
    coinCache.set(cacheKey, {
      data: prices,
      timestamp: Date.now()
    })

    console.log(`✅ Prices fetched for ${Object.keys(prices).length} coins`)
    return prices
  } catch (error) {
    console.error('❌ Error fetching coin prices:', error.message)
    
    // Try to use stale cache
    const cached = coinCache.get(cacheKey)
    if (cached) {
      const age = Math.round((Date.now() - cached.timestamp) / 1000)
      console.warn(`⚠️ Using stale price cache (${age}s old) as fallback`)
      return cached.data
    }
    
    return {}
  }
}

/**
 * Get top coins by market cap
 * @param {number} limit - Number of coins to fetch (default: 10)
 * @param {string} currency - Currency for prices (default: 'usd')
 * @returns {Promise<Array>} Array of top coins
 */
export const getTopCoins = async (limit = 10, currency = 'usd') => {
  try {
    const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true`
    const response = await fetchWithTimeout(url)

    if (!response.ok) {
      throw new Error('Failed to fetch top coins')
    }

    const data = await response.json()
    
    return data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      priceChange24h: coin.price_change_24h,
      priceChangePercentage24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      totalVolume: coin.total_volume,
      sparkline: coin.sparkline_in_7d?.price || []
    }))
  } catch (error) {
    console.error('Error fetching top coins:', error)
    return []
  }
}

export default {
  getCoinById,
  searchCoins,
  findCoinIdBySymbol,
  getCoinPrices,
  getTopCoins
}
