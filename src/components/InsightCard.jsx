import React, { useState } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { calculatePortfolioHealth, generateSmartInsights } from '../utils/analytics'

const InsightCard = () => {
  const { coins, priceLoading } = usePortfolio()
  const [activeInsight, setActiveInsight] = useState(0)

  // Get icon and styling based on insight type
  const getInsightStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-green-500/5',
          borderColor: 'border-green-500/30',
          titleColor: 'text-green-400',
          iconBg: 'bg-green-500/20',
          iconColor: 'text-green-400',
          label: 'Strength'
        }
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-yellow-500/5',
          borderColor: 'border-yellow-500/30',
          titleColor: 'text-yellow-400',
          iconBg: 'bg-yellow-500/20',
          iconColor: 'text-yellow-400',
          label: 'Warning'
        }
      case 'info':
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          ),
          bgColor: 'bg-blue-500/5',
          borderColor: 'border-blue-500/30',
          titleColor: 'text-neon-blue',
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-neon-blue',
          label: 'Suggestion'
        }
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          ),
          bgColor: 'bg-purple-500/5',
          borderColor: 'border-purple-500/30',
          titleColor: 'text-purple-400',
          iconBg: 'bg-purple-500/20',
          iconColor: 'text-purple-400',
          label: 'Insight'
        }
    }
  }

  if (coins.length === 0) {
    return (
      <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6">
        <h3 className="text-xl font-bold text-white mb-4">Smart Insights</h3>
        <p className="text-gray-400 text-center py-8">Buy coins to see personalized insights</p>
      </div>
    )
  }

  const healthData = calculatePortfolioHealth(coins)
  const allInsights = generateSmartInsights(coins, healthData)
  // Limit to max 3 insights for cleaner UI
  const insights = allInsights.slice(0, 3)

  // Handle empty insights
  if (insights.length === 0) {
    return (
      <div className="relative bg-dark-secondary rounded-xl border border-dark-tertiary p-6 hover:border-neon-blue/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Smart Insights</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💡</span>
          </div>
        </div>
        <p className="text-gray-400 text-center py-8">Analyzing your portfolio...</p>
      </div>
    )
  }

  const currentInsight = insights[activeInsight] || insights[0]
  const style = getInsightStyle(currentInsight.type)

  return (
    <div className="relative bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 group animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Smart Insights</h3>
          <p className="text-sm text-gray-400 opacity-70">AI-powered recommendations</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-3xl opacity-50 group-hover:opacity-70 transition-opacity">💡</span>
          {insights.length > 1 && (
            <span className="text-xs text-gray-400 bg-dark-tertiary px-3 py-1.5 rounded-full font-semibold">
              {activeInsight + 1}/{insights.length}
            </span>
          )}
        </div>
      </div>

      {/* Main Insight Card */}
      <div 
        className={`${style.bgColor} ${style.borderColor} border-2 rounded-xl p-6 mb-6 transition-all duration-500 hover:shadow-lg`}
        style={{
          animation: 'fadeIn 0.5s ease-in'
        }}
      >
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`${style.iconBg} ${style.iconColor} w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0`}>
            {style.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className={`text-[10px] uppercase tracking-wider font-bold ${style.titleColor} opacity-70`}>
                {style.label}
              </span>
            </div>
            <h4 className={`font-bold text-lg ${style.titleColor} mb-3`}>
              {currentInsight.title}
            </h4>
            <p className="text-white text-sm leading-relaxed opacity-90">
              {currentInsight.message}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      {insights.length > 1 && (
        <div className="flex items-center justify-center space-x-2.5 mb-6">
          {insights.map((insight, index) => {
            const dotStyle = getInsightStyle(insight.type)
            return (
              <button
                key={index}
                onClick={() => setActiveInsight(index)}
                className={`transition-all duration-300 ${
                  index === activeInsight
                    ? 'w-10 h-2.5 rounded-full'
                    : 'w-2.5 h-2.5 rounded-full hover:scale-125'
                } ${
                  index === activeInsight
                    ? dotStyle.titleColor.replace('text-', 'bg-')
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`View insight ${index + 1}`}
              />
            )
          })}
        </div>
      )}

      {/* Additional Insights Preview */}
      {insights.length > 1 && (
        <div className="space-y-2.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4 font-semibold opacity-70">All Insights</p>
          {insights.map((insight, index) => {
            const previewStyle = getInsightStyle(insight.type)
            return (
              <button
                key={index}
                onClick={() => setActiveInsight(index)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                  index === activeInsight
                    ? `${previewStyle.bgColor} ${previewStyle.borderColor} border-2`
                    : 'bg-dark-tertiary hover:bg-dark-tertiary/70 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${previewStyle.iconBg} ${previewStyle.iconColor} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {previewStyle.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${
                      index === activeInsight ? previewStyle.titleColor : 'text-gray-300'
                    }`}>
                      {insight.title}
                    </p>
                    <p className="text-xs text-gray-400 opacity-70 mt-0.5">{previewStyle.label}</p>
                  </div>
                  {index === activeInsight && (
                    <svg className="w-5 h-5 text-neon-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-5 border-t border-dark-tertiary">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 opacity-70">
            Rule-based insights, real-time updates
          </p>
          <p className="text-[10px] text-gray-500 opacity-70">
            Last Updated: Now
          </p>
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

export default InsightCard
