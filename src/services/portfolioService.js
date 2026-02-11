/**
 * Portfolio Service - Data persistence layer for holdings
 * Handles Supabase database operations for user portfolio holdings
 */

import { supabase } from '../supabase/client';
import { STORAGE_KEYS, getStorageItem } from '../utils/storage';
import { findCoinIdBySymbol } from './coinService';

/**
 * Get all holdings for the current user
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Array>} Array of holdings
 */
export const getHoldings = async (userId) => {
  try {
    if (!userId) {
      // No user logged in, return empty array
      return [];
    }

    // Fetch from Supabase only (no localStorage fallback)
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Supabase fetch failed:', error.message);
      throw error;
    }

    // Convert Supabase format to app format
    const holdings = data.map(holding => ({
      id: holding.id,
      coinId: holding.coin_id,
      symbol: holding.symbol,
      name: holding.name,
      quantity: parseFloat(holding.quantity),
      buyPrice: parseFloat(holding.buy_price),
      currentPrice: parseFloat(holding.current_price) || 0,
      priceChange24h: parseFloat(holding.price_change_24h) || 0,
      createdAt: holding.created_at,
      updatedAt: holding.updated_at,
      // Use CoinCap.io for crypto icons (more reliable)
      image: holding.image || `https://assets.coincap.io/assets/icons/${holding.symbol.toLowerCase()}@2x.png`
    }));

    return holdings;
  } catch (error) {
    console.error('❌ Error in getHoldings:', error);
    return [];
  }
};

/**
 * Add a new holding or update existing
 * @param {Object} holdingData - Holding data
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Object>} Created/updated holding
 */
export const addOrUpdateHolding = async (holdingData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID required for adding holdings');
    }

    const { coinId, symbol, name, quantity, buyPrice, currentPrice, priceChange24h } = holdingData;

    // Check if holding already exists
    const { data: existing } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', userId)
      .eq('coin_id', coinId)
      .single();

    if (existing) {
      // Update existing holding (for averaging)
      const oldQuantity = parseFloat(existing.quantity);
      const oldBuyPrice = parseFloat(existing.buy_price);
      const newQuantity = quantity;
      const newBuyPrice = buyPrice;

      const totalQuantity = oldQuantity + newQuantity;
      const avgBuyPrice = ((oldQuantity * oldBuyPrice) + (newQuantity * newBuyPrice)) / totalQuantity;

      const { data, error } = await supabase
        .from('holdings')
        .update({
          quantity: totalQuantity,
          buy_price: avgBuyPrice,
          current_price: currentPrice || existing.current_price,
          price_change_24h: priceChange24h || existing.price_change_24h,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        coinId: data.coin_id,
        symbol: data.symbol,
        name: data.name,
        quantity: parseFloat(data.quantity),
        buyPrice: parseFloat(data.buy_price),
        currentPrice: parseFloat(data.current_price),
        priceChange24h: parseFloat(data.price_change_24h)
      };
    } else {
      // Insert new holding
      const { data, error } = await supabase
        .from('holdings')
        .insert({
          user_id: userId,
          coin_id: coinId,
          symbol,
          name,
          quantity,
          buy_price: buyPrice,
          current_price: currentPrice || buyPrice,
          price_change_24h: priceChange24h || 0
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        coinId: data.coin_id,
        symbol: data.symbol,
        name: data.name,
        quantity: parseFloat(data.quantity),
        buyPrice: parseFloat(data.buy_price),
        currentPrice: parseFloat(data.current_price),
        priceChange24h: parseFloat(data.price_change_24h)
      };
    }
  } catch (error) {
    console.error('Error in addOrUpdateHolding:', error);
    throw error;
  }
};

/**
 * Update holding quantity and price (for sell operations)
 * @param {string} holdingId - Holding UUID
 * @param {Object} updates - Fields to update
 * @param {string} userId - Supabase user ID
 * @returns {Promise<Object>} Updated holding
 */
export const updateHolding = async (holdingId, updates, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID required for updating holdings');
    }

    const { data, error } = await supabase
      .from('holdings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', holdingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      coinId: data.coin_id,
      symbol: data.symbol,
      name: data.name,
      quantity: parseFloat(data.quantity),
      buyPrice: parseFloat(data.buy_price),
      currentPrice: parseFloat(data.current_price),
      priceChange24h: parseFloat(data.price_change_24h)
    };
  } catch (error) {
    console.error('Error in updateHolding:', error);
    throw error;
  }
};

/**
 * Delete a holding
 * @param {string} holdingId - Holding UUID
 * @param {string} userId - Supabase user ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteHolding = async (holdingId, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID required for deleting holdings');
    }

    const { error } = await supabase
      .from('holdings')
      .delete()
      .eq('id', holdingId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error in deleteHolding:', error);
    throw error;
  }
};

/**
 * Update all holdings with current prices
 * @param {Array} priceUpdates - Array of {coinId, currentPrice, priceChange24h}
 * @param {string} userId - Supabase user ID
 * @returns {Promise<boolean>} Success status
 */
export const bulkUpdatePrices = async (priceUpdates, userId) => {
  try {
    if (!userId || !priceUpdates || priceUpdates.length === 0) {
      return false;
    }

    // Update each holding's price
    const promises = priceUpdates.map(({ coinId, currentPrice, priceChange24h }) =>
      supabase
        .from('holdings')
        .update({
          current_price: currentPrice,
          price_change_24h: priceChange24h,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('coin_id', coinId)
    );

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error in bulkUpdatePrices:', error);
    return false;
  }
};

/**
 * Migrate localStorage data to Supabase (one-time migration)
 * @param {string} userId - Supabase user ID
 * @returns {Promise<boolean>} Success status
 */
export const migrateLocalStorageToSupabase = async (userId) => {
  try {
    if (!userId) return false;

    // Get data from localStorage
    const localHoldings = getStorageItem(STORAGE_KEYS.PORTFOLIO, []);
    
    if (localHoldings.length === 0) {
      return true; // Nothing to migrate
    }

    // Check if user already has data in Supabase
    const { data: existingData } = await supabase
      .from('holdings')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingData && existingData.length > 0) {
      return true; // Already migrated
    }

    // Migrate each holding
    const migrationPromises = localHoldings.map(holding => 
      supabase.from('holdings').insert({
        user_id: userId,
        coin_id: holding.coinId,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice || holding.buyPrice,
        price_change_24h: holding.priceChange24h || 0
      })
    );

    await Promise.all(migrationPromises);
    
    return true;
  } catch (error) {
    console.error('Error migrating to Supabase:', error);
    return false;
  }
};

/**
 * Ensure holding has a valid coin_id (fallback for old data)
 * @param {Object} holding - Holding object
 * @param {string} userId - User ID
 * @returns {Promise<string>} Coin ID
 */
export const ensureHoldingHasCoinId = async (holding, userId) => {
  try {
    // If coin_id exists, return it
    if (holding.coinId || holding.coin_id) {
      return holding.coinId || holding.coin_id;
    }

    // Try to find coin_id by symbol
    if (holding.symbol) {
      console.log(`⚠️ Holding missing coin_id, searching by symbol: ${holding.symbol}`);
      const coinId = await findCoinIdBySymbol(holding.symbol);
      
      if (coinId) {
        // Update the holding in database with the found coin_id
        await supabase
          .from('holdings')
          .update({ coin_id: coinId })
          .eq('id', holding.id)
          .eq('user_id', userId);
        
        console.log(`✅ Updated holding ${holding.symbol} with coin_id: ${coinId}`);
        return coinId;
      }
    }

    // Fallback: use symbol as ID (lowercase)
    console.warn(`⚠️ Could not find coin_id for ${holding.symbol}, using symbol as fallback`);
    return holding.symbol?.toLowerCase() || 'unknown';
  } catch (error) {
    console.error('Error ensuring coin_id:', error);
    return holding.symbol?.toLowerCase() || 'unknown';
  }
};
