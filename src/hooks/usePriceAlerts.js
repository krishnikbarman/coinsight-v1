/**
 * usePriceAlertChecker Hook - Real-time price alert monitoring engine
 * Runs continuously in background, checks alerts every 8 seconds
 * Automatically triggers notifications when price conditions are met
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getActiveAlerts, triggerAlert } from '../services/alertService';
import { fetchCurrentPrices } from '../services/cryptoApi';

// Check alerts every 8 seconds for near real-time monitoring
const ALERT_CHECK_INTERVAL = 8000;

export const usePriceAlertChecker = () => {
  const { user } = useAuth();
  const { addNotification, settings } = useNotifications();
  const [alerts, setAlerts] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef(null);
  const triggeredAlertsRef = useRef(new Set()); // Prevent duplicate triggers

  /**
   * Load all active alerts for the user
   */
  const loadAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      return;
    }

    try {
      const activeAlerts = await getActiveAlerts(user.id);
      setAlerts(activeAlerts || []);
      console.log(`📊 Loaded ${activeAlerts?.length || 0} active alerts`);
    } catch (error) {
      console.error('❌ Error loading alerts:', error);
      setAlerts([]);
    }
  }, [user]);

  /**
   * Check if any alerts should be triggered based on current prices
   */
  const checkAlerts = useCallback(async () => {
    // Skip if alerts are globally disabled
    if (!settings.priceAlertsEnabled) {
      console.log('⏸️ Price alerts disabled - skipping check');
      return;
    }

    if (!user || alerts.length === 0 || isChecking) {
      return;
    }

    console.log('🔍 Checking alerts...');
    setIsChecking(true);

    try {
      // Group alerts by coin to minimize API calls
      const coinMap = new Map();
      alerts.forEach(alert => {
        // Skip if already triggered in this session (duplicate prevention)
        if (triggeredAlertsRef.current.has(alert.id)) {
          return;
        }
        
        if (!coinMap.has(alert.coinId)) {
          coinMap.set(alert.coinId, []);
        }
        coinMap.get(alert.coinId).push(alert);
      });

      if (coinMap.size === 0) {
        console.log('⏭️ No new alerts to check');
        setIsChecking(false);
        return;
      }

      console.log(`📈 Fetching prices for ${coinMap.size} coins...`);

      // Fetch current prices for all coins with alerts
      const coins = Array.from(coinMap.keys()).map(coinId => ({ coinId }));
      const pricesResult = await fetchCurrentPrices(coins, 'usd');

      if (!pricesResult.success) {
        console.warn('⚠️ Failed to fetch prices for alert checking');
        setIsChecking(false);
        return;
      }

      // Check each alert against current price
      const triggeredAlerts = [];

      for (const [coinId, coinAlerts] of coinMap.entries()) {
        const priceData = pricesResult.data[coinId];
        
        if (!priceData || !priceData.usd) {
          console.warn(`⚠️ No price data for ${coinId}`);
          continue;
        }

        // SAFE NUMBER COMPARISON - Always convert to Number
        const currentPrice = Number(priceData.usd);

        console.log(`💰 ${coinId}: Current price = $${currentPrice}`);

        for (const alert of coinAlerts) {
          const targetPrice = Number(alert.targetPrice);
          let shouldTrigger = false;

          console.log(`   📌 Alert: ${alert.condition} $${targetPrice}`);

          // Safe number comparison with explicit Number() conversion
          if (alert.condition === 'above' && currentPrice >= targetPrice) {
            shouldTrigger = true;
            console.log(`   ✅ TRIGGER: Price $${currentPrice} >= $${targetPrice}`);
          } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
            shouldTrigger = true;
            console.log(`   ✅ TRIGGER: Price $${currentPrice} <= $${targetPrice}`);
          }

          if (shouldTrigger) {
            triggeredAlerts.push({ alert, currentPrice });
          }
        }
      }

      // Process triggered alerts
      if (triggeredAlerts.length > 0) {
        console.log(`🔔 Processing ${triggeredAlerts.length} triggered alert(s)...`);
      }

      for (const { alert, currentPrice } of triggeredAlerts) {
        try {
          // Mark as triggered in session to prevent duplicates
          triggeredAlertsRef.current.add(alert.id);

          console.log(`🚀 Triggering alert: ${alert.symbol} ${alert.condition} $${alert.targetPrice}`);

          // 1. Mark alert as triggered in database (sets is_active = false, triggered_at = NOW())
          await triggerAlert(alert.id, user.id);
          console.log(`   ✓ Database updated`);

          // 2. Create notification
          const conditionText = alert.condition === 'above' ? 'above' : 'below';
          const message = `${alert.symbol.toUpperCase()} crossed your ${conditionText} target of $${alert.targetPrice.toLocaleString()}. Current price: $${currentPrice.toLocaleString()}`;

          await addNotification({
            type: 'alert',
            coin: alert.coinName,
            message: message,
            price: currentPrice,
            quantity: alert.targetPrice
          });
          console.log(`   ✓ Notification created`);

          console.log(`✅ Alert triggered successfully: ${alert.symbol} ${conditionText} $${alert.targetPrice}`);
        } catch (error) {
          console.error('❌ Error processing triggered alert:', error);
          // Remove from triggered set if processing failed (allow retry)
          triggeredAlertsRef.current.delete(alert.id);
        }
      }

      // Reload alerts to remove triggered ones from state
      if (triggeredAlerts.length > 0) {
        console.log('🔄 Reloading alerts after triggers...');
        await loadAlerts();
      }

    } catch (error) {
      console.error('❌ Error checking alerts:', error);
    } finally {
      setIsChecking(false);
    }
  }, [user, alerts, isChecking, addNotification, loadAlerts, settings.priceAlertsEnabled]);

  /**
   * Start monitoring alerts
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      console.log('⏸️ Monitoring already active');
      return; // Already monitoring
    }

    console.log('🚀 Starting price alert monitoring (checking every 8 seconds)...');

    // Check immediately on start
    checkAlerts();

    // Then check every 8 seconds
    intervalRef.current = setInterval(() => {
      checkAlerts();
    }, ALERT_CHECK_INTERVAL);

    console.log('✅ Price alert monitoring started');
  }, [checkAlerts]);

  /**
   * Stop monitoring alerts
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('🛑 Price alert monitoring stopped');
    }
  }, []);

  // Load alerts when user logs in
  useEffect(() => {
    if (user) {
      console.log('👤 User authenticated, loading alerts...');
      loadAlerts();
    } else {
      console.log('🚪 User logged out, clearing alerts...');
      setAlerts([]);
      triggeredAlertsRef.current.clear();
    }
  }, [user, loadAlerts]);

  // Start/stop monitoring based on user auth and alerts
  useEffect(() => {
    if (user && alerts.length > 0) {
      console.log(`🎯 ${alerts.length} active alerts found, starting monitoring...`);
      startMonitoring();
    } else {
      if (user && alerts.length === 0) {
        console.log('📭 No active alerts to monitor');
      }
      stopMonitoring();
    }

    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, [user, alerts.length, startMonitoring, stopMonitoring]);

  return {
    alerts,
    isChecking,
    loadAlerts,
    checkAlerts,
    startMonitoring,
    stopMonitoring
  };
};

// Default export for convenience
export default usePriceAlertChecker;
