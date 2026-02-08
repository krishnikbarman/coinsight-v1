/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol ($ or ₹)
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = '$', decimals = 2) => {
  return `${currency}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`
}

/**
 * Format a percentage value
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/**
 * Format a large number with abbreviations (K, M, B, T)
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
export const formatLargeNumber = (num) => {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toFixed(2)
}

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Original value
 * @param {number} newValue - New value
 * @returns {number} - Percentage change
 */
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Sort array of objects by a key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} - Sorted array
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
}

/**
 * Generate a random color in hex format
 * @returns {string} - Hex color string
 */
export const randomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16)
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Get color based on profit/loss value
 * @param {number} value - Profit/loss value
 * @returns {string} - Tailwind color class
 */
export const getPLColor = (value) => {
  if (value > 0) return 'text-neon-green'
  if (value < 0) return 'text-neon-pink'
  return 'text-gray-400'
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncate = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export default {
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  calculatePercentageChange,
  debounce,
  sortBy,
  randomColor,
  isValidEmail,
  getPLColor,
  deepClone,
  truncate
}
