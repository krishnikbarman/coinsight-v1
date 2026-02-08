import React from 'react'
import { useNavigate } from 'react-router-dom'

const WelcomeScreen = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Animated Icon */}
        <div className="text-9xl mb-8 animate-bounce">
          📊
        </div>

        {/* Welcome Text */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontWeight: 700, letterSpacing: '0.3px' }}>
          CoinSight
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          See Beyond Your Crypto Numbers
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
          <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6 hover:border-neon-blue/30 transition-colors">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Tracking</h3>
            <p className="text-sm text-gray-400">
              Monitor your portfolio value and performance with live price updates
            </p>
          </div>

          <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6 hover:border-neon-purple/30 transition-colors">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-lg font-semibold text-white mb-2">Visual Analytics</h3>
            <p className="text-sm text-gray-400">
              Understand your portfolio distribution with interactive charts and graphs
            </p>
          </div>

          <div className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6 hover:border-neon-pink/30 transition-colors">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Performance Insights</h3>
            <p className="text-sm text-gray-400">
              Track profit/loss, best performers, and make informed decisions
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/portfolio')}
          className="group inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl font-semibold text-lg transition-all duration-200 ease-out hover:scale-[1.03]"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            backgroundSize: '200% 100%',
            backgroundPosition: 'left center',
            transition: 'all 200ms ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(120, 80, 255, 0.35), 0 4px 20px rgba(0, 0, 0, 0.4)'
            e.currentTarget.style.backgroundPosition = 'right center'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
            e.currentTarget.style.backgroundPosition = 'left center'
          }}
        >
          <span>Get Started</span>
          <svg 
            className="w-6 h-6 group-hover:translate-x-[2px] transition-transform duration-200 ease-out" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
