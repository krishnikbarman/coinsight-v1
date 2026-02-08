/**
 * Analytics Utility
 * Advanced portfolio analytics and insight generation
 * Rule-based calculations only - no AI/ML models
 */

import { 
  calculateCoinProfitLoss, 
  calculateTotalValue,
  calculatePortfolioDiversity 
} from './calculations'

/**
 * Coin category definitions for portfolio health scoring
 */
const COIN_CATEGORIES = {
  bluechip: ['BTC', 'ETH', 'bitcoin', 'ethereum'],
  stable: ['USDT', 'USDC', 'DAI', 'BUSD', 'tether', 'usd-coin'],
  largecap: ['BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'MATIC', 'binancecoin', 'ripple', 'cardano', 'solana', 'polkadot', 'matic-network'],
  meme: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'dogecoin', 'shiba-inu', 'pepe'],
  defi: ['UNI', 'AAVE', 'LINK', 'MKR', 'uniswap', 'aave', 'chainlink', 'maker']
}

/**
 * Categorize a coin by symbol or coinId
 * @param {Object} coin - Coin object with symbol and coinId
 * @returns {string} - Category name
 */
export const categorizeCoin = (coin) => {
  const identifier = (coin.symbol || '').toUpperCase()
  const coinId = (coin.coinId || '').toLowerCase()

  for (const [category, identifiers] of Object.entries(COIN_CATEGORIES)) {
    if (identifiers.includes(identifier) || identifiers.includes(coinId)) {
      return category
    }
  }

  return 'other'
}

/**
 * Calculate portfolio health score (0-100)
 * Based on diversification, performance, and risk factors
 * @param {Array} coins - Array of coin objects
 * @returns {Object} - Health score and breakdown
 */
export const calculatePortfolioHealth = (coins) => {
  if (coins.length === 0) {
    return {
      score: 0,
      rating: 'N/A',
      breakdown: {
        diversification: 0,
        performance: 0,
        stability: 0,
        risk: 0
      }
    }
  }

  const diversityData = calculatePortfolioDiversity(coins)
  const totalValue = calculateTotalValue(coins)

  // 1. Diversification Score (0-30 points)
  let diversificationScore = 0
  const numCoins = coins.length
  
  if (numCoins >= 5) diversificationScore = 30
  else if (numCoins >= 3) diversificationScore = 20
  else if (numCoins >= 2) diversificationScore = 10
  else diversificationScore = 5

  // Penalty for over-concentration (>50% in one coin)
  const maxAllocation = Math.max(...diversityData.map(c => c.allocationPercentage))
  if (maxAllocation > 50) diversificationScore = Math.max(5, diversificationScore - 15)
  if (maxAllocation > 70) diversificationScore = Math.max(0, diversificationScore - 10)

  // 2. Performance Score (0-30 points)
  let performanceScore = 0
  const coinsInProfit = coins.filter(coin => {
    const { isProfit } = calculateCoinProfitLoss(coin)
    return isProfit
  }).length

  const profitRatio = coinsInProfit / numCoins
  performanceScore = Math.round(profitRatio * 30)

  // Bonus for overall portfolio profit
  const allCoinsData = coins.map(coin => calculateCoinProfitLoss(coin))
  const avgProfitLoss = allCoinsData.reduce((sum, c) => sum + c.profitLossPercentage, 0) / numCoins
  if (avgProfitLoss > 20) performanceScore += 5
  else if (avgProfitLoss > 10) performanceScore += 3

  performanceScore = Math.min(30, performanceScore)

  // 3. Stability Score (0-25 points)
  let stabilityScore = 0
  const categories = coins.map(coin => categorizeCoin(coin))
  
  const bluechipCount = categories.filter(c => c === 'bluechip').length
  const stableCount = categories.filter(c => c === 'stable').length
  const largecapCount = categories.filter(c => c === 'largecap').length
  const memeCount = categories.filter(c => c === 'meme').length

  // Points for blue chip presence
  if (bluechipCount >= 2) stabilityScore += 12
  else if (bluechipCount >= 1) stabilityScore += 8

  // Points for stablecoins
  if (stableCount >= 1) stabilityScore += 5

  // Points for large caps
  if (largecapCount >= 1) stabilityScore += 5

  // Penalty for too many meme coins
  if (memeCount > numCoins * 0.5) stabilityScore = Math.max(0, stabilityScore - 10)

  stabilityScore = Math.min(25, stabilityScore)

  // 4. Risk Score (0-15 points) - higher is better (lower risk)
  let riskScore = 15
  
  // Adjust based on meme coin percentage
  const memePercentage = (memeCount / numCoins) * 100
  if (memePercentage > 40) riskScore -= 8
  else if (memePercentage > 20) riskScore -= 4

  // Adjust based on concentration
  if (maxAllocation > 60) riskScore -= 5
  else if (maxAllocation > 40) riskScore -= 2

  riskScore = Math.max(0, riskScore)

  // Calculate total score
  const totalScore = diversificationScore + performanceScore + stabilityScore + riskScore

  // Determine rating
  let rating
  if (totalScore >= 80) rating = 'Excellent'
  else if (totalScore >= 60) rating = 'Good'
  else if (totalScore >= 40) rating = 'Average'
  else rating = 'Poor'

  return {
    score: Math.round(totalScore),
    rating,
    breakdown: {
      diversification: Math.round(diversificationScore),
      performance: Math.round(performanceScore),
      stability: Math.round(stabilityScore),
      risk: Math.round(riskScore)
    },
    metadata: {
      maxAllocation,
      profitRatio,
      avgProfitLoss: Math.round(avgProfitLoss * 100) / 100,
      categories: {
        bluechip: bluechipCount,
        stable: stableCount,
        largecap: largecapCount,
        meme: memeCount,
        other: numCoins - bluechipCount - stableCount - largecapCount - memeCount
      }
    }
  }
}

/**
 * Generate smart insights based on portfolio analysis
 * Rule-based text generation
 * @param {Array} coins - Array of coin objects
 * @param {Object} healthData - Health score data from calculatePortfolioHealth
 * @returns {Array} - Array of insight objects
 */
export const generateSmartInsights = (coins, healthData) => {
  const insights = []

  if (coins.length === 0) {
    return [{
      type: 'info',
      title: 'No Portfolio Data',
      message: 'Buy coins to build your portfolio and see personalized insights.',
      priority: 1
    }]
  }

  const diversityData = calculatePortfolioDiversity(coins)
  const { metadata } = healthData

  // Insight 1: Diversification
  if (metadata.maxAllocation > 50) {
    const topCoin = diversityData.reduce((max, coin) => 
      coin.allocationPercentage > max.allocationPercentage ? coin : max
    )
    
    insights.push({
      type: 'warning',
      title: 'High Concentration Risk',
      message: `${topCoin.symbol} represents ${metadata.maxAllocation.toFixed(1)}% of your portfolio. Consider diversifying to reduce risk.`,
      priority: 1
    })
  } else if (coins.length >= 5 && metadata.maxAllocation < 30) {
    insights.push({
      type: 'success',
      title: 'Well Diversified Portfolio',
      message: 'Your portfolio shows healthy diversification across multiple assets.',
      priority: 2
    })
  }

  // Insight 2: Performance
  if (metadata.avgProfitLoss > 15) {
    insights.push({
      type: 'success',
      title: 'Strong Performance',
      message: `Your portfolio is up an average of ${metadata.avgProfitLoss.toFixed(1)}% across all holdings. Great job!`,
      priority: 1
    })
  } else if (metadata.avgProfitLoss < -10) {
    insights.push({
      type: 'warning',
      title: 'Portfolio Underperforming',
      message: `Your portfolio is down an average of ${Math.abs(metadata.avgProfitLoss).toFixed(1)}%. Consider reviewing your holdings.`,
      priority: 1
    })
  }

  // Insight 3: Blue Chip Holdings
  if (metadata.categories.bluechip === 0) {
    insights.push({
      type: 'info',
      title: 'No Blue Chip Assets',
      message: 'Consider adding BTC or ETH for portfolio stability.',
      priority: 3
    })
  } else if (metadata.categories.bluechip >= 2) {
    insights.push({
      type: 'success',
      title: 'Strong Foundation',
      message: 'Your portfolio includes major blue chip cryptocurrencies.',
      priority: 3
    })
  }

  // Insight 4: Meme Coin Risk
  const memePercentage = (metadata.categories.meme / coins.length) * 100
  if (memePercentage > 30) {
    insights.push({
      type: 'warning',
      title: 'High Meme Coin Exposure',
      message: 'You have significant exposure to meme coins. These are highly volatile and speculative.',
      priority: 2
    })
  }

  // Insight 5: Stablecoin Balance
  if (metadata.categories.stable > 0 && metadata.avgProfitLoss < 0) {
    const stableAllocation = diversityData
      .filter(c => categorizeCoin(c) === 'stable')
      .reduce((sum, c) => sum + c.allocationPercentage, 0)
    
    insights.push({
      type: 'info',
      title: 'Stablecoin Buffer',
      message: `${stableAllocation.toFixed(1)}% in stablecoins provides downside protection.`,
      priority: 3
    })
  }

  // Insight 6: Portfolio Size
  if (coins.length < 3) {
    insights.push({
      type: 'info',
      title: 'Limited Diversification',
      message: 'Consider adding more assets to spread risk across different cryptocurrencies.',
      priority: 2
    })
  }

  // Insight 7: Best Performer Highlight
  const bestPerformer = coins
    .map(coin => ({ ...coin, ...calculateCoinProfitLoss(coin) }))
    .reduce((best, coin) => 
      coin.profitLossPercentage > best.profitLossPercentage ? coin : best
    , { profitLossPercentage: -Infinity })

  if (bestPerformer.profitLossPercentage > 50) {
    insights.push({
      type: 'success',
      title: 'Star Performer',
      message: `${bestPerformer.symbol} is up ${bestPerformer.profitLossPercentage.toFixed(1)}%! Consider taking some profit.`,
      priority: 2
    })
  }

  // Sort by priority and return top insights
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5)
}

/**
 * Get diversification warnings and recommendations
 * @param {Array} diversityData - Output from calculatePortfolioDiversity
 * @returns {Object} - Warning status and details
 */
export const getDiversificationWarnings = (diversityData) => {
  if (diversityData.length === 0) {
    return { hasWarning: false, warnings: [] }
  }

  const warnings = []
  const sortedByAllocation = [...diversityData].sort(
    (a, b) => b.allocationPercentage - a.allocationPercentage
  )

  const topCoin = sortedByAllocation[0]

  if (topCoin.allocationPercentage > 50) {
    warnings.push({
      type: 'high',
      message: `${topCoin.symbol} dominates your portfolio at ${topCoin.allocationPercentage.toFixed(1)}%`,
      recommendation: 'Consider rebalancing to reduce concentration risk'
    })
  } else if (topCoin.allocationPercentage > 35) {
    warnings.push({
      type: 'medium',
      message: `${topCoin.symbol} represents a large portion (${topCoin.allocationPercentage.toFixed(1)}%)`,
      recommendation: 'Monitor this position closely'
    })
  }

  // Check for two coins dominating
  if (sortedByAllocation.length >= 2) {
    const topTwoAllocation = sortedByAllocation[0].allocationPercentage + 
                             sortedByAllocation[1].allocationPercentage
    
    if (topTwoAllocation > 70) {
      warnings.push({
        type: 'medium',
        message: `${sortedByAllocation[0].symbol} and ${sortedByAllocation[1].symbol} make up ${topTwoAllocation.toFixed(1)}% of portfolio`,
        recommendation: 'Add more assets for better diversification'
      })
    }
  }

  return {
    hasWarning: warnings.length > 0,
    warnings,
    topAllocations: sortedByAllocation.slice(0, 3)
  }
}

/**
 * Get top performers by percentage gain
 * @param {Array} coins - Array of coin objects
 * @param {number} limit - Number of top performers to return
 * @returns {Array} - Top performing coins
 */
export const getTopPerformers = (coins, limit = 3) => {
  return coins
    .map(coin => ({ ...coin, ...calculateCoinProfitLoss(coin) }))
    .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
    .slice(0, limit)
}

/**
 * Get bottom performers by percentage loss
 * @param {Array} coins - Array of coin objects
 * @param {number} limit - Number of bottom performers to return
 * @returns {Array} - Bottom performing coins
 */
export const getBottomPerformers = (coins, limit = 3) => {
  return coins
    .map(coin => ({ ...coin, ...calculateCoinProfitLoss(coin) }))
    .sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)
    .slice(0, limit)
}

export default {
  categorizeCoin,
  calculatePortfolioHealth,
  generateSmartInsights,
  getDiversificationWarnings,
  getTopPerformers,
  getBottomPerformers
}
