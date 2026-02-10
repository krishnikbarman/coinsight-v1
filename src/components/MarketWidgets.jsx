// Mock market data
const marketData = {
  fearGreedIndex: {
    value: 68,
    label: 'Greed',
    description: 'Market sentiment is positive',
    color: 'neon-green'
  },
  btcDominance: {
    value: 52.3,
    label: 'BTC Dominance',
    description: 'Bitcoin market share',
    color: 'neon-blue'
  },
  globalMarketCap: {
    value: 2.1,
    label: 'Market Cap',
    description: '$2.1T total value',
    color: 'neon-purple'
  },
  volume24h: {
    value: 89.5,
    label: '24h Volume',
    description: '$89.5B traded',
    color: 'neon-pink'
  }
}

const MarketWidgets = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Fear & Greed Index */}
      <div className="bg-dark-secondary rounded-lg border border-dark-tertiary p-4 hover:border-neon-green/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">Fear & Greed</h3>
          <span className="text-xl">😊</span>
        </div>
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-3xl font-bold text-neon-green">
            {marketData.fearGreedIndex.value}
          </span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
        <div className="w-full bg-dark-tertiary rounded-full h-2 mb-2">
          <div 
            className="bg-neon-green h-2 rounded-full transition-all duration-500"
            style={{ width: `${marketData.fearGreedIndex.value}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{marketData.fearGreedIndex.description}</p>
      </div>

      {/* BTC Dominance */}
      <div className="bg-dark-secondary rounded-lg border border-dark-tertiary p-4 hover:border-neon-blue/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">BTC Dominance</h3>
          <span className="text-xl">₿</span>
        </div>
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-3xl font-bold text-neon-blue">
            {marketData.btcDominance.value}
          </span>
          <span className="text-sm text-gray-400">%</span>
        </div>
        <div className="w-full bg-dark-tertiary rounded-full h-2 mb-2">
          <div 
            className="bg-neon-blue h-2 rounded-full transition-all duration-500"
            style={{ width: `${marketData.btcDominance.value}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{marketData.btcDominance.description}</p>
      </div>

      {/* Global Market Cap */}
      <div className="bg-dark-secondary rounded-lg border border-dark-tertiary p-4 hover:border-neon-purple/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">Global Market</h3>
          <span className="text-xl">🌍</span>
        </div>
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-3xl font-bold text-neon-purple">
            ${marketData.globalMarketCap.value}T
          </span>
        </div>
        <div className="flex items-center space-x-1 text-sm mb-2">
          <svg className="w-4 h-4 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-neon-green">+2.4%</span>
        </div>
        <p className="text-xs text-gray-500">{marketData.globalMarketCap.description}</p>
      </div>

      {/* 24h Volume */}
      <div className="bg-dark-secondary rounded-lg border border-dark-tertiary p-4 hover:border-neon-pink/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-400">24h Volume</h3>
          <span className="text-xl">📊</span>
        </div>
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-3xl font-bold text-neon-pink">
            ${marketData.volume24h.value}B
          </span>
        </div>
        <div className="flex items-center space-x-1 text-sm mb-2">
          <svg className="w-4 h-4 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-neon-green">+5.1%</span>
        </div>
        <p className="text-xs text-gray-500">{marketData.volume24h.description}</p>
      </div>
    </div>
  )
}

export default MarketWidgets
