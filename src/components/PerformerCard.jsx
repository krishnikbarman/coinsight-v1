import React from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { getTopPerformers, getBottomPerformers } from '../utils/analytics'

const PerformerCard = () => {
  const { coins, formatCurrency, priceLoading } = usePortfolio()

  if (coins.length === 0) {
    return (
      <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6">
        <h3 className="text-xl font-bold text-white mb-4">Performance Leaders</h3>
        <p className="text-gray-400 text-center py-8">Buy coins to see performance data</p>
      </div>
    )
  }

  const topPerformers = getTopPerformers(coins, 1)
  const bottomPerformers = getBottomPerformers(coins, 1)

  const bestPerformer = topPerformers[0]
  const worstPerformer = bottomPerformers[0]

  return (
    <div className="relative bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 group animate-fadeIn h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Performance Leaders</h3>
          <p className="text-sm text-gray-400 opacity-70">Top & bottom performers</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-3xl opacity-50 group-hover:opacity-70 transition-opacity">📊</span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Best Performer */}
        <div className="bg-dark-tertiary rounded-xl p-5 border-2 border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 group/best">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full flex items-center justify-center group-hover/best:scale-110 transition-transform duration-300">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5 opacity-70">Best Performer</p>
                <div className="flex items-center space-x-2.5 mt-1">
                  {bestPerformer.image && (
                    <img 
                      src={bestPerformer.image} 
                      alt={bestPerformer.name} 
                      className="w-7 h-7 rounded-full ring-2 ring-green-500/30"
                    />
                  )}
                  <span className="text-white font-bold text-lg">{bestPerformer.symbol}</span>
                  <span className="text-gray-400 text-sm opacity-70">{bestPerformer.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-baseline space-x-3 mb-2">
                <span className="text-neon-green font-black text-3xl transition-all duration-500">
                  +{bestPerformer.profitLossPercentage.toFixed(2)}%
                </span>
                <svg className="w-6 h-6 text-neon-green animate-pulse-glow" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-neon-green text-base font-semibold mb-1">
                +{formatCurrency(Math.abs(bestPerformer.profitLoss))}
              </p>
              <p className="text-[11px] text-gray-400 opacity-70">Current: {formatCurrency(bestPerformer.currentValue)}</p>
            </div>
          </div>
        </div>

        {/* Worst Performer */}
        <div className="bg-dark-tertiary rounded-xl p-5 border-2 border-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 group/worst">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-full flex items-center justify-center group-hover/worst:scale-110 transition-transform duration-300">
                <span className="text-2xl">📉</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5 opacity-70">Worst Performer</p>
                <div className="flex items-center space-x-2.5 mt-1">
                  {worstPerformer.image && (
                    <img 
                      src={worstPerformer.image} 
                      alt={worstPerformer.name} 
                      className="w-7 h-7 rounded-full ring-2 ring-red-500/30"
                    />
                  )}
                  <span className="text-white font-bold text-lg">{worstPerformer.symbol}</span>
                  <span className="text-gray-400 text-sm opacity-70">{worstPerformer.name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="flex items-baseline space-x-3 mb-2">
                <span className={`font-black text-3xl transition-all duration-500 ${
                  worstPerformer.profitLossPercentage >= 0 ? 'text-neon-green' : 'text-neon-pink'
                }`}>
                  {worstPerformer.profitLossPercentage >= 0 ? '+' : ''}
                  {worstPerformer.profitLossPercentage.toFixed(2)}%
                </span>
                {worstPerformer.profitLossPercentage < 0 && (
                  <svg className="w-6 h-6 text-neon-pink animate-pulse-glow" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className={`text-base font-semibold mb-1 ${
                worstPerformer.profitLossPercentage >= 0 ? 'text-neon-green' : 'text-neon-pink'
              }`}>
                {worstPerformer.profitLossPercentage >= 0 ? '+' : ''}
                {formatCurrency(worstPerformer.profitLoss)}
              </p>
              <p className="text-[11px] text-gray-400 opacity-70">Current: {formatCurrency(worstPerformer.currentValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {priceLoading && (
        <div className="absolute inset-0 bg-dark-secondary/80 rounded-xl flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformerCard
