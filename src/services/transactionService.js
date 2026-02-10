/**
 * Transaction Service - Data persistence layer for transaction history
 * Handles Supabase database operations for user transactions
 */

import { supabase } from '../supabase/client';
import { STORAGE_KEYS, getStorageItem } from '../utils/storage';

/**
 * Get all transactions for the current user
 * @param {string} userId - Supabase user ID
 * @param {number} limit - Optional limit for number of transactions
 * @returns {Promise<Array>} Array of transactions
 */
export const getTransactions = async (userId, limit = null) => {
  try {
    if (!userId) {
      // No user logged in, return empty array
      return [];
    }

    // Fetch from Supabase only (no localStorage fallback)
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase fetch failed:', error.message);
      throw error;
    }

    // Convert Supabase format to app format
    const transactions = data.map(tx => ({
      id: tx.id,
      coinId: tx.coin_id,
      symbol: tx.symbol,
      name: tx.name,
      action: tx.action,
      quantity: parseFloat(tx.quantity),
      price: parseFloat(tx.price),
      total: parseFloat(tx.total),
      timestamp: tx.timestamp
    }));

    return transactions;
  } catch (error) {
    console.error('❌ Error in getTransactions:', error);
    return [];
  }
};

/**
 * Add a new transaction
 * @param {Object} transactionData - Transaction data
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Object>} Created transaction
 */
export const addTransaction = async (transactionData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID required for adding transactions');
    }

    const { coinId, symbol, name, action, quantity, price, total } = transactionData;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        coin_id: coinId,
        symbol,
        name,
        action,
        quantity,
        price,
        total,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      coinId: data.coin_id,
      symbol: data.symbol,
      name: data.name,
      action: data.action,
      quantity: parseFloat(data.quantity),
      price: parseFloat(data.price),
      total: parseFloat(data.total),
      timestamp: data.timestamp
    };
  } catch (error) {
    console.error('Error in addTransaction:', error);
    throw error;
  }
};

/**
 * Get transaction statistics for a user
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Object>} Transaction statistics
 */
export const getTransactionStats = async (userId) => {
  try {
    if (!userId) {
      return {
        totalTransactions: 0,
        totalBuys: 0,
        totalSells: 0,
        netInvestment: 0
      };
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('action, total')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const totalBuys = data
      .filter(tx => tx.action === 'BUY')
      .reduce((sum, tx) => sum + parseFloat(tx.total), 0);

    const totalSells = data
      .filter(tx => tx.action === 'SELL')
      .reduce((sum, tx) => sum + parseFloat(tx.total), 0);

    return {
      totalTransactions: data.length,
      totalBuys,
      totalSells,
      netInvestment: totalBuys - totalSells
    };
  } catch (error) {
    console.error('Error in getTransactionStats:', error);
    return {
      totalTransactions: 0,
      totalBuys: 0,
      totalSells: 0,
      netInvestment: 0
    };
  }
};

/**
 * Helper function to calculate stats from transaction array
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Statistics
 */
const calculateStatsFromArray = (transactions) => {
  const totalBuys = transactions
    .filter(tx => tx.action === 'BUY')
    .reduce((sum, tx) => sum + tx.total, 0);

  const totalSells = transactions
    .filter(tx => tx.action === 'SELL')
    .reduce((sum, tx) => sum + tx.total, 0);

  return {
    totalTransactions: transactions.length,
    totalBuys,
    totalSells,
    netInvestment: totalBuys - totalSells
  };
};

/**
 * Migrate localStorage transactions to Supabase (one-time migration)
 * @param {string} userId - Supabase user ID
 * @returns {Promise<boolean>} Success status
 */
export const migrateTransactionsToSupabase = async (userId) => {
  try {
    if (!userId) return false;

    // Get data from localStorage
    const localTransactions = getStorageItem(STORAGE_KEYS.TRANSACTIONS, []);
    
    if (localTransactions.length === 0) {
      return true; // Nothing to migrate
    }

    // Check if user already has data in Supabase
    const { data: existingData } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingData && existingData.length > 0) {
      return true; // Already migrated
    }

    // Migrate each transaction
    const migrationData = localTransactions.map(tx => ({
      user_id: userId,
      coin_id: tx.coinId,
      symbol: tx.symbol,
      name: tx.name,
      action: tx.action,
      quantity: tx.quantity,
      price: tx.price,
      total: tx.total,
      timestamp: tx.timestamp
    }));

    // Insert in batches of 100 to avoid payload limits
    const batchSize = 100;
    for (let i = 0; i < migrationData.length; i += batchSize) {
      const batch = migrationData.slice(i, i + batchSize);
      const { error } = await supabase
        .from('transactions')
        .insert(batch);
      
      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error migrating transactions to Supabase:', error);
    return false;
  }
};

/**
 * Get transactions by coin
 * @param {string} coinId - Coin ID
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Array>} Transactions for specific coin
 */
export const getTransactionsByCoin = async (coinId, userId) => {
  try {
    if (!userId) {
      console.warn('No user ID provided for getTransactionsByCoin')
      return []
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('coin_id', coinId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching transactions by coin:', error)
      return []
    }

    return data.map(tx => ({
      id: tx.id,
      coinId: tx.coin_id,
      symbol: tx.symbol,
      name: tx.name,
      action: tx.action,
      quantity: parseFloat(tx.quantity),
      price: parseFloat(tx.price),
      total: parseFloat(tx.total),
      timestamp: tx.timestamp
    }));
  } catch (error) {
    console.error('Error in getTransactionsByCoin:', error);
    return [];
  }
};
