import React from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { getSnapshotDaysAgo, calculatePercentageChange } from '../utils/historyUtils'

const SnapshotCard = ({ daysAgo, title, icon }) => {
  const { formatCurrency } = usePortfolio()
  const metrics = usePortfolio().calculateMetrics()
  const currentValue = metrics.totalValue || 0

  // Get historical snapshot
  const snapshot = getSnapshotDaysAgo(daysAgo)
  const historicalValue = snapshot ? snapshot.value : null
  
  // Calculate change
  const hasHistory = historicalValue !== null
  const changeValue = hasHistory ? currentValue - historicalValue : 0
  const changePercentage = hasHistory ? calculatePercentageChange(historicalValue, currentValue) : 0
  const isPositive = changeValue >= 0

  return (
    <div className="relative bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-dark-tertiary to-dark-tertiary/50 rounded-xl flex items-center justify-center">
            <span className="text-3xl">{icon}</span>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1.5 opacity-70">{title}</p>
            <p className="text-white font-black text-xl">
              {hasHistory ? formatCurrency(historicalValue) : 'No Data'}
            </p>
          </div>
        </div>
      </div>

      {hasHistory ? (
        <div className="space-y-4">
          {/* Current Value */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 font-medium">Current Value</span>
            <span className="text-white font-bold text-base">{formatCurrency(currentValue)}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-dark-tertiary"></div>

          {/* Change Amount */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 font-medium">Change</span>
            <span className={`font-bold text-base ${isPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
              {isPositive ? '+' : ''}{formatCurrency(changeValue)}
            </span>
          </div>

          {/* Percentage Change - Large Display */}
          <div className="mt-5 pt-5 border-t border-dark-tertiary">
            <div className="flex items-center justify-center space-x-2">
              <div className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                isPositive ? 'bg-green-500/10 border-2 border-green-500/30' : 'bg-red-500/10 border-2 border-red-500/30'
              }`}>
                {isPositive ? (
                  <svg className="w-6 h-6 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`text-3xl font-black ${isPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
                  {isPositive ? '+' : ''}{Math.abs(changePercentage).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Date Badge */}
          <div className="text-center mt-4">
            <span className="inline-block px-4 py-1.5 bg-dark-tertiary rounded-full text-xs text-gray-400 font-semibold">
              vs {snapshot.date}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-dark-tertiary rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              Not enough history
            </p>
            <p className="text-gray-600 text-xs">
              Check back in {daysAgo} days
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SnapshotCard
