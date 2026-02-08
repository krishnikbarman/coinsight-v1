/**
 * History Utilities
 * Manage portfolio snapshot history in localStorage
 * Tracks daily portfolio values for comparison and analytics
 */

import { STORAGE_KEYS, getStorageItem, setStorageItem } from './storage'

const MAX_HISTORY_DAYS = 90

/**
 * Get portfolio history from localStorage
 * @returns {Array} - Array of snapshot objects { date, value, timestamp }
 */
export const getPortfolioHistory = () => {
  return getStorageItem(STORAGE_KEYS.HISTORY, [])
}

/**
 * Save snapshot to portfolio history
 * Only saves one snapshot per day (based on date string)
 * @param {number} portfolioValue - Current total portfolio value
 * @returns {boolean} - Success status
 */
export const savePortfolioSnapshot = (portfolioValue) => {
  try {
    if (portfolioValue <= 0) return false
    
    const today = new Date()
    const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
    const timestamp = today.getTime()
    
    let history = getPortfolioHistory()
    
    // Check if today's snapshot already exists
    const todayIndex = history.findIndex(item => item.date === dateString)
    
    if (todayIndex >= 0) {
      // Update today's snapshot
      history[todayIndex] = { date: dateString, value: portfolioValue, timestamp }
    } else {
      // Add new snapshot
      history.push({ date: dateString, value: portfolioValue, timestamp })
    }
    
    // Sort by date (oldest first)
    history.sort((a, b) => new Date(a.date) - new Date(b.date))
    
    // Keep only last MAX_HISTORY_DAYS
    if (history.length > MAX_HISTORY_DAYS) {
      history = history.slice(-MAX_HISTORY_DAYS)
    }
    
    return setStorageItem(STORAGE_KEYS.HISTORY, history)
  } catch (error) {
    console.error('Error saving portfolio snapshot:', error)
    return false
  }
}

/**
 * Get portfolio value from N days ago
 * @param {number} daysAgo - Number of days in the past
 * @returns {Object|null} - Snapshot object or null if not found
 */
export const getSnapshotDaysAgo = (daysAgo) => {
  try {
    const history = getPortfolioHistory()
    if (history.length === 0) return null
    
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - daysAgo)
    const targetDateString = targetDate.toISOString().split('T')[0]
    
    // Try to find exact match
    let snapshot = history.find(item => item.date === targetDateString)
    
    // If no exact match, find closest date before target
    if (!snapshot) {
      const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date))
      snapshot = sortedHistory.find(item => new Date(item.date) <= targetDate)
    }
    
    return snapshot || null
  } catch (error) {
    console.error('Error getting snapshot:', error)
    return null
  }
}

/**
 * Get portfolio history for a specific time range
 * @param {number} days - Number of days to retrieve (7, 30, 90)
 * @returns {Array} - Array of snapshots within range
 */
export const getHistoryForRange = (days) => {
  try {
    const history = getPortfolioHistory()
    if (history.length === 0) return []
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return history.filter(item => new Date(item.date) >= cutoffDate)
  } catch (error) {
    console.error('Error getting history range:', error)
    return []
  }
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
 * Normalize historical data to percentage starting from 100
 * @param {Array} data - Array of { date, value } objects
 * @returns {Array} - Normalized array with percentage values
 */
export const normalizeToPercentage = (data) => {
  if (data.length === 0) return []
  
  const firstValue = data[0].value
  if (firstValue === 0) return data.map(item => ({ ...item, percentage: 100 }))
  
  return data.map(item => ({
    ...item,
    percentage: (item.value / firstValue) * 100
  }))
}

/**
 * Clear all portfolio history
 * @returns {boolean} - Success status
 */
export const clearPortfolioHistory = () => {
  try {
    return setStorageItem(STORAGE_KEYS.HISTORY, [])
  } catch (error) {
    console.error('Error clearing history:', error)
    return false
  }
}

/**
 * Get statistics for portfolio history
 * @returns {Object} - Stats including min, max, average
 */
export const getHistoryStats = () => {
  const history = getPortfolioHistory()
  
  if (history.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      count: 0,
      firstSnapshot: null,
      lastSnapshot: null
    }
  }
  
  const values = history.map(h => h.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const average = values.reduce((sum, val) => sum + val, 0) / values.length
  
  return {
    min,
    max,
    average,
    count: history.length,
    firstSnapshot: history[0],
    lastSnapshot: history[history.length - 1]
  }
}

export default {
  getPortfolioHistory,
  savePortfolioSnapshot,
  getSnapshotDaysAgo,
  getHistoryForRange,
  calculatePercentageChange,
  normalizeToPercentage,
  clearPortfolioHistory,
  getHistoryStats
}
