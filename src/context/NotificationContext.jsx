import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useAuth } from './AuthContext'
import { STORAGE_KEYS, getStorageItem } from '../utils/storage'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Maximum number of notifications to store
const MAX_NOTIFICATIONS = 50

export const NotificationProvider = ({ children }) => {
  const { user, session } = useAuth()
  
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState({
    portfolioUpdates: true,
    marketTrends: false,
    priceAlertsEnabled: true
  })
  const [loading, setLoading] = useState(true)

  // Debug: Log notification changes
  useEffect(() => {
    console.log(`📊  Notifications state updated. Count: ${notifications.length}`)
    if (notifications.length > 0) {
      console.log('   Latest notification:', notifications[0])
    }
  }, [notifications])

  // Load notifications and settings from Supabase when user logs in
  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !session) {
        setNotifications([])
        setSettings({ portfolioUpdates: true, marketTrends: false, priceAlertsEnabled: true })
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        // Check for localStorage migration
        await migrateNotificationsToSupabase(user.id)
        await migrateSettingsToSupabase(user.id)

        // Load settings from Supabase
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('portfolio_updates, market_trends, price_alerts_enabled, currency')
          .eq('user_id', user.id)
          .single()

        if (settingsError) {
          // If no settings exist, create default
          if (settingsError.code === 'PGRST116') {
            const { data: newSettings } = await supabase
              .from('user_settings')
              .insert({
                user_id: user.id,
                portfolio_updates: true,
                market_trends: false,
                price_alerts_enabled: true,
                currency: 'USD'
              })
              .select()
              .single()

            if (newSettings) {
              setSettings({
                portfolioUpdates: newSettings.portfolio_updates,
                marketTrends: newSettings.market_trends,
                priceAlertsEnabled: newSettings.price_alerts_enabled ?? true
              })
            }
          }
        } else if (settingsData) {
          setSettings({
            portfolioUpdates: settingsData.portfolio_updates,
            marketTrends: settingsData.market_trends,
            priceAlertsEnabled: settingsData.price_alerts_enabled ?? true
          })
        }

        // Load last 50 notifications from Supabase
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(MAX_NOTIFICATIONS)

        if (notificationsError) {
          console.error('Error loading notifications:', notificationsError)
        } else if (notificationsData) {
          const formattedNotifications = notificationsData.map(n => ({
            id: n.id,
            type: n.type,
            coin: n.coin,
            quantity: parseFloat(n.quantity),
            price: parseFloat(n.price),
            message: n.message,
            timestamp: new Date(n.created_at).getTime(),
            read: n.read
          }))
          setNotifications(formattedNotifications)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user, session])

  // Migrate localStorage notifications to Supabase (one-time)
  const migrateNotificationsToSupabase = async (userId) => {
    try {
      const localNotifications = getStorageItem(STORAGE_KEYS.NOTIFICATIONS, [])
      if (localNotifications.length === 0) return

      // Check if user already has notifications in Supabase
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (existing && existing.length > 0) {
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS)
        return
      }

      // Migrate notifications (limit to last 50)
      const notificationsToMigrate = localNotifications.slice(0, MAX_NOTIFICATIONS).map(n => ({
        user_id: userId,
        type: n.type || 'buy',
        coin: n.coin || n.symbol || 'Unknown',
        quantity: n.quantity || 0,
        price: n.price || 0,
        message: n.message || '',
        read: n.read || false,
        created_at: new Date(n.timestamp || Date.now()).toISOString()
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notificationsToMigrate)

      if (error) {
        console.error('Migration error:', error)
        return
      }

      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS)
    } catch (error) {
      console.error('Error migrating notifications:', error)
    }
  }

  // Migrate localStorage settings to Supabase (one-time)
  const migrateSettingsToSupabase = async (userId) => {
    try {
      const localSettings = getStorageItem(STORAGE_KEYS.SETTINGS, null)
      if (!localSettings) return

      // Check if user already has settings in Supabase
      const { data: existing } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('user_id', userId)
        .single()

      if (existing) {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS)
        return
      }

      // Migrate settings
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          portfolio_updates: localSettings.portfolioUpdates !== undefined ? localSettings.portfolioUpdates : true,
          market_trends: localSettings.marketTrends !== undefined ? localSettings.marketTrends : false,
          price_alerts_enabled: true,
          currency: getStorageItem(STORAGE_KEYS.CURRENCY, 'USD')
        })

      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Settings migration error:', error)
        return
      }

      localStorage.removeItem(STORAGE_KEYS.SETTINGS)
    } catch (error) {
      console.error('Error migrating settings:', error)
    }
  }

  // Format currency value
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Get relative time string
  const getRelativeTime = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  // Generate notification message based on type
  const generateMessage = (type, coin, quantity, price, customMessage) => {
    // If custom message provided, use it (for alerts)
    if (customMessage) {
      return customMessage;
    }

    const formattedPrice = formatPrice(price)
    
    switch (type) {
      case 'buy':
        return `You bought ${quantity} ${coin} at ${formattedPrice}`
      case 'sell':
        return `You sold ${quantity} ${coin} at ${formattedPrice}`
      case 'delete':
        return `You removed ${coin} from portfolio`
      case 'alert':
      case 'price_alert':
        return `Price alert for ${coin} at ${formattedPrice}`
      default:
        return ''
    }
  }

  // Add notification - supports both old format and new object format
  const addNotification = useCallback(async (typeOrObject, coin, quantity, price) => {
    console.log('='.repeat(60))
    console.log('📥 addNotification called')
    console.log('   Input:', typeOrObject)
    
    // Support for new object format (for alerts)
    let type, notifCoin, notifQuantity, notifPrice, customMessage;
    
    if (typeof typeOrObject === 'object') {
      // New object format: { type, coin, quantity, price, message }
      type = typeOrObject.type;
      notifCoin = typeOrObject.coin;
      notifQuantity = typeOrObject.quantity || 0;
      notifPrice = typeOrObject.price || 0;
      customMessage = typeOrObject.message;
      console.log('   📦 Using object format')
      console.log('   Type:', type)
      console.log('   Coin:', notifCoin)
      console.log('   Message:', customMessage)
    } else {
      // Old format: addNotification(type, coin, quantity, price)
      type = typeOrObject;
      notifCoin = coin;
      notifQuantity = quantity;
      notifPrice = price;
      customMessage = null;
      console.log('   📦 Using legacy format')
      console.log('   Type:', type)
      console.log('   Coin:', notifCoin)
    }

    // Check if portfolio updates are enabled (ALWAYS allow price alerts through)
    if (type !== 'alert' && type !== 'price_alert' && !settings.portfolioUpdates) {
      console.log('   ⚠️ Portfolio updates disabled, skipping non-alert notification')
      console.log('='.repeat(60))
      return // Don't create notification if disabled
    }

    if (!user) {
      console.error('   ❌ Cannot add notification: No user logged in')
      console.log('='.repeat(60))
      return
    }

    const message = customMessage || generateMessage(type, notifCoin, notifQuantity, notifPrice)
    const timestamp = Date.now()

    const notificationData = {
      user_id: user.id,
      type,
      coin: notifCoin,
      quantity: notifQuantity,
      price: notifPrice,
      message,
      read: false,
      created_at: new Date(timestamp).toISOString()
    }

    console.log('   💾 Inserting notification into Supabase')
    console.log('   📊 Data:', JSON.stringify(notificationData, null, 2))

    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) {
        console.error('   ❌ Supabase insert error:', error)
        console.error('   ❌ Error code:', error.code)
        console.error('   ❌ Error message:', error.message)
        console.error('   ❌ Error details:', JSON.stringify(error, null, 2))
        console.log('='.repeat(60))
        return
      }

      console.log('   ✅ Notification inserted successfully!')
      console.log('   ✅ Notification ID:', data.id)
      console.log('   ✅ Created at:', data.created_at)

      // Update local state immediately
      const newNotification = {
        id: data.id,
        type: data.type,
        coin: data.coin,
        quantity: parseFloat(data.quantity),
        price: parseFloat(data.price),
        message: data.message,
        timestamp: new Date(data.created_at).getTime(),
        read: data.read
      }

      console.log('   📋 Adding notification to local state')
      console.log('   📋 Notification object:', newNotification)

      setNotifications(prev => {
        // Check for duplicates
        if (prev.some(n => n.id === newNotification.id)) {
          console.log('   ⚠️ Notification already exists in state, skipping')
          console.log('='.repeat(60))
          return prev
        }
        const updated = [newNotification, ...prev]
        console.log(`   ✅ Added to state! Total notifications: ${updated.length}`)
        console.log('='.repeat(60))
        // Limit to MAX_NOTIFICATIONS
        return updated.slice(0, MAX_NOTIFICATIONS)
      })

      console.log('✅ Notification pipeline complete!')
    } catch (error) {
      console.error('   ❌ Exception adding notification:', error)
      console.error('   ❌ Stack:', error.stack)
      console.log('='.repeat(60))
    }
  }, [settings.portfolioUpdates, user, generateMessage])

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [user])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all as read:', error)
        return
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [user])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Error clearing notifications:', error)
        return
      }

      setNotifications([])
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }, [user])

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length
  }, [notifications])

  // Get latest notifications (for display)
  const getLatestNotifications = useCallback((count = 5) => {
    return notifications.slice(0, count)
  }, [notifications])

  // Simple toast notification function
  const showToast = useCallback((message, type = 'info') => {
    console.log(`🔔 Toast [${type.toUpperCase()}]: ${message}`)
    // For now, just log - can be enhanced with a UI toast component later
    // This prevents errors when components try to use showToast
  }, [])

  // Update settings (called from Settings page)
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Set up Supabase realtime subscription for instant notification updates
  useEffect(() => {
    if (!user || !session) {
      return
    }

    console.log('='.repeat(60))
    console.log('🔔 Setting up realtime notification subscription')
    console.log('   User ID:', user.id)
    console.log('   Listening for INSERT events on notifications table')

    // Create a channel for realtime notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('='.repeat(60))
          console.log('🔔 ⭐ NEW NOTIFICATION RECEIVED VIA REALTIME!')
          console.log('   Event:', payload.eventType)
          console.log('   Table:', payload.table)
          console.log('   Payload new:', JSON.stringify(payload.new, null, 2))
          
          // Add new notification to state
          const newNotification = {
            id: payload.new.id,
            type: payload.new.type,
            coin: payload.new.coin,
            quantity: parseFloat(payload.new.quantity),
            price: parseFloat(payload.new.price),
            message: payload.new.message,
            timestamp: new Date(payload.new.created_at).getTime(),
            read: payload.new.read
          }

          console.log('   📊 Notification object:', newNotification)

          setNotifications(prev => {
            // Check if notification already exists (prevent duplicates)
            if (prev.some(n => n.id === newNotification.id)) {
              console.log('   ⚠️ Notification already exists in state, skipping duplicate')
              console.log('='.repeat(60))
              return prev
            }
            const updated = [newNotification, ...prev]
            console.log(`   ✅ Added to state via realtime! Total notifications: ${updated.length}`)
            console.log('='.repeat(60))
            return updated.slice(0, MAX_NOTIFICATIONS)
          })
        }
      )
      .subscribe((status) => {
        console.log('   📡 Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('   ✅ Successfully subscribed to notifications!')
          console.log('   ✅ Will receive realtime updates for user:', user.id)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('   ❌ Subscription failed with CHANNEL_ERROR')
        } else if (status === 'TIMED_OUT') {
          console.error('   ❌ Subscription timed out')
        } else if (status === 'CLOSED') {
          console.log('   🚫 Subscription closed')
        }
        console.log('='.repeat(60))
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('='.repeat(60))
      console.log('🔕 Cleaning up notification subscription')
      console.log('   Removing channel...')
      supabase.removeChannel(channel)
      console.log('   ✅ Channel removed')
      console.log('='.repeat(60))
    }
  }, [user, session])

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    getUnreadCount,
    getLatestNotifications,
    getRelativeTime,
    showToast,
    settings,
    updateSettings,
    loading
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
