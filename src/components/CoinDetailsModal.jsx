import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getCoinById } from '../services/coinService'
import { usePortfolio } from '../context/PortfolioContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { createAlert, deleteAlert, getAlertsByCoin, evaluateAlertImmediately } from '../services/alertService'
import { supabase } from '../supabase/client'
import Loader from './Loader'

// 30-second cache for coin details
const coinDetailsCache = new Map()
const CACHE_DURATION = 30000 // 30 seconds

const CoinDetailsModal = ({ isOpen, onClose, coinId }) => {
  const [coinDetails, setCoinDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Price alert state
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [alertTargetPrice, setAlertTargetPrice] = useState('')
  const [alertCondition, setAlertCondition] = useState('above')
  const [activeAlerts, setActiveAlerts] = useState([])
  const [triggeredAlerts, setTriggeredAlerts] = useState([])
  const [creatingAlert, setCreatingAlert] = useState(false)
  const [deletingAlertId, setDeletingAlertId] = useState(null)
  
  const { formatCurrency, currency } = usePortfolio()
  const { user } = useAuth()
  const { showToast } = useNotifications()
  
  const alertsSubscriptionRef = useRef(null)

  // Fetch alerts for current coin (memoized)
  const fetchAlerts = useCallback(async () => {
    if (!user || !coinId) {
      setActiveAlerts([])
      setTriggeredAlerts([])
      return
    }

    try {
      const { data: alerts, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('coin_id', coinId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Separate active and triggered alerts
      const active = alerts.filter(a => a.is_active && !a.triggered_at).map(alert => ({
        id: alert.id,
        coinId: alert.coin_id,
        coinName: alert.coin_name,
        symbol: alert.symbol,
        targetPrice: parseFloat(alert.target_price),
        condition: alert.condition,
        isActive: alert.is_active,
        triggeredAt: alert.triggered_at,
        createdAt: alert.created_at
      }))

      const triggered = alerts.filter(a => a.triggered_at).map(alert => ({
        id: alert.id,
        coinId: alert.coin_id,
        coinName: alert.coin_name,
        symbol: alert.symbol,
        targetPrice: parseFloat(alert.target_price),
        condition: alert.condition,
        isActive: alert.is_active,
        triggeredAt: alert.triggered_at,
        createdAt: alert.created_at
      }))

      setActiveAlerts(active)
      setTriggeredAlerts(triggered)
    } catch (error) {
      console.error('Error fetching alerts:', error)
      setActiveAlerts([])
      setTriggeredAlerts([])
    }
  }, [user, coinId])

  // Fetch coin details with 30-second cache
  useEffect(() => {
    if (!isOpen || !coinId) return
    
    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check cache first
        const cacheKey = `${coinId}-${currency.toLowerCase()}`
        const cached = coinDetailsCache.get(cacheKey)
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('✓ Using cached coin details (30s cache)')
          setCoinDetails(cached.data)
          setLoading(false)
          await fetchAlerts()
          return
        }

        // Fetch fresh data using unified coin service
        const data = await getCoinById(coinId, currency.toLowerCase())
        
        // Cache the result
        coinDetailsCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
        
        setCoinDetails(data)
        
        // Load alerts for this coin
        await fetchAlerts()
        
        // Check for immediate triggers
        if (user && data.currentPrice) {
          await checkImmediateTriggers(data.currentPrice)
        }
      } catch (err) {
        console.error('Error fetching coin details:', err)
        setError('Failed to load coin details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [isOpen, coinId, currency, user, fetchAlerts])

  // Real-time check for immediate triggers
  const checkImmediateTriggers = async (currentPrice) => {
    if (!user || activeAlerts.length === 0) return

    for (const alert of activeAlerts) {
      const shouldTrigger = 
        (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice)

      if (shouldTrigger) {
        console.log(`🔔 Alert triggered: ${alert.symbol} ${alert.condition} $${alert.targetPrice}`)
        
        // Update alert status
        await supabase
          .from('price_alerts')
          .update({
            is_active: false,
            triggered_at: new Date().toISOString()
          })
          .eq('id', alert.id)

        // Create notification
        const conditionText = alert.condition === 'above' ? 'above' : 'below'
        const message = `${alert.symbol.toUpperCase()} crossed your ${conditionText} target of $${alert.targetPrice.toLocaleString()}. Current price: $${currentPrice.toLocaleString()}`

        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'alert',
            coin: alert.symbol,
            quantity: alert.targetPrice,
            price: currentPrice,
            message: message,
            read: false
          })

        // Refresh alerts list
        await fetchAlerts()
      }
    }
  }

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Close on outside click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Format large numbers
  const formatNumber = (num) => {
    if (!num) return 'N/A'
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatSupply = (num) => {
    if (!num) return 'N/A'
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toLocaleString()
  }

  // Handle alert creation
  const handleCreateAlert = async (e) => {
    e.preventDefault()
    
    if (!user) {
      showToast('Please login to create alerts', 'error')
      return
    }
    
    const targetPrice = parseFloat(alertTargetPrice)
    
    if (!targetPrice || targetPrice <= 0) {
      showToast('Please enter a valid target price', 'error')
      return
    }
    
    setCreatingAlert(true)
    
    try {
      // 1. Create alert in database
      const newAlert = await createAlert({
        coinId,
        coinName: coinDetails?.name || 'Unknown',
        symbol: coinDetails?.symbol || 'N/A',
        targetPrice,
        condition: alertCondition
      }, user.id)
      
      console.log('✅ Alert created, checking for immediate trigger...')
      
      // 2. Check for immediate trigger
      const currentPrice = coinDetails?.currentPrice
      
      if (currentPrice) {
        const evaluation = await evaluateAlertImmediately(newAlert, currentPrice, user.id)
        
        if (evaluation.triggered) {
          console.log('🔔 Alert triggered immediately!')
          showToast(
            `Alert triggered: ${coinDetails?.symbol || 'Coin'} is already ${alertCondition} $${targetPrice.toLocaleString()}!`,
            'success'
          )
        } else {
          showToast(`Alert created: ${coinDetails?.symbol || 'Coin'} ${alertCondition} $${targetPrice.toLocaleString()}`, 'success')
        }
      } else {
        showToast(`Alert created: ${coinDetails?.symbol || 'Coin'} ${alertCondition} $${targetPrice.toLocaleString()}`, 'success')
      }
      
      // Reset form
      setAlertTargetPrice('')
      setAlertCondition('above')
      setShowAlertForm(false)
      
      // Refresh alerts list
      await fetchAlerts()
    } catch (error) {
      console.error('Error creating alert:', error)
      showToast('Failed to create alert', 'error')
    } finally {
      setCreatingAlert(false)
    }
  }
  
  // Handle alert deletion
  const handleDeleteAlert = async (alertId) => {
    if (!user) return
    
    setDeletingAlertId(alertId)
    
    try {
      // Instant UI update
      setActiveAlerts(prev => prev.filter(a => a.id !== alertId))
      setTriggeredAlerts(prev => prev.filter(a => a.id !== alertId))
      
      // Delete from database
      await deleteAlert(alertId, user.id)
      
      showToast('Alert deleted', 'success')
      
      // Background sync
      await fetchAlerts()
    } catch (error) {
      console.error('Error deleting alert:', error)
      showToast('Failed to delete alert', 'error')
      
      // Rollback on error
      await fetchAlerts()
    } finally {
      setDeletingAlertId(null)
    }
  }

  // Return null if modal is closed
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-slate-900 rounded-2xl p-5 w-full max-w-lg shadow-2xl border border-dark-tertiary max-h-[90vh] overflow-y-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-dark-tertiary rounded-lg transition-all duration-200"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 pb-4 border-b border-dark-tertiary">
              <div className="w-16 h-16 rounded-full bg-dark-tertiary animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-dark-tertiary rounded animate-pulse"></div>
                <div className="h-4 bg-dark-tertiary rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-center py-8">
              <Loader size="medium" text="Loading market data..." />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="py-12 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Error Loading Details</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/80 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Coin Details */}
        {coinDetails && !loading && !error && (
          <div className="space-y-4">
            {/* Header - Coin Info */}
            <div className="flex items-center space-x-4 pb-4 border-b border-dark-tertiary">
              {coinDetails.image && (
                <img
                  src={coinDetails.image}
                  alt={coinDetails.name}
                  className="w-16 h-16 rounded-full ring-2 ring-neon-blue/30"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white">{coinDetails.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg font-bold text-gray-400 uppercase">{coinDetails.symbol}</span>
                  {coinDetails.marketCapRank && (
                    <span className="px-2 py-0.5 bg-neon-blue/10 text-neon-blue text-xs font-bold rounded-full">
                      Rank #{coinDetails.marketCapRank}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Current Price */}
              <div className="bg-dark-tertiary/50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">Current Price</p>
                <p className="text-xl font-black text-white">
                  {coinDetails.currentPrice ? formatCurrency(coinDetails.currentPrice) : 'N/A'}
                </p>
              </div>

              {/* 24h Change */}
              <div className="bg-dark-tertiary/50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">24h Change</p>
                {coinDetails.priceChangePercentage24h !== undefined ? (
                  <div className={`flex items-center space-x-1 ${
                    coinDetails.priceChangePercentage24h >= 0 ? 'text-neon-green' : 'text-neon-pink'
                  }`}>
                    <span className="text-xl font-black">
                      {coinDetails.priceChangePercentage24h >= 0 ? '+' : ''}
                      {coinDetails.priceChangePercentage24h.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <p className="text-xl font-black text-white">N/A</p>
                )}
              </div>

              {/* Market Cap */}
              <div className="bg-dark-tertiary/50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">Market Cap</p>
                <p className="text-xl font-black text-white">
                  {coinDetails.marketCap ? formatNumber(coinDetails.marketCap) : 'N/A'}
                </p>
              </div>

              {/* Volume 24h */}
              <div className="bg-dark-tertiary/50 rounded-xl p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">Volume 24h</p>
                <p className="text-xl font-black text-white">
                  {coinDetails.totalVolume ? formatNumber(coinDetails.totalVolume) : 'N/A'}
                </p>
              </div>

              {/* Circulating Supply */}
              {coinDetails.circulatingSupply && (
                <div className="bg-dark-tertiary/50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">Circulating Supply</p>
                  <p className="text-xl font-black text-white">
                    {formatSupply(coinDetails.circulatingSupply)} {coinDetails.symbol?.toUpperCase() || ''}
                  </p>
                </div>
              )}
            </div>

            {/* Price Alert Section */}
            <div className="pt-4 border-t border-dark-tertiary mt-4 space-y-4">
              {/* Price Alert Button */}
              {!showAlertForm && (
                <button
                  onClick={() => setShowAlertForm(true)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl py-3 px-4 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 font-semibold text-sm flex items-center justify-center space-x-2 hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Set Price Alert</span>
                  {(activeAlerts.length > 0 || triggeredAlerts.length > 0) && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                      {activeAlerts.length + triggeredAlerts.length}
                    </span>
                  )}
                </button>
              )}

              {/* Alert Form */}
              {showAlertForm && (
                <div className="relative bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-700/50 mt-3 animate-fadeIn">
                  <button
                    onClick={() => setShowAlertForm(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <form onSubmit={handleCreateAlert} className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block font-medium">
                        Alert Condition
                      </label>
                      <div className="flex bg-slate-800/60 rounded-full p-1">
                        <button
                          type="button"
                          onClick={() => setAlertCondition('above')}
                          className={`flex-1 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
                            alertCondition === 'above'
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Above
                        </button>
                        <button
                          type="button"
                          onClick={() => setAlertCondition('below')}
                          className={`flex-1 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
                            alertCondition === 'below'
                              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Below
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block font-medium">
                        Target Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={alertTargetPrice}
                          onChange={(e) => setAlertTargetPrice(e.target.value)}
                          placeholder="Enter target price"
                          className="w-full pl-8 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingAlert}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl py-3 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold transition-all duration-200"
                    >
                      {creatingAlert ? 'Creating...' : 'Save Alert'}
                    </button>
                  </form>
                </div>
              )}

              {/* Active Alerts List */}
              {activeAlerts.length > 0 && (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50 shadow-lg">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Active Alerts ({activeAlerts.length})
                  </h4>
                  <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-500">
                    {activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between hover:bg-slate-800/80 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.condition === 'above' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}></div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {alert.condition.toUpperCase()} ${alert.targetPrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created {new Date(alert.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          disabled={deletingAlertId === alert.id}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                          title="Delete alert"
                        >
                          {deletingAlertId === alert.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Triggered Alerts List */}
              {triggeredAlerts.length > 0 && (
                <div className="bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 backdrop-blur-md rounded-2xl p-5 border border-neon-blue/30 shadow-lg shadow-neon-blue/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-neon-blue uppercase tracking-wider">
                      Triggered Alerts
                    </h4>
                    <span className="px-2 py-0.5 bg-neon-blue/20 text-neon-blue text-xs font-bold rounded-full animate-pulse">
                      {triggeredAlerts.length}
                    </span>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neon-blue/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-neon-blue/50">
                    {triggeredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-slate-800/80 rounded-lg p-3 flex items-center justify-between border border-neon-blue/20 hover:border-neon-blue/40 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {alert.condition.toUpperCase()} ${alert.targetPrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-neon-blue/80">
                              Triggered {new Date(alert.triggeredAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          disabled={deletingAlertId === alert.id}
                          className="p-2 text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all disabled:opacity-50"
                          title="Delete alert"
                        >
                          {deletingAlertId === alert.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
const formatNumber = (num) => {
  if (!num) return 'N/A'
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

const formatSupply = (num) => {
  if (!num) return 'N/A'
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  return num.toLocaleString()
}

export default CoinDetailsModal
