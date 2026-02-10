/**
 * History Utilities
 * Manage portfolio snapshot history in Supabase
 * Tracks daily portfolio values for comparison and analytics
 */

import { supabase } from '../supabase/client'
import { STORAGE_KEYS, getStorageItem } from './storage'

const MAX_HISTORY_DAYS = 90

/**
 * Get portfolio history from Supabase
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of snapshot objects { date, value, timestamp }
 */
export const getPortfolioHistory = async (userId) => {
  try {
    if (!userId) {
      return []
    }

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: true })
      .limit(MAX_HISTORY_DAYS)

    if (error) {
      console.error('Error fetching portfolio history:', error)
      return []
    }

    // Convert to app format
    return data.map(snapshot => ({
      date: snapshot.snapshot_date,
      value: parseFloat(snapshot.total_value),
      timestamp: new Date(snapshot.created_at).getTime()
    }))
  } catch (error) {
    console.error('Error in getPortfolioHistory:', error)
    return []
  }
}

/**
 * Save snapshot to portfolio history in Supabase
 * Only saves one snapshot per day (upserts on conflict)
 * @param {number} portfolioValue - Current total portfolio value
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const savePortfolioSnapshot = async (portfolioValue, userId) => {
  try {
    if (portfolioValue <= 0) return false
    if (!userId) {
      console.warn('Cannot save snapshot: No user ID provided')
      return false
    }
    
    const today = new Date()
    const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
    
    // Use upsert to update existing snapshot or create new one
    const { error } = await supabase
      .from('portfolio_snapshots')
      .upsert({
        user_id: userId,
        snapshot_date: dateString,
        total_value: portfolioValue
      }, {
        onConflict: 'user_id,snapshot_date'
      })

    if (error) {
      console.error('Error saving portfolio snapshot:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error saving portfolio snapshot:', error)
    return false
  }
}

/**
 * Get portfolio value from N days ago
 * @param {number} daysAgo - Number of days in the past
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - Snapshot object or null if not found
 */
export const getSnapshotDaysAgo = async (daysAgo, userId) => {
  try {
    if (!userId) return null

    const history = await getPortfolioHistory(userId)
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
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of snapshots within range
 */
export const getHistoryForRange = async (days, userId) => {
  try {
    if (!userId) return []

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffDateString = cutoffDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', cutoffDateString)
      .order('snapshot_date', { ascending: true })

    if (error) {
      console.error('Error getting history range:', error)
      return []
    }

    return data.map(snapshot => ({
      date: snapshot.snapshot_date,
      value: parseFloat(snapshot.total_value),
      timestamp: new Date(snapshot.created_at).getTime()
    }))
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
 * Clear all portfolio history for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const clearPortfolioHistory = async (userId) => {
  try {
    if (!userId) {
      console.warn('Cannot clear history: No user ID provided')
      return false
    }

    const { error } = await supabase
      .from('portfolio_snapshots')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error clearing history:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error clearing history:', error)
    return false
  }
}

/**
 * Get statistics for portfolio history
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Stats including min, max, average
 */
export const getHistoryStats = async (userId) => {
  try {
    if (!userId) {
      return {
        min: 0,
        max: 0,
        average: 0,
        count: 0,
        firstSnapshot: null,
        lastSnapshot: null
      }
    }

    const history = await getPortfolioHistory(userId)
    
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
  } catch (error) {
    console.error('Error getting history stats:', error)
    return {
      min: 0,
      max: 0,
      average: 0,
      count: 0,
      firstSnapshot: null,
      lastSnapshot: null
    }
  }
}

/**
 * Migrate localStorage history to Supabase (one-time migration)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const migrateHistoryToSupabase = async (userId) => {
  try {
    if (!userId) return false

    // Check if localStorage has history data
    const localHistory = getStorageItem(STORAGE_KEYS.HISTORY, [])
    if (localHistory.length === 0) return true // Nothing to migrate

    // Check if user already has data in Supabase
    const { data: existing } = await supabase
      .from('portfolio_snapshots')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existing && existing.length > 0) {
      // Clear localStorage after successful check
      localStorage.removeItem(STORAGE_KEYS.HISTORY)
      return true
    }

    // Migrate each snapshot
    const snapshots = localHistory.map(item => ({
      user_id: userId,
      snapshot_date: item.date,
      total_value: item.value
    }))

    const { error } = await supabase
      .from('portfolio_snapshots')
      .upsert(snapshots, {
        onConflict: 'user_id,snapshot_date'
      })

    if (error) {
      console.error('Migration error:', error)
      return false
    }
    
    // Clear localStorage after successful migration
    localStorage.removeItem(STORAGE_KEYS.HISTORY)
    
    return true
  } catch (error) {
    console.error('Error migrating history:', error)
    return false
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
  getHistoryStats,
  migrateHistoryToSupabase
}
