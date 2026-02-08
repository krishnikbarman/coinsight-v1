import React, { useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { calculatePortfolioDiversity } from '../utils/calculations'
import { getDiversificationWarnings } from '../utils/analytics'

const DiversificationCard = () => {
  const { coins, priceLoading } = usePortfolio()
  const [isExpanded, setIsExpanded] = useState(false)

  if (coins.length === 0) {
    return (
      <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6">
        <h3 className="text-xl font-bold text-white mb-4">Diversification</h3>
        <p className="text-gray-400 text-center py-8">Buy coins to see diversification analysis</p>
      </div>
    )
  }

  const diversityData = calculatePortfolioDiversity(coins)
  const { hasWarning, warnings, topAllocations } = getDiversificationWarnings(diversityData)

  // Sort by allocation percentage
  const sortedAllocations = [...diversityData].sort(
    (a, b) => b.allocationPercentage - a.allocationPercentage
  )

  const top3 = sortedAllocations.slice(0, 3)
  const displayedAllocations = isExpanded ? sortedAllocations : top3

  return (
    <div className="relative bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 group animate-fadeIn h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Diversification</h3>
          <p className="text-sm text-gray-400 opacity-70">Asset allocation breakdown</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-3xl opacity-50 group-hover:opacity-70 transition-opacity">🎯</span>
        </div>
      </div>

      {/* Allocations List */}
      <div className="space-y-5 mb-6 flex-1 overflow-y-auto max-h-[400px]">
        {displayedAllocations.map((coin, index) => (
          <div key={coin.id} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-xs font-mono w-7 font-semibold opacity-70">#{index + 1}</span>
                {coin.image && (
                  <img 
                    src={coin.image} 
                    alt={coin.name} 
                    className="w-7 h-7 rounded-full ring-2 ring-neon-blue/20"
                  />
                )}
                <span className="text-white font-bold text-base">{coin.symbol}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-neon-blue font-black text-lg text-right min-w-[60px]">
                  {coin.allocationPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-1.5 bg-dark-tertiary rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                  coin.allocationPercentage > 50 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : coin.allocationPercentage > 30
                    ? 'bg-gradient-to-r from-yellow-500 to-neon-blue'
                    : 'bg-gradient-to-r from-neon-blue to-neon-green'
                }`}
                style={{ 
                  width: `${Math.min(coin.allocationPercentage, 100)}%`,
                  animation: 'slideIn 0.8s ease-out'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse Toggle */}
      {sortedAllocations.length > 3 && (
        <div className="text-center py-3 border-t border-dark-tertiary">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neon-blue hover:text-neon-blue/80 text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto group/toggle"
          >
            <span>
              {isExpanded 
                ? 'Show Less' 
                : `+ ${sortedAllocations.length - 3} more ${sortedAllocations.length - 3 === 1 ? 'asset' : 'assets'}`
              }
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Warnings Section */}
      {hasWarning && (
        <div className="mt-5 pt-5 border-t border-dark-tertiary">
          {warnings.map((warning, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl mb-2.5 transition-all duration-300 ${
                warning.type === 'high' 
                  ? 'bg-red-500/5 border-2 border-red-500/20 hover:border-red-500/30' 
                  : 'bg-orange-500/5 border-2 border-orange-400/20 hover:border-orange-400/30'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl mt-0.5">
                  {warning.type === 'high' ? '⚠️' : '⚡'}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-bold mb-1.5 ${
                    warning.type === 'high' ? 'text-red-400' : 'text-orange-400'
                  }`}>
                    {warning.message}
                  </p>
                  <p className="text-xs text-gray-400 opacity-70">
                    {warning.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Healthy Diversification Message */}
      {!hasWarning && coins.length >= 3 && (
        <div className="mt-5 pt-5 border-t border-dark-tertiary">
          <div className="p-4 rounded-xl bg-green-500/5 border-2 border-green-500/20">
            <div className="flex items-start space-x-3">
              <span className="text-xl mt-0.5">✅</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-400 mb-1.5">
                  Well Balanced Portfolio
                </p>
                <p className="text-xs text-gray-400 opacity-70">
                  Your assets are well distributed with no excessive concentration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default DiversificationCard
