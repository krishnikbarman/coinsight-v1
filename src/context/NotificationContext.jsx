import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '../utils/storage'

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
  // Load notifications from localStorage
  const [notifications, setNotifications] = useState(() => {
    return getStorageItem(STORAGE_KEYS.NOTIFICATIONS, [])
  })

  // Load notification settings from localStorage
  const [settings, setSettings] = useState(() => {
    return getStorageItem(STORAGE_KEYS.SETTINGS, {
      portfolioUpdates: true,
      marketTrends: false
    })
  })

  // Persist notifications to localStorage
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications)
  }, [notifications])

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
  const addNotification = useCallback((type, coin, quantity, price) => {
    // Check if portfolio updates are enabled
    if (!settings.portfolioUpdates) {
      return // Don't create notification if disabled
    }

    const notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      coin,
      quantity,
      price,
      message: generateMessage(type, coin, quantity, price),
      timestamp: Date.now(),
      read: false
    }

    setNotifications(prev => {
      const updated = [notification, ...prev]
      // Limit to MAX_NOTIFICATIONS
      return updated.slice(0, MAX_NOTIFICATIONS)
    })
  }, [settings.portfolioUpdates])

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

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
    settings
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
