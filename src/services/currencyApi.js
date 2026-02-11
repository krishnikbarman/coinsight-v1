/**
 * Currency API Service
 * Fetches real-time exchange rates from public API
 */

// Using exchangerate-api.com (free tier - no API key needed for basic usage)
const EXCHANGE_API_BASE = 'https://api.exchangerate-api.com/v4/latest'

// Cache exchange rates to minimize API calls
let exchangeRatesCache = null
let lastFetchTime = 0
const CACHE_DURATION = 3600000 // 1 hour

/**
 * Supported currencies
 * NOTE: Only USD is supported in v1. Multi-currency coming soon.
 */
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' }
  // INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' }, // Coming soon
  // EUR: { symbol: '€', name: 'Euro', code: 'EUR' } // Coming soon
}

/**
 * Fetch exchange rates from USD base
 * @returns {Promise<Object>} Exchange rates object
 * NOTE: Disabled for v1 - only USD supported. Returns USD=1 immediately.
 */
export const fetchExchangeRates = async () => {
  // DISABLED: Multi-currency support coming soon
  // For now, only USD is supported, so no API call needed
  return {
    base: 'USD',
    rates: {
      USD: 1
    },
    timestamp: new Date().toISOString(),
    disabled: true
  }
  
  /* Original multi-currency logic (will be re-enabled in future)
  try {
    const now = Date.now()
    if (exchangeRatesCache && (now - lastFetchTime) < CACHE_DURATION) {
      return exchangeRatesCache
    }

    const response = await fetch(`${EXCHANGE_API_BASE}/USD`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`)
    }

    const data = await response.json()
    
    exchangeRatesCache = {
      base: 'USD',
      rates: {
        USD: 1,
        INR: data.rates.INR || 83.12,
        EUR: data.rates.EUR || 0.92
      },
      timestamp: data.time_last_updated || new Date().toISOString()
    }
    
    lastFetchTime = now
    return exchangeRatesCache
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return {
      base: 'USD',
      rates: { USD: 1, INR: 83.12, EUR: 0.92 },
      timestamp: new Date().toISOString(),
      fallback: true
    }
  }
  */
}

/**
 * Convert amount from USD to target currency
 * @param {number} amountInUSD - Amount in USD
 * @param {string} targetCurrency - Target currency code (USD, INR, EUR)
 * @param {Object} rates - Exchange rates object
 * @returns {number} Converted amount
 * NOTE: Only USD supported in v1, always returns same value
 */
export const convertCurrency = (amountInUSD, targetCurrency, rates) => {
  // DISABLED: Multi-currency support coming soon
  // Always return USD value (no conversion needed)
  return amountInUSD
  
  /* Original multi-currency logic (will be re-enabled in future)
  if (!rates || !rates.rates) {
    console.warn('No exchange rates available, returning USD amount')
    return amountInUSD
  }
  
  const rate = rates.rates[targetCurrency]
  if (!rate) {
    console.warn(`Rate not found for ${targetCurrency}, returning USD amount`)
    return amountInUSD
  }
  
  return amountInUSD * rate
  */
}

/**
 * Format currency value with appropriate symbol and formatting
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (USD, INR, EUR)
 * @returns {string} Formatted currency string
 */
export const formatCurrencyValue = (amount, currencyCode) => {
  const currencyInfo = SUPPORTED_CURRENCIES[currencyCode]
  if (!currencyInfo) {
    return `$${amount.toFixed(2)}`
  }
  
  const symbol = currencyInfo.symbol
  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return `${symbol}${formattedAmount}`
}

/**
 * Get currency info
 * @param {string} currencyCode - Currency code
 * @returns {Object} Currency information
 */
export const getCurrencyInfo = (currencyCode) => {
  return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD
}

export default {
  SUPPORTED_CURRENCIES,
  fetchExchangeRates,
  convertCurrency,
  formatCurrencyValue,
  getCurrencyInfo
}
