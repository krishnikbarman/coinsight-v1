/**
 * Storage utility for CoinSight app
 * Provides namespaced localStorage keys and safe reset functionality
 */

// App-scoped localStorage keys
export const STORAGE_KEYS = {
  PORTFOLIO: 'coinsight_portfolio',
  TRANSACTIONS: 'coinsight_transactions',
  NOTIFICATIONS: 'coinsight_notifications',
  SETTINGS: 'coinsight_settings',
  CURRENCY: 'coinsight_currency',
  HISTORY: 'coinsight_history'
}

// Default values for app state
const DEFAULT_VALUES = {
  [STORAGE_KEYS.PORTFOLIO]: [],
  [STORAGE_KEYS.TRANSACTIONS]: [],
  [STORAGE_KEYS.NOTIFICATIONS]: [],
  [STORAGE_KEYS.SETTINGS]: {
    portfolioUpdates: true,
    marketTrends: false
  },
  [STORAGE_KEYS.CURRENCY]: 'USD',
  [STORAGE_KEYS.HISTORY]: []
}

/**
 * Reset all CoinSight app data from localStorage
 * Only removes app-specific keys, not other browser data
 * @returns {boolean} Success status
 */
export const resetAppData = () => {
  try {
    // Remove all app-scoped keys
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })

    // Set safe defaults to prevent app crashes
    Object.entries(DEFAULT_VALUES).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value))
    })

    return true
  } catch (error) {
    console.error('Error resetting app data:', error)
    return false
  }
}

/**
 * Get item from localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed value or default
 */
export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error)
    return defaultValue
  }
}

/**
 * Set item in localStorage with error handling
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded!')
    }
    return false
  }
}

/**
 * Remove item from localStorage with error handling
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error)
    return false
  }
}
