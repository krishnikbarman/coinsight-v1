import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { useNotifications } from '../context/NotificationContext'
import { supabase } from '../supabase/client'
import { getCoinPrices } from '../services/coinService'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'

const PriceAlerts = () => {
  const { user } = useAuth()
  const { formatCurrency } = usePortfolio()
  const { showToast, settings, updateSettings } = useNotifications()
  
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [currentPrices, setCurrentPrices] = useState({})
  const priceRefreshIntervalRef = useRef(null)

  // Fetch alerts from Supabase
  const fetchAlerts = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching alerts:', error)
        showToast('Failed to load alerts', 'error')
        return
      }

      setAlerts(data || [])
      
      // Fetch live prices after loading alerts
      if (data && data.length > 0) {
        await fetchLivePrices(data)
      }
    } catch (error) {
      console.error('Exception fetching alerts:', error)
      showToast('An error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Fetch live prices for all alerts in one request
  const fetchLivePrices = async (alertsList = alerts) => {
    if (!alertsList || alertsList.length === 0) return

    try {
      // Extract unique coin IDs from alerts
      const uniqueCoinIds = [...new Set(alertsList.map(alert => alert.coin_id))].filter(Boolean)
      
      if (uniqueCoinIds.length === 0) return

      console.log(`💰 Fetching live prices for ${uniqueCoinIds.length} coins...`)

      // Fetch all prices in one API call
      const prices = await getCoinPrices(uniqueCoinIds, 'usd')
      
      if (prices && Object.keys(prices).length > 0) {
        // Map coin_id to price
        const priceMap = {}
        Object.keys(prices).forEach(coinId => {
          priceMap[coinId] = prices[coinId].price
        })
        
        setCurrentPrices(priceMap)
        console.log(`✅ Loaded ${Object.keys(priceMap).length} live prices`)
      }
    } catch (error) {
      console.error('Error fetching live prices:', error)
      // Don't show error toast for price fetch failures
    }
  }

  // Delete alert
  const handleDeleteAlert = async (alertId) => {
    setDeleting(alertId)
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id) // Security: ensure user owns the alert

      if (error) {
        console.error('Error deleting alert:', error)
        showToast('Failed to delete alert', 'error')
        return
      }

      showToast('Alert deleted successfully', 'success')
      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    } catch (error) {
      console.error('Exception deleting alert:', error)
      showToast('An error occurred', 'error')
    } finally {
      setDeleting(null)
    }
  }

  // Toggle price alerts enabled/disabled
  const handleTogglePriceAlerts = async () => {
    if (!user) return
    
    const newValue = !settings.priceAlertsEnabled
    console.log(`🔄 Toggling price alerts to: ${newValue}`)
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ price_alerts_enabled: newValue })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating settings:', error)
        showToast('Failed to update settings', 'error')
        return
      }

      // Update global context state
      updateSettings({ priceAlertsEnabled: newValue })
      showToast(
        newValue ? 'Price alerts enabled' : 'Price alerts disabled',
        'success'
      )
    } catch (error) {
      console.error('Exception updating settings:', error)
      showToast('An error occurred', 'error')
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [user?.id])

  // Set up auto-refresh for live prices every 60 seconds
  useEffect(() => {
    if (alerts.length === 0) return

    console.log('⏰ Setting up 60-second price refresh interval...')

    // Refresh prices every 60 seconds
    priceRefreshIntervalRef.current = setInterval(() => {
      console.log('🔄 Auto-refreshing live prices...')
      fetchLivePrices()
    }, 60000) // 60 seconds

    // Cleanup interval on unmount
    return () => {
      if (priceRefreshIntervalRef.current) {
        console.log('🛑 Clearing price refresh interval')
        clearInterval(priceRefreshIntervalRef.current)
        priceRefreshIntervalRef.current = null
      }
    }
  }, [alerts.length])

  // Set up realtime subscription for price_alerts changes
  useEffect(() => {
    if (!user?.id) return

    console.log('🔔 Setting up realtime subscription for price alerts...')

    // Create a channel for realtime price_alerts updates
    const channel = supabase
      .channel('price-alerts-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'price_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Price alert change detected:', payload.eventType)
          
          // Refresh alerts list on any change
          fetchAlerts()
        }
      )
      .subscribe((status) => {
        console.log('📡 Price alerts subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to price alerts updates')
        }
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('🔕 Cleaning up price alerts subscription...')
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Calculate statistics
  const activeAlertsCount = alerts.filter(a => a.is_active && !a.triggered_at).length
  const triggeredAlertsCount = alerts.filter(a => a.triggered_at).length

  if (loading) {
    return <Loader message="Loading alerts..." />
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Section with Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Price Alerts</h1>
          <p className="text-gray-400 text-sm">Manage your active and triggered alerts</p>
        </div>
        
        {/* Alert Notifications Toggle */}
        <div className="flex items-center space-x-3 bg-dark-secondary/50 backdrop-blur-md border border-dark-tertiary rounded-lg px-4 py-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">Alert Notifications</p>
            <p className="text-xs text-gray-400">
              {settings.priceAlertsEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <button
            onClick={handleTogglePriceAlerts}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0
              transition-colors duration-200 cursor-pointer
              ${settings.priceAlertsEnabled ? 'bg-neon-green' : 'bg-gray-600'}
            `}
            aria-label="Toggle Alert Notifications"
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white 
                transition-transform duration-200 ease-in-out
                ${settings.priceAlertsEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Active Alerts Card */}
        <div className="bg-dark-secondary/50 backdrop-blur-md border border-dark-tertiary rounded-xl p-6 hover:border-neon-blue/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Active Alerts</p>
              <p className="text-3xl font-bold text-white">{activeAlertsCount}</p>
            </div>
            <div className="bg-neon-blue/10 p-3 rounded-lg">
              <svg className="w-8 h-8 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Triggered Alerts Card */}
        <div className="bg-dark-secondary/50 backdrop-blur-md border border-dark-tertiary rounded-xl p-6 hover:border-neon-purple/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Triggered Alerts</p>
              <p className="text-3xl font-bold text-white">{triggeredAlertsCount}</p>
            </div>
            <div className="bg-neon-purple/10 p-3 rounded-lg">
              <svg className="w-8 h-8 text-neon-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      {alerts.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          title="No Price Alerts"
          message="You haven't set up any price alerts yet. Create alerts to get notified when your favorite coins reach specific prices."
        />
      ) : (
        <div className="bg-dark-secondary/50 backdrop-blur-md border border-dark-tertiary rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-dark-tertiary">
            <h2 className="text-lg font-semibold text-white">All Alerts</h2>
          </div>

          {/* Table Content - Scrollable if > 5 alerts */}
          <div className={`${alerts.length > 5 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
            <table className="w-full">
              <thead className="bg-dark-tertiary/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Coin Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Target Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-tertiary/50">
                {alerts.map((alert) => (
                  <tr 
                    key={alert.id} 
                    className="hover:bg-dark-tertiary/30 transition-colors duration-150"
                  >
                    {/* Coin Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {alert.icon_url && (
                          <img 
                            src={alert.icon_url} 
                            alt={alert.coin_name}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">{alert.coin_name}</div>
                          <div className="text-xs text-gray-400">{alert.symbol?.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>

                    {/* Target Price */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">
                        {formatCurrency(alert.target_price)}
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        alert.condition === 'above' 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {alert.condition === 'above' ? '↑ Above' : '↓ Below'}
                      </span>
                    </td>

                    {/* Current Price */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {currentPrices[alert.coin_id] !== undefined 
                          ? formatCurrency(currentPrices[alert.coin_id]) 
                          : '—'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {alert.triggered_at ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neon-purple/10 text-neon-purple">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Triggered
                        </span>
                      ) : alert.is_active ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neon-blue/10 text-neon-blue">
                          <span className="w-2 h-2 bg-neon-blue rounded-full mr-1.5 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        disabled={deleting === alert.id}
                        className="text-red-400 hover:text-red-300 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete alert"
                      >
                        {deleting === alert.id ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceAlerts
