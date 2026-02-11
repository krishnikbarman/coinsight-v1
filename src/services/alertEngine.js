/**
 * Alert Engine Service
 * Background monitoring system that checks price alerts every 60 seconds
 * Triggers notifications when conditions are met
 */

import { supabase } from '../supabase/client'
import { getCoinPrices } from './coinService'

// Check interval: 60 seconds
const CHECK_INTERVAL = 60000

// Engine state
let intervalId = null
let currentUserId = null
let onAlertTriggeredCallback = null

/**
 * Start the alert engine for a specific user
 * @param {string} userId - Supabase user ID
 * @param {Function} onAlertTriggered - Optional callback for optimistic UI updates
 * @returns {boolean} Success status
 */
export const startAlertEngine = (userId, onAlertTriggered = null) => {
  if (!userId) {
    console.error('❌ Alert Engine: User ID is required')
    return false
  }

  // Stop existing engine if running
  if (intervalId) {
    console.log('⚠️ Alert Engine: Stopping existing engine')
    stopAlertEngine()
  }

  currentUserId = userId
  onAlertTriggeredCallback = onAlertTriggered

  console.log('🚀 Alert Engine: Starting for user', userId)
  console.log(`⏰ Check interval: ${CHECK_INTERVAL / 1000} seconds`)

  // Run first check immediately
  checkAlerts()

  // Schedule periodic checks
  intervalId = setInterval(() => {
    checkAlerts()
  }, CHECK_INTERVAL)

  return true
}

/**
 * Stop the alert engine
 * @returns {boolean} Success status
 */
export const stopAlertEngine = () => {
  if (!intervalId) {
    console.log('⚠️ Alert Engine: Not running')
    return false
  }

  console.log('🛑 Alert Engine: Stopping')
  clearInterval(intervalId)
  intervalId = null
  currentUserId = null
  onAlertTriggeredCallback = null

  return true
}

/**
 * Check all active alerts and trigger if conditions are met
 * Core engine logic
 */
const checkAlerts = async () => {
  if (!currentUserId) {
    console.error('❌ Alert Engine: No user ID set')
    return
  }

  try {
    console.log('🔍 Alert Engine: Checking alerts...')

    // Step 1: Fetch all active alerts for the user
    const { data: alerts, error: fetchError } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('is_active', true)
      .is('triggered_at', null)

    if (fetchError) {
      console.error('❌ Alert Engine: Error fetching alerts:', fetchError)
      return
    }

    if (!alerts || alerts.length === 0) {
      console.log('   No active alerts to check')
      return
    }

    console.log(`   Found ${alerts.length} active alerts`)

    // Step 2: Group alerts by coin_id to minimize API calls
    const coinGroups = new Map()
    alerts.forEach(alert => {
      if (!coinGroups.has(alert.coin_id)) {
        coinGroups.set(alert.coin_id, [])
      }
      coinGroups.get(alert.coin_id).push(alert)
    })

    console.log(`   Grouped into ${coinGroups.size} unique coins`)

    // Step 3: Fetch current prices for all coins
    const coinIds = Array.from(coinGroups.keys())
    console.log(`   Fetching prices for: ${coinIds.join(', ')}`)

    const prices = await getCoinPrices(coinIds, 'usd')

    if (!prices || Object.keys(prices).length === 0) {
      console.warn('⚠️ Alert Engine: No prices returned from API')
      return
    }

    console.log(`   Received prices for ${Object.keys(prices).length} coins`)

    // Step 4: Check each alert against current price
    const triggeredAlerts = []

    for (const [coinId, coinAlerts] of coinGroups.entries()) {
      const priceData = prices[coinId]

      if (!priceData || priceData.price === undefined) {
        console.warn(`   ⚠️ No price data for ${coinId}`)
        continue
      }

      const currentPrice = priceData.price

      console.log(`   ${coinId}: $${currentPrice.toFixed(2)}`)

      // Check each alert for this coin
      for (const alert of coinAlerts) {
        const shouldTrigger = checkCondition(
          alert.condition,
          currentPrice,
          alert.target_price
        )

        console.log(
          `     Alert ${alert.id.substring(0, 8)}: ` +
          `Target $${Number(alert.target_price).toFixed(2)} ${alert.condition} ` +
          `Current $${currentPrice.toFixed(2)} - ` +
          `${shouldTrigger ? '✅ TRIGGERING' : '❌ NOT MET'}`
        )

        if (shouldTrigger) {
          try {
            // Trigger the alert
            const success = await triggerAlert(alert, currentPrice)
            if (success) {
              triggeredAlerts.push(alert)
              console.log(`     ✅ Triggered successfully`)
            }
          } catch (error) {
            console.error(`     ❌ Failed to trigger:`, error.message)
          }
        }
      }
    }

    // Step 5: Report results
    if (triggeredAlerts.length > 0) {
      console.log(`🎯 Alert Engine: ${triggeredAlerts.length} alerts triggered`)
      
      // Call optimistic UI update callback if provided
      if (onAlertTriggeredCallback) {
        triggeredAlerts.forEach(alert => {
          onAlertTriggeredCallback(alert.id)
        })
      }
    } else {
      console.log('   No alerts triggered')
    }

  } catch (error) {
    console.error('❌ Alert Engine: Fatal error:', error)
  }
}

/**
 * Check if alert condition is met
 * @param {string} condition - 'above' or 'below'
 * @param {number} currentPrice - Current market price
 * @param {number} targetPrice - Target price from alert
 * @returns {boolean} True if condition is met
 */
const checkCondition = (condition, currentPrice, targetPrice) => {
  // Ensure both values are numbers for accurate comparison
  const current = Number(currentPrice)
  const target = Number(targetPrice)
  
  if (isNaN(current) || isNaN(target)) {
    console.warn('⚠️ Invalid price values for comparison:', { currentPrice, targetPrice })
    return false
  }
  
  if (condition === 'above') {
    return current >= target
  } else if (condition === 'below') {
    return current <= target
  }
  return false
}

/**
 * Trigger an alert (update Supabase + create notification)
 * @param {Object} alert - Alert object from database
 * @param {number} currentPrice - Current price that triggered the alert
 * @returns {Promise<boolean>} Success status
 */
const triggerAlert = async (alert, currentPrice) => {
  try {
    const now = new Date().toISOString()

    console.log('     📋 Triggering alert atomically...')
    console.log('     📋 Alert ID:', alert.id.substring(0, 8))
    console.log('     📋 Ensuring alert is still active and not triggered...')

    // Step 1: Update alert status in Supabase with atomic check
    // Only update if alert is STILL active and NOT triggered (prevents race conditions)
    const { data: updateData, error: updateError } = await supabase
      .from('price_alerts')
      .update({
        is_active: false,
        triggered_at: now
      })
      .eq('id', alert.id)
      .eq('is_active', true)  // Only update if still active
      .is('triggered_at', null)  // Only update if not already triggered
      .select()

    if (updateError) {
      console.error('     ❌ Failed to update alert:', updateError)
      return false
    }

    // If no rows were updated, alert was already triggered by another process
    if (!updateData || updateData.length === 0) {
      console.log('     ⚠️ Alert was already triggered by another process, skipping')
      return false
    }

    console.log('     ✅ Alert marked as triggered')
    console.log('     ✅ is_active:', false)
    console.log('     ✅ triggered_at:', now)

    // Step 2: Create notification message
    const direction = alert.condition === 'above' ? 'risen above' : 'fallen below'
    const message = `${alert.coin_name} (${alert.symbol}) has ${direction} $${parseFloat(alert.target_price).toFixed(2)}! Current price: $${currentPrice.toFixed(2)}`

    console.log('     📝 Creating notification...')
    console.log('     📝 Message:', message)
    console.log('     📝 User ID:', alert.user_id)
    console.log('     📝 Type: price_alert')

    // Step 3: Insert notification row
    const notificationData = {
      user_id: alert.user_id,
      type: 'price_alert',
      coin: alert.symbol,
      quantity: 0,
      price: currentPrice,
      message: message,
      read: false,
      created_at: now
    }

    const { data: notifData, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (notificationError) {
      console.error('     ❌ Failed to create notification:', notificationError)
      console.error('     ❌ Error code:', notificationError.code)
      console.error('     ❌ Error message:', notificationError.message)
      // Alert was updated but notification failed
      // Still return true since alert was marked as triggered
      return true
    }

    console.log('     ✅ Notification created successfully!')
    console.log('     ✅ Notification ID:', notifData.id)
    console.log('     ✅ Realtime should broadcast this insert now...')

    return true
  } catch (error) {
    console.error('     ❌ Exception in triggerAlert:', error)
    return false
  }
}

/**
 * Get engine status
 * @returns {Object} Status information
 */
export const getEngineStatus = () => {
  return {
    isRunning: intervalId !== null,
    userId: currentUserId,
    checkInterval: CHECK_INTERVAL
  }
}

/**
 * Force an immediate check (for testing/debugging)
 * @returns {Promise<void>}
 */
export const forceCheck = async () => {
  if (!currentUserId) {
    console.error('❌ Alert Engine: Not started')
    return
  }
  console.log('🔄 Alert Engine: Forcing immediate check')
  await checkAlerts()
}

export default {
  startAlertEngine,
  stopAlertEngine,
  getEngineStatus,
  forceCheck
}
