import React from 'react'

const StatCard = ({ title, value, subtitle, icon, trend, trendValue, color = 'blue', loading = false }) => {
  const colorClasses = {
    blue: 'from-neon-blue/20 to-neon-blue/5 border-neon-blue/30 text-neon-blue',
    purple: 'from-neon-purple/20 to-neon-purple/5 border-neon-purple/30 text-neon-purple',
    green: 'from-neon-green/20 to-neon-green/5 border-neon-green/30 text-neon-green',
    pink: 'from-neon-pink/20 to-neon-pink/5 border-neon-pink/30 text-neon-pink',
  }

  const trendColors = {
    up: 'text-neon-green',
    down: 'text-neon-pink',
    neutral: 'text-gray-400'
  }

  return (
    <div className={`
      relative overflow-hidden rounded-[20px] border-2
      bg-gradient-to-br ${colorClasses[color]}
      p-6 sm:p-8 lg:p-10 transition-all duration-500
      hover:scale-[1.02] hover:shadow-2xl hover:shadow-${color}/30
      animate-fadeIn group min-h-[180px]
    `}>
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${color === 'blue' ? 'rgba(0,212,255,0.1)' : color === 'green' ? 'rgba(0,255,136,0.1)' : color === 'pink' ? 'rgba(255,46,151,0.1)' : 'rgba(181,55,255,0.1)'} 100%)`,
        }}
      />
      
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
        <div className="text-9xl">{icon}</div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {loading && (
          <div className="absolute top-0 right-0">
            <svg className="w-5 h-5 text-neon-blue animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-2.5 uppercase tracking-wide font-medium opacity-60">{title}</p>
            <h3 
              className={`
                text-2xl sm:text-3xl lg:text-4xl 
                font-extrabold text-white 
                leading-none tracking-tighter
                break-words
                transition-all duration-300
                ${loading ? 'opacity-50' : ''} 
                animate-countUp
              `}
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto'
              }}
            >
              {value}
            </h3>
          </div>
          <div className={`text-3xl sm:text-4xl opacity-40 group-hover:opacity-60 transition-opacity duration-300 flex-shrink-0`}>
            {icon}
          </div>
        </div>

        <div className="space-y-2">
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-400 opacity-60 leading-tight">{subtitle}</p>
          )}

          {trend && trendValue && (
            <div className={`flex items-center space-x-1.5 text-xs sm:text-sm font-bold ${trendColors[trend]}`}>
              {trend === 'up' && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm sm:text-base tracking-tight">{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatCard
