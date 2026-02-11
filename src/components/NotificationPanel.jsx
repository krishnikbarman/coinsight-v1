import { useState, useMemo } from 'react'
import { useNotifications } from '../context/NotificationContext'

const NotificationPanel = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    getUnreadCount,
    getRelativeTime,
    settings
  } = useNotifications()
  
  // Tab state
  const [activeTab, setActiveTab] = useState('portfolio')
  
  const unreadCount = getUnreadCount()

  // Filter notifications by type
  const portfolioNotifications = useMemo(() => {
    return notifications.filter(n => ['buy', 'sell', 'delete'].includes(n.type))
  }, [notifications])

  const alertNotifications = useMemo(() => {
    return notifications.filter(n => n.type === 'alert')
  }, [notifications])

  // Get filtered notifications based on active tab and settings
  const filteredNotifications = useMemo(() => {
    // If price alerts are disabled, only show portfolio notifications
    if (!settings.priceAlertsEnabled) {
      return portfolioNotifications
    }
    // Otherwise, filter based on active tab
    return activeTab === 'portfolio' ? portfolioNotifications : alertNotifications
  }, [activeTab, portfolioNotifications, alertNotifications, settings.priceAlertsEnabled])

  // Get unread count per tab
  const portfolioUnreadCount = useMemo(() => {
    return portfolioNotifications.filter(n => !n.read).length
  }, [portfolioNotifications])

  const alertUnreadCount = useMemo(() => {
    return alertNotifications.filter(n => !n.read).length
  }, [alertNotifications])

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
      case 'alert':
        return {
          icon: '🔔',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/30'
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

          {/* Tab Switcher */}
          {settings.priceAlertsEnabled && (
          <div className="sticky top-0 z-10 bg-dark-secondary/95 backdrop-blur-sm border-b border-dark-tertiary">
            <div className="flex items-center gap-2 p-3">
              {/* Portfolio Tab */}
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full
                  font-medium text-sm transition-all duration-300 
                  ${activeTab === 'portfolio'
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg shadow-neon-blue/30'
                    : 'bg-dark-tertiary/50 text-gray-400 hover:bg-dark-tertiary hover:text-gray-300'
                  }
                `}
              >
                <span className="text-base">📊</span>
                <span>Portfolio</span>
                {portfolioUnreadCount > 0 && (
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center
                    ${activeTab === 'portfolio' 
                      ? 'bg-white/20 text-white' 
                      : 'bg-neon-blue/20 text-neon-blue'
                    }
                  `}>
                    {portfolioUnreadCount}
                  </span>
                )}
              </button>

              {/* Alerts Tab */}
              <button
                onClick={() => setActiveTab('alerts')}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full
                  font-medium text-sm transition-all duration-300
                  ${activeTab === 'alerts'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30'
                    : 'bg-dark-tertiary/50 text-gray-400 hover:bg-dark-tertiary hover:text-gray-300'
                  }
                `}
              >
                <span className="text-base">🔔</span>
                <span>Alerts</span>
                {alertUnreadCount > 0 && (
                  <span className={`
                    px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center
                    ${activeTab === 'alerts'
                      ? 'bg-white/20 text-white'
                      : 'bg-yellow-500/20 text-yellow-500'
                    }
                  `}>
                    {alertUnreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          )}

          {/* Actions */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-tertiary bg-dark-secondary">
              <button
                onClick={markAllAsRead}
                className="text-sm text-neon-blue hover:text-neon-blue/80 transition-colors font-medium"
                disabled={
                  !settings.priceAlertsEnabled 
                    ? portfolioUnreadCount === 0 
                    : (activeTab === 'portfolio' ? portfolioUnreadCount === 0 : alertUnreadCount === 0)
                }
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
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[300px]">
              <div className="text-6xl mb-4">
                {!settings.priceAlertsEnabled || activeTab === 'portfolio' ? '📊' : '🔔'}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {!settings.priceAlertsEnabled || activeTab === 'portfolio' ? 'No portfolio updates' : 'No price alerts'}
              </h3>
              <p className="text-gray-400 text-sm">
                {!settings.priceAlertsEnabled || activeTab === 'portfolio'
                  ? 'We\'ll notify you when you perform portfolio actions'
                  : 'Set up price alerts to track your favorite coins'
                }
              </p>
            </div>
          ) : (
            <div className="pb-3">
              {filteredNotifications.map((notification, index) => {
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
                              {notification.type === 'delete' && 'Removed'}
                              {notification.type === 'alert' && 'Price Alert'} {notification.coin}
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
                    {index < filteredNotifications.length - 1 && (
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
