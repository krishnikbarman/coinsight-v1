/**
 * Alert Service - Data persistence layer for price alerts
 * Handles Supabase database operations for user price alerts
 */

import { supabase } from '../supabase/client';

/**
 * Get all active alerts for the current user
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Array>} Array of active alerts
 */
export const getActiveAlerts = async (userId) => {
  try {
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching alerts:', error.message);
      throw error;
    }

    // Convert Supabase format to app format
    const alerts = data.map(alert => ({
      id: alert.id,
      coinId: alert.coin_id,
      coinName: alert.coin_name,
      symbol: alert.symbol,
      targetPrice: parseFloat(alert.target_price),
      condition: alert.condition,
      isActive: alert.is_active,
      triggeredAt: alert.triggered_at,
      createdAt: alert.created_at
    }));

    return alerts;
  } catch (error) {
    console.error('❌ Error in getActiveAlerts:', error);
    return [];
  }
};

/**
 * Get all alerts for a specific coin
 * @param {string} userId - Supabase user ID
 * @param {string} coinId - Coin ID
 * @returns {Promise<Array>} Array of alerts for the coin
 */
export const getAlertsByCoin = async (userId, coinId) => {
  try {
    if (!userId || !coinId) {
      return [];
    }

    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('coin_id', coinId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching coin alerts:', error.message);
      throw error;
    }

    // Convert Supabase format to app format
    const alerts = data.map(alert => ({
      id: alert.id,
      coinId: alert.coin_id,
      coinName: alert.coin_name,
      symbol: alert.symbol,
      targetPrice: parseFloat(alert.target_price),
      condition: alert.condition,
      isActive: alert.is_active,
      triggeredAt: alert.triggered_at,
      createdAt: alert.created_at
    }));

    return alerts;
  } catch (error) {
    console.error('❌ Error in getAlertsByCoin:', error);
    return [];
  }
};

/**
 * Create a new price alert
 * @param {Object} alertData - Alert data
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Object>} Created alert
 */
export const createAlert = async (alertData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID required for creating alerts');
    }

    const { coinId, coinName, symbol, targetPrice, condition } = alertData;

    // Validate input
    if (!coinId || !coinName || !symbol || !targetPrice || !condition) {
      throw new Error('Missing required alert data');
    }

    if (!['above', 'below'].includes(condition)) {
      throw new Error('Invalid condition. Must be "above" or "below"');
    }

    if (targetPrice <= 0) {
      throw new Error('Target price must be greater than 0');
    }

    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        coin_id: coinId,
        coin_name: coinName,
        symbol: symbol,
        target_price: targetPrice,
        condition: condition,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      coinId: data.coin_id,
      coinName: data.coin_name,
      symbol: data.symbol,
      targetPrice: parseFloat(data.target_price),
      condition: data.condition,
      isActive: data.is_active,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error('❌ Error in createAlert:', error);
    throw error;
  }
};

/**
 * Delete an alert
 * @param {string} alertId - Alert UUID
 * @param {string} userId - Supabase user ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAlert = async (alertId, userId) => {
  try {
    if (!userId || !alertId) {
      throw new Error('User ID and Alert ID required');
    }

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('❌ Error in deleteAlert:', error);
    throw error;
  }
};

/**
 * Mark alert as triggered and deactivate it
 * @param {string} alertId - Alert UUID
 * @param {string} userId - Supabase user ID
 * @returns {Promise<boolean>} Success status
 */
export const triggerAlert = async (alertId, userId) => {
  try {
    if (!userId || !alertId) {
      throw new Error('User ID and Alert ID required');
    }

    const { error } = await supabase
      .from('price_alerts')
      .update({
        is_active: false,
        triggered_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('❌ Error in triggerAlert:', error);
    throw error;
  }
};

/**
 * Deactivate an alert without marking as triggered
 * @param {string} alertId - Alert UUID
 * @param {string} userId - Supabase user ID
 * @returns {Promise<boolean>} Success status
 */
export const deactivateAlert = async (alertId, userId) => {
  try {
    if (!userId || !alertId) {
      throw new Error('User ID and Alert ID required');
    }

    const { error } = await supabase
      .from('price_alerts')
      .update({
        is_active: false
      })
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('❌ Error in deactivateAlert:', error);
    throw error;
  }
};

/**
 * Evaluate alert immediately after creation with current price
 * If conditions are met, trigger the alert and create notification
 * @param {Object} alert - The newly created alert object
 * @param {number} currentPrice - Current market price
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Object>} Result with triggered status and notification
 */
export const evaluateAlertImmediately = async (alert, currentPrice, userId) => {
  try {
    let shouldTrigger = false;

    // Evaluate trigger conditions
    if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
      shouldTrigger = true;
    }

    if (!shouldTrigger) {
      return {
        triggered: false,
        alert: alert
      };
    }

    // 1. Update alert status in database
    const { error: updateError } = await supabase
      .from('price_alerts')
      .update({
        is_active: false,
        triggered_at: new Date().toISOString()
      })
      .eq('id', alert.id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Error updating alert status:', updateError);
      throw updateError;
    }

    // 2. Create notification
    const conditionText = alert.condition === 'above' ? 'above' : 'below';
    const message = `${alert.symbol.toUpperCase()} crossed your ${conditionText} target of $${alert.targetPrice.toLocaleString()}. Current price: $${currentPrice.toLocaleString()}`;

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'alert',
        coin: alert.symbol,
        quantity: alert.targetPrice, // Store target price in quantity field
        price: currentPrice,
        message: message,
        read: false
      })
      .select()
      .single();

    if (notificationError) {
      console.error('❌ Error creating notification:', notificationError);
      throw notificationError;
    }

    return {
      triggered: true,
      alert: {
        ...alert,
        isActive: false,
        triggeredAt: new Date().toISOString()
      },
      notification: {
        id: notification.id,
        type: notification.type,
        coin: notification.coin,
        quantity: parseFloat(notification.quantity),
        price: parseFloat(notification.price),
        message: notification.message,
        timestamp: new Date(notification.created_at).getTime(),
        read: notification.read
      }
    };
  } catch (error) {
    console.error('❌ Error in evaluateAlertImmediately:', error);
    throw error;
  }
};

export default {
  getActiveAlerts,
  getAlertsByCoin,
  createAlert,
  deleteAlert,
  triggerAlert,
  deactivateAlert,
  evaluateAlertImmediately
};
