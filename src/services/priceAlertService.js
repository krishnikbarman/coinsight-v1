/**
 * Price Alert Service
 * Handles checking price alerts and triggering notifications
 */

import { supabase } from '../supabase/client'

/**
 * Check alerts for a specific user and coin
 * @param {string} userId - User ID
 * @param {string} coinSymbol - Coin symbol (e.g., 'BTC')
 * @param {number} currentPrice - Current price of the coin
 * @returns {Promise<Object>} Check results
 */
export const checkAlertsForUser = async (userId, coinSymbol, currentPrice) => {
  console.log(`🔍 Checking alerts for ${coinSymbol} at $${currentPrice}`)
  
  try {
    // Fetch active alerts for this user and coin
    const { data: alerts, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', coinSymbol)
      .eq('is_active', true)
      .is('triggered_at', null)

    if (error) {
      console.error('❌ Error fetching alerts:', error)
      return { success: false, error, triggered: [] }
    }

    if (!alerts || alerts.length === 0) {
      console.log(`   No active alerts for ${coinSymbol}`)
      return { success: true, triggered: [], checked: 0 }
    }

    console.log(`   Found ${alerts.length} active alerts to check`)

    const triggeredAlerts = []

    // Check each alert
    for (const alert of alerts) {
      console.log(`   ${'='.repeat(50)}`)
      console.log(`   🔍 Checking Alert ${alert.id.substring(0, 8)}`)
      console.log(`   Coin: ${alert.coin_name} (${alert.symbol})`)
      console.log(`   Condition: ${alert.condition}`)
      console.log(`   Target Price: $${alert.target_price}`)
      console.log(`   Current Price: $${currentPrice}`)
      
      const shouldTrigger = 
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price)

      console.log(`   Should Trigger: ${shouldTrigger ? '✅ YES' : '❌ NO'}`)

      if (shouldTrigger) {
        console.log(`   🔔 ALERT TRIGGERED for ${alert.coin_name}!`)
        console.log(`   📤 Starting notification pipeline...`)
        
        // Trigger notification
        const notificationResult = await triggerNotification(alert, currentPrice)
        
        if (notificationResult.success) {
          console.log(`   ✅ Notification created successfully`)
          // Mark alert as triggered
          await markAlertTriggered(alert.id)
          triggeredAlerts.push(alert)
          console.log(`   ✅ Alert marked as triggered - Pipeline complete!`)
        } else {
          console.error(`   ❌ Failed to trigger notification:`, notificationResult.error)
        }
      }
      console.log(`   ${'='.repeat(50)}`)
    }

    console.log(`   🎯 Result: ${triggeredAlerts.length} alerts triggered`)

    return {
      success: true,
      triggered: triggeredAlerts,
      checked: alerts.length
    }
  } catch (error) {
    console.error('❌ Exception in checkAlertsForUser:', error)
    return { success: false, error: error.message, triggered: [] }
  }
}

/**
 * Trigger a notification for an alert
 * @param {Object} alert - Alert object
 * @param {number} currentPrice - Current price that triggered the alert
 * @returns {Promise<Object>} Trigger result
 */
export const triggerNotification = async (alert, currentPrice) => {
  console.log(`📤 Triggering notification for alert ${alert.id.substring(0, 8)}`)
  console.log(`   Alert Details - Coin: ${alert.coin_name} (${alert.symbol}), Condition: ${alert.condition}, Target: $${alert.target_price}`)
  
  try {
    // Create notification message
    const direction = alert.condition === 'above' ? 'risen above' : 'fallen below'
    const message = `${alert.coin_name} (${alert.symbol}) has ${direction} $${alert.target_price}! Current price: $${currentPrice.toFixed(2)}`

    const notificationData = {
      user_id: alert.user_id,
      type: 'price_alert',
      coin: alert.symbol,
      quantity: 0,
      price: currentPrice,
      message: message,
      read: false,
      created_at: new Date().toISOString()
    }

    console.log('   📝 Notification message:', message)
    console.log('   💾 Inserting notification into database...')
    console.log('   📊 Notification data:', JSON.stringify(notificationData, null, 2))

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('   ❌ Notification insert failed:', error)
      console.error('   ❌ Error code:', error.code)
      console.error('   ❌ Error message:', error.message)
      return { success: false, error }
    }

    console.log('   ✅ Notification inserted successfully!')
    console.log('   ✅ Notification ID:', data.id)
    console.log('   ✅ Created at:', data.created_at)

    return { success: true, notification: data }
  } catch (error) {
    console.error('   ❌ Exception in triggerNotification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark an alert as triggered
 * @param {string} alertId - Alert ID
 * @returns {Promise<Object>} Update result
 */
export const markAlertTriggered = async (alertId) => {
  console.log(`🏷️ Marking alert ${alertId.substring(0, 8)} as triggered`)
  console.log(`   Updating alert status: is_active = false, triggered_at = NOW`)
  
  try {
    const triggeredTime = new Date().toISOString()
    const { error } = await supabase
      .from('price_alerts')
      .update({
        is_active: false,
        triggered_at: triggeredTime
      })
      .eq('id', alertId)

    if (error) {
      console.error('   ❌ Alert update failed:', error)
      console.error('   ❌ Error details:', JSON.stringify(error, null, 2))
      return { success: false, error }
    }

    console.log('   ✅ Alert marked as triggered at:', triggeredTime)

    console.log('   ✅ Alert deactivated and timestamped')
    return { success: true }
  } catch (error) {
    console.error('   ❌ Exception in markAlertTriggered:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check all alerts for a user against current prices
 * @param {string} userId - User ID
 * @param {Object} prices - Object with coin prices { coinId: { usd: price } }
 * @returns {Promise<Object>} Check results
 */
export const checkAllAlerts = async (userId, prices) => {
  console.log('🔄 Checking all alerts against current prices')
  console.log(`   User: ${userId}`)
  console.log(`   Prices available: ${Object.keys(prices).length} coins`)
  
  try {
    // Fetch all active alerts for user
    const { data: alerts, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('triggered_at', null)

    if (error) {
      console.error('❌ Error fetching all alerts:', error)
      return { success: false, error, triggered: [] }
    }

    if (!alerts || alerts.length === 0) {
      console.log('   No active alerts to check')
      return { success: true, triggered: [], checked: 0 }
    }

    console.log(`   Checking ${alerts.length} active alerts...`)

    const triggeredAlerts = []

    for (const alert of alerts) {
      console.log(`   ${'='.repeat(50)}`)
      console.log(`   🔍 Checking Alert ${alert.id.substring(0, 8)}`)
      console.log(`   Coin: ${alert.coin_name} (${alert.symbol})`)
      console.log(`   Coin ID: ${alert.coin_id}`)
      
      const currentPrice = prices[alert.coin_id]?.usd

      if (!currentPrice) {
        console.log(`   ⚠️ No price data available for ${alert.symbol} (${alert.coin_id})`)
        console.log(`   ${'='.repeat(50)}`)
        continue
      }

      console.log(`   Target Price: $${alert.target_price}`)
      console.log(`   Current Price: $${currentPrice}`)
      console.log(`   Condition: ${alert.condition}`)

      const shouldTrigger = 
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price)

      console.log(`   Should Trigger: ${shouldTrigger ? '✅ YES' : '❌ NO'}`)

      if (shouldTrigger) {
        console.log(`   🔔 ALERT TRIGGERED!`)
        console.log(`   📤 Starting notification pipeline...`)
        
        const notificationResult = await triggerNotification(alert, currentPrice)
        
        if (notificationResult.success) {
          console.log(`   ✅ Notification created successfully`)
          await markAlertTriggered(alert.id)
          triggeredAlerts.push({ alert, currentPrice })
          console.log(`   ✅ Alert marked as triggered - Pipeline complete!`)
        } else {
          console.error(`   ❌ Notification creation failed:`, notificationResult.error)
        }
      }
      console.log(`   ${'='.repeat(50)}`)
    }

    console.log(`   ✅ Check complete: ${triggeredAlerts.length} alerts triggered`)

    return {
      success: true,
      triggered: triggeredAlerts,
      checked: alerts.length
    }
  } catch (error) {
    console.error('❌ Exception in checkAllAlerts:', error)
    return { success: false, error: error.message, triggered: [] }
  }
}

/**
 * Fetch active alerts count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of active alerts
 */
export const getActiveAlertsCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('price_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('triggered_at', null)

    if (error) {
      console.error('Error fetching alerts count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Exception in getActiveAlertsCount:', error)
    return 0
  }
}

export default {
  checkAlertsForUser,
  triggerNotification,
  markAlertTriggered,
  checkAllAlerts,
  getActiveAlertsCount
}
