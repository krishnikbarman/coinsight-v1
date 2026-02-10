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
    marketTrends: false
  })
  const [loading, setLoading] = useState(true)

  // Load notifications and settings from Supabase when user logs in
  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !session) {
        setNotifications([])
        setSettings({ portfolioUpdates: true, marketTrends: false })
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
          .select('portfolio_updates, market_trends, currency')
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
                currency: 'USD'
              })
              .select()
              .single()

            if (newSettings) {
              setSettings({
                portfolioUpdates: newSettings.portfolio_updates,
                marketTrends: newSettings.market_trends
              })
            }
          }
        } else if (settingsData) {
          setSettings({
            portfolioUpdates: settingsData.portfolio_updates,
            marketTrends: settingsData.market_trends
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
  const generateMessage = (type, coin, quantity, price) => {
    const formattedPrice = formatPrice(price)
    
    switch (type) {
      case 'buy':
        return `You bought ${quantity} ${coin} at ${formattedPrice}`
      case 'sell':
        return `You sold ${quantity} ${coin} at ${formattedPrice}`
      case 'delete':
        return `You removed ${coin} from portfolio`
      default:
        return ''
    }
  }

  // Add notification
  const addNotification = useCallback(async (type, coin, quantity, price) => {
    // Check if portfolio updates are enabled
    if (!settings.portfolioUpdates) {
      return // Don't create notification if disabled
    }

    if (!user) {
      console.warn('Cannot add notification: No user logged in')
      return
    }

    const message = generateMessage(type, coin, quantity, price)
    const timestamp = Date.now()

    const notificationData = {
      user_id: user.id,
      type,
      coin,
      quantity,
      price,
      message,
      read: false,
      created_at: new Date(timestamp).toISOString()
    }

    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) {
        console.error('Error adding notification:', error)
        return
      }

      // Update local state
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

      setNotifications(prev => {
        const updated = [newNotification, ...prev]
        // Limit to MAX_NOTIFICATIONS
        return updated.slice(0, MAX_NOTIFICATIONS)
      })
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }, [settings.portfolioUpdates, user])

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

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    getUnreadCount,
    getLatestNotifications,
    getRelativeTime,
    settings,
    loading
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
