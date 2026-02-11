/**
 * Market Service - Real-time crypto market data integration
 * Uses CoinGecko Public API for market data with circuit breaker pattern
 * Features: Retry logic, exponential backoff, auto-recovery, smart caching
 */

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'
const REQUEST_TIMEOUT = 25000 // 25 seconds (more lenient for slow connections)
const MAX_RETRIES = 3 // Balanced retry attempts
const BASE_RETRY_DELAY = 1000 // Start with 1 second
const CACHE_DURATION = 180000 // 3 minutes (balanced)
const TOP_COINS_CACHE_DURATION = 60000 // 60 seconds for top 10 coins

// Simple cache to reduce API calls
const cache = new Map()

// Circuit Breaker Configuration
const CIRCUIT_BREAKER = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Failing - use cache/mock
  HALF_OPEN: 'HALF_OPEN'  // Testing recovery
}

let circuitState = CIRCUIT_BREAKER.CLOSED
let failureCount = 0
let successCount = 0
let lastFailureTime = 0
const FAILURE_THRESHOLD = 5 // Open circuit after 5 failures
const SUCCESS_THRESHOLD = 2 // Close circuit after 2 successes in half-open
const CIRCUIT_RESET_TIMEOUT = 30000 // Try to recover after 30 seconds
const CIRCUIT_HALF_OPEN_TIMEOUT = 60000 // Full recovery attempt after 60 seconds
const HEALTH_CHECK_INTERVAL = 120000 // Check API health every 2 minutes

console.log('🔌 Market Service initialized with Circuit Breaker')

// Automatic health check for circuit recovery
let healthCheckTimer = null

/**
 * Start automatic health checks
 */
const startHealthCheck = () => {
  if (healthCheckTimer) {
    return
  }
  
  console.log('🏥 Starting automatic API health checks')
  
  healthCheckTimer = setInterval(async () => {
    // Only check health if circuit is open or half-open
    if (circuitState === CIRCUIT_BREAKER.CLOSED) {
      return
    }
    
    console.log('🏥 Running health check...')
    
    try {
      // Simple ping to check API availability
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Quick 5s timeout for health check
      
      const response = await fetch(`${COINGECKO_BASE_URL}/ping`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        console.log('✅ Health check passed - API is available')
        if (circuitState === CIRCUIT_BREAKER.OPEN) {
          circuitState = CIRCUIT_BREAKER.HALF_OPEN
          successCount = 0
          console.log('⚡ Moving to HALF_OPEN - will test with real requests')
        }
      } else {
        console.log('⚠️ Health check failed - API returned error')
      }
    } catch (error) {
      console.log('⚠️ Health check failed - API unreachable')
    }
  }, HEALTH_CHECK_INTERVAL)
}

/**
 * Stop automatic health checks
 */
export const stopHealthCheck = () => {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer)
    healthCheckTimer = null
    console.log('🏥 Stopped automatic health checks')
  }
}

// Start health checks automatically
startHealthCheck()

/**
 * Mock data for demo mode when API is unavailable
 */
const MOCK_GLOBAL_DATA = {
  totalMarketCap: 2145000000000,
  totalVolume: 89500000000,
  btcDominance: 52.3,
  ethDominance: 16.8,
  marketCapChange24h: 2.4,
  activeCryptocurrencies: 13245,
  markets: 890,
}

const MOCK_FEAR_GREED = {
  value: 68,
  valueClassification: 'Greed',
  timestamp: Date.now(),
  timeUntilUpdate: null,
}

const MOCK_TOP_COINS = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    image: 'https://assets.coincap.io/assets/icons/btc@2x.png',
    currentPrice: 66500,
    marketCap: 1305000000000,
    marketCapRank: 1,
    totalVolume: 28500000000,
    priceChange24h: 1250,
    priceChangePercentage24h: 1.92,
    circulatingSupply: 19625000,
    sparkline: [65000, 65200, 65800, 66100, 66300, 66200, 66500],
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    image: 'https://assets.coincap.io/assets/icons/eth@2x.png',
    currentPrice: 3450,
    marketCap: 415000000000,
    marketCapRank: 2,
    totalVolume: 15200000000,
    priceChange24h: 85,
    priceChangePercentage24h: 2.53,
    circulatingSupply: 120250000,
    sparkline: [3350, 3380, 3400, 3420, 3440, 3435, 3450],
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    image: 'https://assets.coincap.io/assets/icons/sol@2x.png',
    currentPrice: 142,
    marketCap: 63800000000,
    marketCapRank: 5,
    totalVolume: 3200000000,
    priceChange24h: 4.2,
    priceChangePercentage24h: 3.05,
    circulatingSupply: 449000000,
    sparkline: [138, 139, 140, 141, 142, 141.5, 142],
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    image: 'https://assets.coincap.io/assets/icons/ada@2x.png',
    currentPrice: 0.58,
    marketCap: 20400000000,
    marketCapRank: 9,
    totalVolume: 580000000,
    priceChange24h: -0.012,
    priceChangePercentage24h: -2.03,
    circulatingSupply: 35200000000,
    sparkline: [0.59, 0.585, 0.583, 0.582, 0.58, 0.579, 0.58],
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    image: 'https://assets.coincap.io/assets/icons/bnb@2x.png',
    currentPrice: 415,
    marketCap: 62000000000,
    marketCapRank: 4,
    totalVolume: 1800000000,
    priceChange24h: 8.5,
    priceChangePercentage24h: 2.09,
    circulatingSupply: 149500000,
    sparkline: [405, 408, 410, 412, 414, 413, 415],
  },
]

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Add jitter to delay to prevent thundering herd
 */
const addJitter = (delay) => {
  const jitter = Math.random() * 0.3 * delay // 0-30% jitter
  return delay + jitter
}

/**
 * Check if circuit breaker should attempt recovery
 */
const shouldAttemptRecovery = () => {
  const now = Date.now()
  const timeSinceFailure = now - lastFailureTime
  
  if (circuitState === CIRCUIT_BREAKER.OPEN && timeSinceFailure > CIRCUIT_RESET_TIMEOUT) {
    circuitState = CIRCUIT_BREAKER.HALF_OPEN
    successCount = 0
    console.log('⚡ Circuit breaker entering HALF_OPEN state - testing recovery')
    return true
  }
  
  return circuitState !== CIRCUIT_BREAKER.OPEN
}

/**
 * Record API success
 */
const recordSuccess = () => {
  if (circuitState === CIRCUIT_BREAKER.HALF_OPEN) {
    successCount++
    console.log(`✅ API success in HALF_OPEN state (${successCount}/${SUCCESS_THRESHOLD})`)
    
    if (successCount >= SUCCESS_THRESHOLD) {
      circuitState = CIRCUIT_BREAKER.CLOSED
      failureCount = 0
      successCount = 0
      console.log('🟢 Circuit breaker CLOSED - API fully recovered!')
    }
  } else if (circuitState === CIRCUIT_BREAKER.CLOSED) {
    // Reset failure count on success
    if (failureCount > 0) {
      console.log(`✅ API recovered - resetting failure count (was ${failureCount})`)
      failureCount = 0
    }
  }
}

/**
 * Record API failure
 */
const recordFailure = (error) => {
  lastFailureTime = Date.now()
  failureCount++
  
  console.warn(`⚠️ API failure ${failureCount}/${FAILURE_THRESHOLD} - ${error.message}`)
  
  if (circuitState === CIRCUIT_BREAKER.HALF_OPEN) {
    circuitState = CIRCUIT_BREAKER.OPEN
    successCount = 0
    console.error('❌ Circuit breaker reopened - recovery failed')
  } else if (circuitState === CIRCUIT_BREAKER.CLOSED && failureCount >= FAILURE_THRESHOLD) {
    circuitState = CIRCUIT_BREAKER.OPEN
    console.error(`🔴 Circuit breaker OPEN - API unavailable (will retry in ${CIRCUIT_RESET_TIMEOUT/1000}s)`)
  }
}

/**
 * Get circuit breaker status for debugging
 */
export const getCircuitStatus = () => ({
  state: circuitState,
  failureCount,
  successCount,
  timeSinceLastFailure: Date.now() - lastFailureTime
})

/**
 * Fetch with timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Fetch with retry logic and exponential backoff with circuit breaker
 * Automatically switches between live API and cached/mock data
 */
const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  // Check if we should attempt recovery
  if (!shouldAttemptRecovery()) {
    console.log('⚠️ Circuit breaker OPEN - using cached/mock data')
    throw new Error('Circuit breaker open - API temporarily unavailable')
  }

  // Check cache first (always check cache for efficiency)
  const cacheKey = url + JSON.stringify(options)
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✓ Using cached data (fresh)')
    recordSuccess() // Using cache counts as success
    return cached.data
  }

  // If circuit is open and cache is stale, throw error immediately
  if (circuitState === CIRCUIT_BREAKER.OPEN) {
    console.log('⚠️ Circuit OPEN and cache stale - using mock data')
    throw new Error('Circuit breaker open - API temporarily unavailable')
  }

  let lastError = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options)
      
      // Handle rate limiting gracefully
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : BASE_RETRY_DELAY * Math.pow(2, attempt)
        console.warn(`⚠️ Rate limited (429). Waiting ${delay}ms before retry ${attempt + 1}/${retries}`)
        
        if (attempt < retries - 1) {
          await sleep(addJitter(delay))
          continue
        }
        throw new Error('Rate limit exceeded')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Cache successful response
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      })
      
      // Record success for circuit breaker
      recordSuccess()
      
      return data
    } catch (error) {
      lastError = error
      const isLastAttempt = attempt === retries - 1
      
      // Don't retry on certain errors
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        console.error('❌ JSON parse error - not retrying')
        break
      }
      
      if (isLastAttempt) {
        console.error(`❌ All ${retries} attempts failed:`, error.message)
        break
      }
      
      // Exponential backoff with jitter
      const delay = BASE_RETRY_DELAY * Math.pow(2, attempt)
      const delayWithJitter = addJitter(delay)
      console.warn(`⟳ Attempt ${attempt + 1}/${retries} failed. Retrying in ${Math.round(delayWithJitter)}ms...`)
      await sleep(delayWithJitter)
    }
  }

  // All retries exhausted - record failure
  recordFailure(lastError)
  
  // Try to return stale cache if available
  if (cached) {
    const age = Math.round((Date.now() - cached.timestamp) / 1000)
    console.warn(`⚠️ Using stale cache (${age}s old)`)
    return cached.data
  }
  
  throw lastError
}

/**
 * Fetch global market data including market cap, volume, and BTC dominance
 * @param {string} currency - Currency code (usd, eur, etc.)
 * @returns {Promise<Object>} Global market statistics
 */
export const getGlobalMarketData = async (currency = 'usd') => {
  try {
    console.log('🌍 Fetching global market data...')
    const data = await fetchWithRetry(`${COINGECKO_BASE_URL}/global`)
    
    const result = {
      totalMarketCap: data.data?.total_market_cap?.[currency] || 0,
      totalVolume: data.data?.total_volume?.[currency] || 0,
      btcDominance: data.data?.market_cap_percentage?.btc || 0,
      ethDominance: data.data?.market_cap_percentage?.eth || 0,
      marketCapChange24h: data.data?.market_cap_change_percentage_24h_usd || 0,
      activeCryptocurrencies: data.data?.active_cryptocurrencies || 0,
      markets: data.data?.markets || 0,
    }
    
    console.log('✅ Global market data fetched successfully')
    return result
  } catch (error) {
    console.warn('⚠️ Using mock global market data:', error.message)
    // Return mock data with demo flag
    return {
      ...MOCK_GLOBAL_DATA,
      isDemo: true,
    }
  }
}

/**
 * Fetch Fear & Greed Index from Alternative.me
 * @returns {Promise<Object>} Fear & Greed Index data
 */
export const getFearGreedIndex = async () => {
  try {
    console.log('😨 Fetching Fear & Greed Index...')
    const data = await fetchWithRetry('https://api.alternative.me/fng/', {}, 2) // Fewer retries for external API
    const indexData = data.data?.[0]
    
    const result = {
      value: parseInt(indexData?.value) || 50,
      valueClassification: indexData?.value_classification || 'Neutral',
      timestamp: indexData?.timestamp || Date.now(),
      timeUntilUpdate: indexData?.time_until_update || null,
    }
    
    console.log('✅ Fear & Greed Index fetched successfully')
    return result
  } catch (error) {
    console.warn('⚠️ Using mock Fear & Greed Index:', error.message)
    // Return mock data with demo flag
    return {
      ...MOCK_FEAR_GREED,
      isDemo: true,
    }
  }
}

/**
 * Fetch top coins by market cap with price and volume data
 * Implements 60-second cache for top 10 coins to reduce API calls
 * @param {number} limit - Number of coins to fetch (default: 10)
 * @param {string} currency - Currency code (usd, eur, etc.)
 * @returns {Promise<Array>} Array of top coins
 */
export const getTopCoins = async (limit = 10, currency = 'usd') => {
  // Check cache for top 10 coins specifically (60s cache)
  if (limit === 10) {
    const cacheKey = `top-coins-${limit}-${currency}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < TOP_COINS_CACHE_DURATION) {
      console.log('✓ Using cached top 10 coins (60s cache)')
      return cached.data
    }
  }

  try {
    console.log(`📊 Fetching top ${limit} coins...`)
    const data = await fetchWithRetry(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`
    )
    
    const coins = data.map((coin) => ({
      id: coin.id || '',
      symbol: coin.symbol?.toUpperCase() || '',
      name: coin.name || 'Unknown',
      image: coin.image || '',
      currentPrice: coin.current_price || 0,
      marketCap: coin.market_cap || 0,
      marketCapRank: coin.market_cap_rank || 0,
      totalVolume: coin.total_volume || 0,
      priceChange24h: coin.price_change_24h || 0,
      priceChangePercentage24h: coin.price_change_percentage_24h || 0,
      circulatingSupply: coin.circulating_supply || 0,
      totalSupply: coin.total_supply || null,
      maxSupply: coin.max_supply || null,
      ath: coin.ath || 0,
      athChangePercentage: coin.ath_change_percentage || 0,
      athDate: coin.ath_date || null,
      atl: coin.atl || 0,
      atlChangePercentage: coin.atl_change_percentage || 0,
      atlDate: coin.atl_date || null,
      lastUpdated: coin.last_updated || null,
      sparkline: coin.sparkline_in_7d?.price || [],
    }))

    // Cache top 10 coins for 60 seconds
    if (limit === 10) {
      const cacheKey = `top-coins-${limit}-${currency}`
      cache.set(cacheKey, {
        data: coins,
        timestamp: Date.now(),
      })
    }

    console.log(`✅ Top ${limit} coins fetched successfully`)
    return coins
  } catch (error) {
    console.warn(`⚠️ Using mock top ${limit} coins:`, error.message)
    // Return mock top coins (limited to requested amount)
    return MOCK_TOP_COINS.slice(0, limit).map(coin => ({
      ...coin,
      isDemo: true,
    }))
  }
}

// Removed getAllCoins - Market page now only shows Top 10 for better performance

/**
 * Search coins by name or symbol for Market page
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching coins (max 5 for dropdown)
 */
export const searchCoin = async (query) => {
  // Don't search if query is too short
  if (!query || query.trim().length < 2) {
    return []
  }

  try {
    const data = await fetchWithRetry(
      `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`
    )
    
    // Limit to top 5 results for dropdown
    const results = data.coins?.slice(0, 5).map((coin) => ({
      id: coin.id || '',
      name: coin.name || 'Unknown',
      symbol: coin.symbol?.toUpperCase() || '',
      marketCapRank: coin.market_cap_rank || null,
      thumb: coin.thumb || '',
      large: coin.large || '',
    })) || []

    return results
  } catch (error) {
    console.error('Error searching coins:', error)
    // Return empty array on error (graceful degradation)
    return []
  }
}

/**
 * Get detailed coin data by ID
 * @param {string} coinId - CoinGecko coin ID
 * @param {string} currency - Currency code (usd, eur, etc.)
 * @returns {Promise<Object>} Detailed coin data
 */
export const getCoinDetails = async (coinId, currency = 'usd') => {
  try {
    console.log(`🔍 Fetching details for ${coinId}...`)
    const data = await fetchWithRetry(
      `${COINGECKO_BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=true&developer_data=false&sparkline=true`
    )
    
    const result = {
      id: data.id || '',
      symbol: data.symbol?.toUpperCase() || '',
      name: data.name || 'Unknown',
      description: data.description?.en || '',
      image: data.image?.large || '',
      marketCapRank: data.market_cap_rank || 0,
      currentPrice: data.market_data?.current_price?.[currency] || 0,
      marketCap: data.market_data?.market_cap?.[currency] || 0,
      totalVolume: data.market_data?.total_volume?.[currency] || 0,
      high24h: data.market_data?.high_24h?.[currency] || 0,
      low24h: data.market_data?.low_24h?.[currency] || 0,
      priceChange24h: data.market_data?.price_change_24h || 0,
      priceChangePercentage24h: data.market_data?.price_change_percentage_24h || 0,
      priceChangePercentage7d: data.market_data?.price_change_percentage_7d || 0,
      priceChangePercentage30d: data.market_data?.price_change_percentage_30d || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      totalSupply: data.market_data?.total_supply || null,
      maxSupply: data.market_data?.max_supply || null,
      ath: data.market_data?.ath?.[currency] || 0,
      athChangePercentage: data.market_data?.ath_change_percentage?.[currency] || 0,
      athDate: data.market_data?.ath_date?.[currency] || null,
      atl: data.market_data?.atl?.[currency] || 0,
      atlChangePercentage: data.market_data?.atl_change_percentage?.[currency] || 0,
      atlDate: data.market_data?.atl_date?.[currency] || null,
      sparkline: data.market_data?.sparkline_7d?.price || [],
      categories: data.categories || [],
      links: {
        homepage: data.links?.homepage?.[0] || '',
        blockchain_site: data.links?.blockchain_site?.filter(Boolean) || [],
        official_forum_url: data.links?.official_forum_url?.filter(Boolean) || [],
        chat_url: data.links?.chat_url?.filter(Boolean) || [],
        twitter: data.links?.twitter_screen_name || '',
        subreddit: data.links?.subreddit_url || '',
      },
      communityData: {
        twitterFollowers: data.community_data?.twitter_followers || 0,
        redditSubscribers: data.community_data?.reddit_subscribers || 0,
      },
    }
    
    console.log(`✅ Details fetched for ${coinId}`)
    return result
  } catch (error) {
    console.warn(`⚠️ Using mock data for ${coinId}:`, error.message)
    
    // Try to find coin in mock data
    const mockCoin = MOCK_TOP_COINS.find(coin => coin.id === coinId)
    
    if (mockCoin) {
      return {
        id: mockCoin.id,
        symbol: mockCoin.symbol,
        name: mockCoin.name,
        description: `${mockCoin.name} is a leading cryptocurrency. (Demo mode - detailed data unavailable)`,
        image: mockCoin.image,
        marketCapRank: mockCoin.marketCapRank,
        currentPrice: mockCoin.currentPrice,
        marketCap: mockCoin.marketCap,
        totalVolume: mockCoin.totalVolume,
        high24h: mockCoin.currentPrice * 1.05,
        low24h: mockCoin.currentPrice * 0.95,
        priceChange24h: mockCoin.priceChange24h,
        priceChangePercentage24h: mockCoin.priceChangePercentage24h,
        priceChangePercentage7d: mockCoin.priceChangePercentage24h * 1.5,
        priceChangePercentage30d: mockCoin.priceChangePercentage24h * 3,
        circulatingSupply: mockCoin.circulatingSupply,
        totalSupply: mockCoin.circulatingSupply * 1.2,
        maxSupply: mockCoin.circulatingSupply * 1.5,
        ath: mockCoin.currentPrice * 2.5,
        athChangePercentage: -60,
        athDate: '2021-11-01T00:00:00.000Z',
        atl: mockCoin.currentPrice * 0.1,
        atlChangePercentage: 900,
        atlDate: '2020-03-13T00:00:00.000Z',
        sparkline: mockCoin.sparkline || [],
        categories: ['Cryptocurrency'],
        links: {
          homepage: '',
          blockchain_site: [],
          official_forum_url: [],
          chat_url: [],
          twitter: '',
          subreddit: '',
        },
        communityData: {
          twitterFollowers: 0,
          redditSubscribers: 0,
        },
        isDemo: true,
      }
    }
    
    // Return minimal fallback if coin not in mock data
    return {
      id: coinId,
      symbol: '',
      name: 'Unknown',
      description: 'Details unavailable - API connection issue',
      image: '',
      marketCapRank: 0,
      currentPrice: 0,
      marketCap: 0,
      totalVolume: 0,
      high24h: 0,
      low24h: 0,
      priceChange24h: 0,
      priceChangePercentage24h: 0,
      priceChangePercentage7d: 0,
      priceChangePercentage30d: 0,
      circulatingSupply: 0,
      totalSupply: null,
      maxSupply: null,
      ath: 0,
      athChangePercentage: 0,
      athDate: null,
      atl: 0,
      atlChangePercentage: 0,
      atlDate: null,
      sparkline: [],
      categories: [],
      links: {
        homepage: '',
        blockchain_site: [],
        official_forum_url: [],
        chat_url: [],
        twitter: '',
        subreddit: '',
      },
      communityData: {
        twitterFollowers: 0,
        redditSubscribers: 0,
      },
      isDemo: true,
      error: true,
    }
  }
}
