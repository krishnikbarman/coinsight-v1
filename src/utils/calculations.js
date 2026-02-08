/**
 * Portfolio Calculations Utility
 * Contains all calculation logic for portfolio metrics and analytics
 */

/**
 * Calculate total portfolio value
 * @param {Array} coins - Array of coin objects with quantity and currentPrice
 * @returns {number} - Total portfolio value
 */
export const calculateTotalValue = (coins) => {
  return coins.reduce((total, coin) => {
    return total + (coin.quantity * coin.currentPrice)
  }, 0)
}

/**
 * Calculate total invested amount
 * @param {Array} coins - Array of coin objects with quantity and buyPrice
 * @returns {number} - Total invested amount
 */
export const calculateTotalInvested = (coins) => {
  return coins.reduce((total, coin) => {
    return total + (coin.quantity * coin.buyPrice)
  }, 0)
}

/**
 * Calculate profit/loss for a single coin
 * @param {Object} coin - Coin object with quantity, buyPrice, and currentPrice
 * @returns {Object} - Profit/loss data
 */
export const calculateCoinProfitLoss = (coin) => {
  const invested = coin.quantity * coin.buyPrice
  const currentValue = coin.quantity * coin.currentPrice
  const profitLoss = currentValue - invested
  const profitLossPercentage = invested > 0 ? ((profitLoss / invested) * 100) : 0

  return {
    invested,
    currentValue,
    profitLoss,
    profitLossPercentage,
    isProfit: profitLoss >= 0
  }
}

/**
 * Calculate total profit/loss for entire portfolio
 * @param {Array} coins - Array of coin objects
 * @returns {Object} - Total profit/loss data
 */
export const calculateTotalProfitLoss = (coins) => {
  const totalValue = calculateTotalValue(coins)
  const totalInvested = calculateTotalInvested(coins)
  const profitLoss = totalValue - totalInvested
  const profitLossPercentage = totalInvested > 0 ? ((profitLoss / totalInvested) * 100) : 0

  return {
    totalValue,
    totalInvested,
    profitLoss,
    profitLossPercentage,
    isProfit: profitLoss >= 0
  }
}

/**
 * Find the best performing coin in portfolio
 * @param {Array} coins - Array of coin objects
 * @returns {Object|null} - Best performing coin with performance data
 */
export const findBestPerformer = (coins) => {
  if (coins.length === 0) return null

  let bestCoin = null
  let highestPercentage = -Infinity

  coins.forEach(coin => {
    const { profitLossPercentage } = calculateCoinProfitLoss(coin)
    
    if (profitLossPercentage > highestPercentage) {
      highestPercentage = profitLossPercentage
      bestCoin = {
        ...coin,
        ...calculateCoinProfitLoss(coin)
      }
    }
  })

  return bestCoin
}

/**
 * Find the worst performing coin in portfolio
 * @param {Array} coins - Array of coin objects
 * @returns {Object|null} - Worst performing coin with performance data
 */
export const findWorstPerformer = (coins) => {
  if (coins.length === 0) return null

  let worstCoin = null
  let lowestPercentage = Infinity

  coins.forEach(coin => {
    const { profitLossPercentage } = calculateCoinProfitLoss(coin)
    
    if (profitLossPercentage < lowestPercentage) {
      lowestPercentage = profitLossPercentage
      worstCoin = {
        ...coin,
        ...calculateCoinProfitLoss(coin)
      }
    }
  })

  return worstCoin
}

/**
 * Calculate comprehensive portfolio metrics
 * @param {Array} coins - Array of coin objects
 * @returns {Object} - Complete portfolio metrics
 */
export const calculatePortfolioMetrics = (coins) => {
  if (coins.length === 0) {
    return {
      totalValue: 0,
      totalInvested: 0,
      totalProfitLoss: 0,
      profitLossPercentage: 0,
      bestCoin: null,
      worstCoin: null,
      coinsWithPerformance: []
    }
  }

  const { totalValue, totalInvested, profitLoss, profitLossPercentage } = 
    calculateTotalProfitLoss(coins)

  const bestCoin = findBestPerformer(coins)
  const worstCoin = findWorstPerformer(coins)

  // Add performance data to all coins
  const coinsWithPerformance = coins.map(coin => ({
    ...coin,
    ...calculateCoinProfitLoss(coin)
  }))

  return {
    totalValue,
    totalInvested,
    totalProfitLoss: profitLoss,
    profitLossPercentage,
    bestCoin,
    worstCoin,
    coinsWithPerformance
  }
}

/**
 * Calculate portfolio diversity (percentage allocation per coin)
 * @param {Array} coins - Array of coin objects
 * @returns {Array} - Array of coins with allocation percentage
 */
export const calculatePortfolioDiversity = (coins) => {
  const totalValue = calculateTotalValue(coins)

  if (totalValue === 0) {
    return coins.map(coin => ({
      ...coin,
      allocationPercentage: 0
    }))
  }

  return coins.map(coin => {
    const coinValue = coin.quantity * coin.currentPrice
    const allocationPercentage = (coinValue / totalValue) * 100

    return {
      ...coin,
      coinValue,
      allocationPercentage
    }
  })
}

/**
 * Calculate daily changes for coins
 * @param {Array} coins - Array of coin objects
 * @param {Object} priceData - Price data with 24h changes
 * @returns {Array} - Coins with daily change data
 */
export const calculateDailyChanges = (coins, priceData) => {
  return coins.map(coin => {
    const coinId = coin.coinId || coin.symbol.toLowerCase()
    const coinPriceData = priceData[coinId]
    
    const dailyChange = coinPriceData?.[`usd_24h_change`] || 0
    const dailyChangeValue = coin.currentPrice * (dailyChange / 100)

    return {
      ...coin,
      dailyChange,
      dailyChangeValue
    }
  })
}

/**
 * Sort coins by specified metric
 * @param {Array} coins - Array of coin objects
 * @param {string} sortBy - Metric to sort by (value, profit, percentage, name)
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} - Sorted array of coins
 */
export const sortCoinsByMetric = (coins, sortBy = 'value', order = 'desc') => {
  const coinsWithMetrics = coins.map(coin => ({
    ...coin,
    ...calculateCoinProfitLoss(coin),
    currentValue: coin.quantity * coin.currentPrice
  }))

  return [...coinsWithMetrics].sort((a, b) => {
    let aValue, bValue

    switch (sortBy) {
      case 'value':
        aValue = a.currentValue
        bValue = b.currentValue
        break
      case 'profit':
        aValue = a.profitLoss
        bValue = b.profitLoss
        break
      case 'percentage':
        aValue = a.profitLossPercentage
        bValue = b.profitLossPercentage
        break
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        return order === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      default:
        return 0
    }

    return order === 'asc' ? aValue - bValue : bValue - aValue
  })
}

/**
 * Calculate risk score for a coin based on volatility and allocation
 * @param {Object} coin - Coin object with performance data
 * @param {number} allocationPercentage - Percentage of portfolio
 * @returns {number} - Risk score (0-100)
 */
export const calculateRiskScore = (coin, allocationPercentage) => {
  // Simple risk score based on allocation and volatility
  const allocationRisk = allocationPercentage > 30 ? 50 : allocationPercentage * 1.5
  const volatilityRisk = Math.abs(coin.dailyChange || 0) * 2
  
  const totalRisk = Math.min(100, allocationRisk + volatilityRisk)
  return Math.round(totalRisk)
}

export default {
  calculateTotalValue,
  calculateTotalInvested,
  calculateCoinProfitLoss,
  calculateTotalProfitLoss,
  findBestPerformer,
  findWorstPerformer,
  calculatePortfolioMetrics,
  calculatePortfolioDiversity,
  calculateDailyChanges,
  sortCoinsByMetric,
  calculateRiskScore
}
