import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'
import { useAuth } from '../context/AuthContext'
import { useAppStatus } from '../context/AppStatusContext'
import { useNotifications } from '../context/NotificationContext'
import NotificationPanel from './NotificationPanel'

const Navbar = ({ toggleSidebar }) => {
  const { currency, changeCurrency, refreshPrices, supportedCurrencies } = usePortfolio()
  const { logout: authLogout, user } = useAuth()
  const { isLiveData, isLoadingPrices } = useAppStatus()
  const { getUnreadCount } = useNotifications()
  const navigate = useNavigate()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false)
  const [bellAnimation, setBellAnimation] = useState(false)
  const userDropdownRef = useRef(null)
  const currencyDropdownRef = useRef(null)
  const prevCountRef = useRef(0)

  const notificationCount = getUnreadCount()

  // Trigger bell animation when new notification arrives
  useEffect(() => {
    if (notificationCount > prevCountRef.current && notificationCount > 0) {
      setBellAnimation(true)
      const timer = setTimeout(() => setBellAnimation(false), 500)
      return () => clearTimeout(timer)
    }
    prevCountRef.current = notificationCount
  }, [notificationCount])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setCurrencyDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    authLogout()
    setUserDropdownOpen(false)
    navigate('/login')
  }

  const handleSettingsClick = () => {
    setUserDropdownOpen(false)
    navigate('/settings')
  }

  const handleHistoryClick = () => {
    setUserDropdownOpen(false)
    navigate('/history')
  }

  const handlePriceAlertsClick = () => {
    setUserDropdownOpen(false)
    navigate('/alerts')
  }

  const handleCurrencyChange = (newCurrency) => {
    changeCurrency(newCurrency)
    setCurrencyDropdownOpen(false)
  }

  return (
    <nav className="bg-dark-secondary border-b border-dark-tertiary px-4 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Branding Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-dark-tertiary transition-colors flex-shrink-0"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand Identity */}
          <div className="flex flex-col">
            <div className="flex items-baseline space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Coin<span className="text-neon-blue">Sight</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-neon-blue border border-neon-blue/40 rounded-full bg-neon-blue/5 -mb-1">
                v1.2
              </span>
            </div>
            <p className="hidden md:block text-xs text-gray-400">
              See Beyond Your Crypto Numbers
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-4 ml-auto">
          {/* Notification Bell */}
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className={`
              relative p-2 bg-dark-tertiary rounded-lg hover:bg-neon-blue/10 
              hover:border-neon-blue/30 border border-transparent transition-all duration-200
              ${bellAnimation ? 'animate-wiggle' : ''}
            `}
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Unread Badge - Only show when count > 0 */}
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-neon-pink text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* Currency Display (USD Only - v1) */}
          <div className="flex items-center space-x-2 px-4 py-2 bg-dark-tertiary rounded-lg border border-dark-tertiary">
            <span className="text-sm font-medium">{supportedCurrencies[currency]?.symbol} {currency}</span>
            <span className="text-xs text-gray-400 hidden sm:inline">· More currencies soon</span>
          </div>

          {/* Live Data Indicator */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-dark-tertiary rounded-lg border border-dark-tertiary">
            <span className={`inline-block w-2 h-2 rounded-full ${
              isLiveData ? 'bg-neon-green animate-pulse' : 'bg-red-500'
            }`}></span>
            <span className="text-sm font-medium">{isLiveData ? 'Live' : 'Offline'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshPrices}
            disabled={isLoadingPrices}
            className="p-2 bg-dark-tertiary rounded-lg hover:bg-neon-blue/10 hover:border-neon-blue/30 border border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh Live Data"
            title="Refresh Live Data"
          >
            <svg 
              className={`w-5 h-5 transition-transform ${
                isLoadingPrices ? 'animate-spin' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* User Avatar with Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-2 border-transparent"
            >
              <span className="text-sm font-bold">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-dark-secondary border border-dark-tertiary rounded-lg shadow-2xl z-50 animate-slideDown">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-dark-tertiary">
                  <p className="text-sm font-medium text-white truncate" title={user?.email}>
                    {user?.email || 'User'}
                  </p>
                  <div className="flex items-center mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-neon-blue border border-neon-blue/50 rounded-full bg-neon-blue/10">
                      ADMIN
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleSettingsClick}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-tertiary hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <button
                    onClick={handleHistoryClick}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-tertiary hover:text-white hover:shadow-[0_0_10px_rgba(79,209,197,0.3)] transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Transaction History
                  </button>
                  <button
                    onClick={handlePriceAlertsClick}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-tertiary hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Price Alerts
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </nav>
  )
}

export default Navbar
