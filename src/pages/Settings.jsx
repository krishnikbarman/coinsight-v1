import React, { useState, useEffect } from 'react'
import { STORAGE_KEYS, getStorageItem, setStorageItem, resetAppData } from '../utils/storage'

const Settings = () => {
  // Load notification preferences from localStorage or use defaults
  const [notifications, setNotifications] = useState(() => {
    return getStorageItem(STORAGE_KEYS.SETTINGS, {
      portfolioUpdates: true,
      marketTrends: false
    })
  })

  // Persist notification settings to localStorage (excluding coming soon features)
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.SETTINGS, notifications)
  }, [notifications])

  const handleNotificationToggle = (key, comingSoon) => {
    if (comingSoon) return // Prevent interaction with coming soon features
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // V1 Notification Configuration
  const notificationConfig = [
    {
      key: 'priceAlerts',
      title: 'Price Alerts',
      description: 'Price alert feature will be available in a future update.',
      enabled: false,
      alwaysOn: false,
      comingSoon: true
    },
    {
      key: 'portfolioUpdates',
      title: 'Portfolio Updates',
      description: 'You will always receive notifications for buy, sell, and portfolio changes.',
      enabled: true,
      alwaysOn: true,
      comingSoon: false
    },
    {
      key: 'marketTrends',
      title: 'Market Trends',
      description: 'Market insight notifications will be available in a future update.',
      enabled: false,
      alwaysOn: false,
      comingSoon: true
    }
  ]

  const handleResetAppData = () => {
    const confirmed = window.confirm(
      'Reset App Data?\n\nThis will erase your portfolio, transactions, and notifications. This action cannot be undone.'
    )
    if (confirmed) {
      const success = resetAppData()
      if (success) {
        alert('All CoinSight data has been reset. The app will now restart.')
        window.location.href = '/dashboard'
      } else {
        alert('Failed to reset app data. Please try again.')
      }
    }
  }

  const handleExportData = () => {
    const portfolioData = getStorageItem(STORAGE_KEYS.PORTFOLIO, [])
    const transactionsData = getStorageItem(STORAGE_KEYS.TRANSACTIONS, [])
    
    const exportData = {
      portfolio: portfolioData,
      transactions: transactionsData,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
    
    if (portfolioData.length > 0 || transactionsData.length > 0) {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'coinsight-backup.json'
      a.click()
      URL.revokeObjectURL(url)
    } else {
      alert('No data to export.')
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Customize your portfolio experience</p>
      </div>

      {/* Notification Settings */}
      <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Notifications</h2>
          <p className="text-sm text-gray-400">Manage your notification preferences</p>
        </div>
        <div className="space-y-4">
          {notificationConfig.map((notification) => (
            <div 
              key={notification.key} 
              className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                notification.comingSoon 
                  ? 'bg-dark-tertiary/60 opacity-70 cursor-not-allowed' 
                  : notification.alwaysOn
                    ? 'bg-dark-tertiary border border-neon-green/20'
                    : 'bg-dark-tertiary'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium ${
                    notification.comingSoon ? 'text-gray-400' : 'text-white'
                  }`}>
                    {notification.title}
                    {notification.alwaysOn && (
                      <span className="text-gray-400 font-normal text-sm ml-2">(Always On)</span>
                    )}
                  </h3>
                  {notification.comingSoon && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full border border-neon-purple/40 text-neon-purple/80 bg-neon-purple/5">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {notification.description}
                </p>
              </div>
              
              {/* Always On: Green Check Icon */}
              {notification.alwaysOn ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 ml-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                /* Coming Soon: Disabled Toggle */
                <button
                  onClick={() => handleNotificationToggle(notification.key, notification.comingSoon)}
                  disabled={notification.comingSoon}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 ml-4
                    transition-colors duration-200
                    ${notification.comingSoon 
                      ? 'bg-gray-700 opacity-60 cursor-not-allowed' 
                      : notification.enabled 
                        ? 'bg-neon-green cursor-pointer' 
                        : 'bg-gray-600 cursor-pointer'
                    }
                  `}
                  aria-label={`Toggle ${notification.title}`}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white 
                      transition-transform duration-200 ease-in-out
                      ${notification.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Data Management</h2>
          <p className="text-sm text-gray-400">Manage your portfolio data</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-between p-4 bg-dark-tertiary rounded-lg hover:bg-neon-blue/10 hover:border-neon-blue/30 border-2 border-transparent transition-all"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💾</span>
              <div className="text-left">
                <h3 className="text-white font-medium">Export Data</h3>
                <p className="text-sm text-gray-400">Download portfolio and transactions as JSON</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* About CoinSight */}
      <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6 shadow-lg">
        {/* Header: Title + Badge */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">About CoinSight</h2>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 text-neon-blue border border-neon-blue/30">
            v1.0 Stable
          </span>
        </div>

        {/* Single Column Metadata */}
        <div className="space-y-3.5">
          {/* Version */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <span className="text-sm text-gray-400 font-medium flex-1">Version</span>
            <span className="text-sm text-white font-semibold">1.0.0</span>
          </div>

          {/* Build Date */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm text-gray-400 font-medium flex-1">Build Date</span>
            <span className="text-sm text-white font-semibold">2026-02-05</span>
          </div>

          {/* Framework */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-sm text-gray-400 font-medium flex-1">Framework</span>
            <span className="text-sm text-white font-semibold">React + Vite</span>
          </div>

          {/* Data Source */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-neon-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm text-gray-400 font-medium flex-1">Data Source</span>
            <span className="text-sm text-white font-semibold">Live Market APIs</span>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse"></div>
            </div>
            <span className="text-sm text-gray-400 font-medium flex-1">Status</span>
            <span className="text-sm text-neon-green font-semibold">Stable</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] mt-6 mb-4"></div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Designed for personal crypto portfolio management.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-dark-secondary rounded-xl border border-red-500/30 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-400">Irreversible actions that affect all app data</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleResetAppData}
            className="w-full flex items-center justify-between p-4 bg-red-500/10 rounded-lg hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500/50 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚠️</span>
              <div className="text-left">
                <h3 className="text-red-400 font-medium group-hover:text-red-300 transition-colors">Reset App Data</h3>
                <p className="text-sm text-gray-400">Clear all portfolio, transactions, and notifications</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
