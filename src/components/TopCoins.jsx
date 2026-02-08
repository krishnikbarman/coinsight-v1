import React, { useState, useEffect } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import { fetchCurrentPrices } from '../services/cryptoApi'

// Popular coins to display
const POPULAR_COINS = [
  { symbol: 'BTC', coinId: 'bitcoin', name: 'Bitcoin' },
  { symbol: 'ETH', coinId: 'ethereum', name: 'Ethereum' },
  { symbol: 'SOL', coinId: 'solana', name: 'Solana' },
  { symbol: 'ADA', coinId: 'cardano', name: 'Cardano' },
  { symbol: 'BNB', coinId: 'binancecoin', name: 'BNB' }
]

const TopCoins = () => {
  const { currency, supportedCurrencies } = usePortfolio()
  const [coinsData, setCoinsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopCoinsData = async () => {
      try {
        setLoading(true)
        
        // Fetch current prices for all coins
        const pricesData = await fetchCurrentPrices(POPULAR_COINS, currency.toLowerCase())
        
        // Create coins data with prices and mock sparklines for now
        const coinsWithData = POPULAR_COINS.map((coin) => {
          const priceInfo = pricesData[coin.coinId]
          // Generate simple mock sparkline data (7 points)
          const basePrice = priceInfo?.[currency.toLowerCase()] || 0
          const mockSparkline = Array.from({ length: 7 }, (_, i) => {
            const variation = 0.95 + Math.random() * 0.1 // ±5% variation
            return basePrice * variation
          })
          
          return {
            ...coin,
            price: priceInfo?.[currency.toLowerCase()] || 0,
            change24h: priceInfo?.[`${currency.toLowerCase()}_24h_change`] || 0,
            sparkline: mockSparkline,
            logo: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
          }
        })
        
        setCoinsData(coinsWithData)
      } catch (error) {
        console.error('Error fetching top coins:', error)
        // On error, show coins with placeholder data
        const placeholderCoins = POPULAR_COINS.map((coin) => ({
          ...coin,
          price: 0,
          change24h: 0,
          sparkline: Array(7).fill(0),
          logo: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
        }))
        setCoinsData(placeholderCoins)
      } finally {
        setLoading(false)
      }
    }

    fetchTopCoinsData()
  }, [currency])

  // Mini sparkline component
  const MiniSparkline = ({ data, isPositive }) => {
    if (!data || data.length === 0) return null

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return `${x},${y}`
      })
      .join(' ')

    return (
      <svg 
        width="100%" 
        height="32" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="opacity-60"
      >
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#00D4FF' : '#FF0080'}
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <h3 className="text-lg font-bold text-white mb-4">Market Pulse</h3>
        <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 bg-dark-secondary rounded-lg border border-dark-tertiary p-4 animate-pulse"
            >
              <div className="h-6 bg-dark-tertiary rounded w-16 mb-3"></div>
              <div className="h-8 bg-dark-tertiary rounded w-24 mb-2"></div>
              <div className="h-4 bg-dark-tertiary rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <h3 className="text-lg font-bold text-white mb-4">Market Pulse</h3>
      
      {/* Horizontal scrollable container */}
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {coinsData.length > 0 ? (
          coinsData.map((coin) => {
            const isPositive = coin.change24h >= 0
            const currencySymbol = supportedCurrencies[currency]?.symbol || '$'

            return (
              <div
                key={coin.symbol}
                className="flex-shrink-0 w-48 bg-dark-secondary rounded-lg border border-dark-tertiary p-4 hover:border-neon-blue/40 transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/10 group cursor-pointer"
              >
                {/* Header with logo and symbol */}
                <div className="flex items-center space-x-2 mb-3">
                  <img 
                    src={coin.logo} 
                    alt={coin.name}
                    className="w-6 h-6 rounded-full ring-2 ring-neon-blue/20"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = 'https://via.placeholder.com/24'
                    }}
                  />
                  <div>
                    <span className="text-white font-bold text-sm">{coin.symbol}</span>
                    <p className="text-[10px] text-gray-500">{coin.name}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <p className="text-xl font-black text-white tracking-tight">
                    {currencySymbol}{coin.price.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: coin.price > 1 ? 2 : 6 
                    })}
                  </p>
                </div>

                {/* 24h Change */}
                <div className="flex items-center space-x-1 mb-3">
                  <svg 
                    className={`w-3 h-3 ${isPositive ? 'text-neon-green' : 'text-neon-pink rotate-180'}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-sm font-bold ${isPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </span>
                </div>

                {/* Mini Sparkline */}
                <div className="h-8 -mb-2">
                  <MiniSparkline data={coin.sparkline} isPositive={isPositive} />
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-gray-400 text-sm">Loading market data...</p>
        )}
      </div>

      {/* Custom CSS for hiding scrollbar but keeping functionality */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default TopCoins
