import React from 'react'
import { useNotifications } from '../context/NotificationContext'

const NotificationPanel = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    getUnreadCount,
    getRelativeTime 
  } = useNotifications()
  
  const unreadCount = getUnreadCount()

  // Get icon and color based on notification type
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'buy':
        return {
          icon: '📈',
          color: 'text-neon-green',
          bgColor: 'bg-neon-green/10',
          borderColor: 'border-neon-green/30'
        }
      case 'sell':
        return {
          icon: '📉',
          color: 'text-neon-pink',
          bgColor: 'bg-neon-pink/10',
          borderColor: 'border-neon-pink/30'
        }
      case 'delete':
        return {
          icon: '🗑️',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30'
        }
      default:
        return {
          icon: '📱',
          color: 'text-neon-blue',
          bgColor: 'bg-neon-blue/10',
          borderColor: 'border-neon-blue/30'
        }
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div 
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-dark-secondary 
          border-l border-dark-tertiary shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Fixed Header Section */}
        <div className="flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-tertiary">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-neon-pink text-white text-xs rounded-full font-semibold">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-tertiary rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-tertiary bg-dark-secondary">
              <button
                onClick={markAllAsRead}
                className="text-sm text-neon-blue hover:text-neon-blue/80 transition-colors font-medium"
                disabled={unreadCount === 0}
              >
                Mark all as read
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-neon-pink hover:text-neon-pink/80 transition-colors font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Notifications List */}
        <div 
          className="flex-1 overflow-y-auto scroll-smooth notification-scrollbar"
          style={{
            maxHeight: '400px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(96, 165, 250, 0.6) transparent'
          }}
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[300px]">
              <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-2">No notifications yet</h3>
              <p className="text-gray-400 text-sm">We'll notify you when you perform portfolio actions</p>
            </div>
          ) : (
            <div className="pb-3">
              {notifications.map((notification, index) => {
                const style = getNotificationStyle(notification.type)
                return (
                  <div key={notification.id}>
                    <div
                      className={`
                        px-4 py-3.5 cursor-pointer transition-all duration-200
                        ${notification.read ? 'bg-transparent' : 'bg-neon-blue/5'}
                        hover:bg-dark-tertiary
                      `}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className={`
                          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                          ${style.bgColor} border ${style.borderColor}
                        `}>
                          <span className="text-xl">{style.icon}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className={`text-sm font-semibold ${style.color} truncate`}>
                              {notification.type === 'buy' && 'Bought'}
                              {notification.type === 'sell' && 'Sold'}
                              {notification.type === 'delete' && 'Removed'} {notification.coin}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-neon-blue rounded-full flex-shrink-0 ml-2 mt-1 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Subtle divider between notifications */}
                    {index < notifications.length - 1 && (
                      <div className="border-b border-white/5" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationPanel
