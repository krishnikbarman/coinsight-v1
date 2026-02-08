import React, { useEffect, useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { calculatePortfolioHealth } from '../utils/analytics'

const HealthMeter = () => {
  const { coins, priceLoading } = usePortfolio()
  const [animatedScore, setAnimatedScore] = useState(0)

  const healthData = calculatePortfolioHealth(coins)
  const { score, rating, breakdown } = healthData

  // Animate the score counter
  useEffect(() => {
    let startTime
    const duration = 1500 // 1.5 seconds
    const targetScore = score

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentScore = Math.floor(easeOutQuart * targetScore)
      
      setAnimatedScore(currentScore)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score])

  // Get color based on rating - refined color logic
  const getRatingColor = () => {
    // 0-40: red, 40-70: yellow, 70-100: cyan/green
    if (score >= 70) {
      return {
        gradient: 'from-cyan-500 to-green-400',
        glow: 'shadow-cyan-500/50',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/40',
        shadow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]'
      }
    } else if (score >= 40) {
      return {
        gradient: 'from-yellow-500 to-orange-400',
        glow: 'shadow-yellow-500/50',
        text: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/40',
        shadow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]'
      }
    } else {
      return {
        gradient: 'from-red-500 to-orange-500',
        glow: 'shadow-red-500/50',
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/40',
        shadow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'
      }
    }
  }

  const colors = getRatingColor()

  if (coins.length === 0) {
    return (
      <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6">
        <h3 className="text-xl font-bold text-white mb-4">Portfolio Health</h3>
        <p className="text-gray-400 text-center py-8">Buy coins to see health score</p>
      </div>
    )
  }

  return (
    <div className="relative bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 group animate-fadeIn h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Portfolio Health</h3>
          <p className="text-sm text-gray-400 opacity-70">Overall portfolio score</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-3xl opacity-50 group-hover:opacity-70 transition-opacity">🏥</span>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className={`relative w-52 h-52 ${colors.shadow}`}>
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="104"
              cy="104"
              r="88"
              stroke="#1e293b"
              strokeWidth="14"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="104"
              cy="104"
              r="88"
              stroke={`url(#healthGradient-${score})`}
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(animatedScore / 100) * 552.9} 552.9`}
              className="transition-all duration-1500 ease-out"
            />
            <defs>
              <linearGradient id={`healthGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={score >= 70 ? "#06b6d4" : score >= 40 ? "#eab308" : "#ef4444"} />
                <stop offset="100%" stopColor={score >= 70 ? "#22c55e" : score >= 40 ? "#fb923c" : "#f97316"} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-black ${colors.text} animate-countUp`}>
              {animatedScore}
            </span>
            <span className="text-gray-400 text-sm font-medium opacity-70">/ 100</span>
          </div>
        </div>

        {/* Rating Badge */}
        <div className={`mt-5 px-8 py-2.5 rounded-full ${colors.bg} border-2 ${colors.border} ${colors.shadow} transition-all duration-500`}>
          <span className={`font-black text-xl ${colors.text} uppercase tracking-wide`}>{rating}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Diversification</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-24 h-2 bg-dark-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-blue to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${(breakdown.diversification / 30) * 100}%` }}
              />
            </div>
            <span className="text-white font-semibold w-8 text-right">
              {breakdown.diversification}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-24 h-2 bg-dark-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${(breakdown.performance / 30) * 100}%` }}
              />
            </div>
            <span className="text-white font-semibold w-8 text-right">
              {breakdown.performance}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Stability</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-24 h-2 bg-dark-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-1000"
                style={{ width: `${(breakdown.stability / 25) * 100}%` }}
              />
            </div>
            <span className="text-white font-semibold w-8 text-right">
              {breakdown.stability}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Risk Management</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-24 h-2 bg-dark-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-1000"
                style={{ width: `${(breakdown.risk / 15) * 100}%` }}
              />
            </div>
            <span className="text-white font-semibold w-8 text-right">
              {breakdown.risk}
            </span>
          </div>
        </div>
      </div>

      {/* Info Text */}
      <div className="mt-8 pt-5 border-t border-dark-tertiary">
        <p className="text-xs text-gray-400 text-center opacity-70">
          Health score based on diversification, performance, stability, and risk factors
        </p>
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

export default HealthMeter
