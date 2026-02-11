import React, { useState, useEffect, useCallback, useRef } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import {
  getGlobalMarketData,
  getFearGreedIndex,
  getTopCoins,
  searchCoin,
  getCoinDetails,
} from '../services/marketService'
import CoinDetailsModal from '../components/CoinDetailsModal'
import Loader from '../components/Loader'
import SkeletonLoader from '../components/SkeletonLoader'

const Market = () => {
  const { currency, supportedCurrencies, formatCurrency } = usePortfolio()

  // State management
  const [globalData, setGlobalData] = useState(null)
  const [fearGreed, setFearGreed] = useState(null)
  const [topCoins, setTopCoins] = useState([])
  
  // Modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCoinId, setSelectedCoinId] = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchTimeoutRef = useRef(null)
  const searchInputRef = useRef(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [topCoinsLoading, setTopCoinsLoading] = useState(true)

  // Error states - changed to warning banner instead of blocking error
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')

  // Fetch global market data and Fear & Greed Index
  const fetchGlobalData = useCallback(async () => {
    try {
      const [global, fg] = await Promise.all([
        getGlobalMarketData(currency.toLowerCase()),
        getFearGreedIndex(),
      ])
      setGlobalData(global)
      setFearGreed(fg)
      
      // Check if data is from demo mode or has errors
      if (global.isDemo || fg.isDemo) {
        setShowWarning(true)
        setWarningMessage('📡 APIs unavailable - Demo Mode active. Showing sample market data.')
      } else {
        setShowWarning(false)
        setWarningMessage('')
      }
    } catch (err) {
      console.error('Error fetching global data:', err)
      setShowWarning(true)
      setWarningMessage('Unable to load market data. Retrying...')
    } finally {
      setLoading(false)
    }
  }, [currency])

  // Fetch top 10 coins with 60-second cache
  const fetchTopCoins = useCallback(async () => {
    try {
      setTopCoinsLoading(true)
      const coins = await getTopCoins(10, currency.toLowerCase())
      setTopCoins(coins)
      
      // Show info if demo data
      if (coins.length > 0 && coins[0].isDemo) {
        setShowWarning(true)
        setWarningMessage('📡 APIs unavailable - Demo Mode active. Showing sample market data.')
      }
    } catch (err) {
      console.error('Error fetching top coins:', err)
      setTopCoins([])
    } finally {
      setTopCoinsLoading(false)
    }
  }, [currency])

  // Handle search with 300ms debounce
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim().length < 2) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    setSearchLoading(true)
    setShowSearchDropdown(true)

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCoin(query)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }

  // Open coin details modal
  const handleViewDetails = (coinId) => {
    setSelectedCoinId(coinId)
    setShowDetailsModal(true)
  }

  // Handle search result click
  const handleSearchResultClick = (coinId) => {
    setShowSearchDropdown(false)
    setSearchQuery('')
    setSearchResults([])
    handleViewDetails(coinId)
  }
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchGlobalData()
    fetchTopCoins()
  }, [fetchGlobalData, fetchTopCoins])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGlobalData()
      fetchTopCoins()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [fetchGlobalData, fetchTopCoins])

  // Get Fear & Greed color and emoji
  const getFearGreedColor = (value) => {
    if (value <= 25) return { color: 'text-red-500', bg: 'bg-red-500', emoji: '😱' }
    if (value <= 45) return { color: 'text-orange-500', bg: 'bg-orange-500', emoji: '😰' }
    if (value <= 55) return { color: 'text-yellow-500', bg: 'bg-yellow-500', emoji: '😐' }
    if (value <= 75) return { color: 'text-neon-green', bg: 'bg-neon-green', emoji: '😊' }
    return { color: 'text-green-600', bg: 'bg-green-600', emoji: '🤑' }
  }

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    return formatCurrency(num)
  }

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
        height="40"
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
      <div className="flex items-center justify-center h-full">
        <Loader size="large" text="Loading market data..." />
      </div>
    )
  }

  const fgStyle = fearGreed ? getFearGreedColor(fearGreed.value) : null

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Warning/Info Banner - Shows when API has issues or demo mode is active */}
      {showWarning && (
        <div className={`${
          warningMessage.includes('Demo Mode') 
            ? 'bg-blue-900/20 border-blue-500/50' 
            : 'bg-yellow-900/20 border-yellow-500/50'
        } border rounded-lg p-4 flex items-start space-x-3 animate-fadeIn`}>
          <div className={`${
            warningMessage.includes('Demo Mode') ? 'text-blue-400' : 'text-yellow-500'
          } text-xl flex-shrink-0`}>
            {warningMessage.includes('Demo Mode') ? '🎮' : '⚠️'}
          </div>
          <div className="flex-1">
            <h3 className={`${
              warningMessage.includes('Demo Mode') ? 'text-blue-400' : 'text-yellow-500'
            } font-semibold mb-1`}>
              {warningMessage.includes('Demo Mode') ? 'Demo Mode' : 'Data Unavailable'}
            </h3>
            <p className={`${
              warningMessage.includes('Demo Mode') ? 'text-blue-200/80' : 'text-yellow-200/80'
            } text-sm`}>
              {warningMessage}
            </p>
          </div>
          <button
            onClick={() => {
              setShowWarning(false)
              fetchGlobalData()
              fetchTopCoins()
            }}
            className={`${
              warningMessage.includes('Demo Mode') 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-yellow-500 hover:text-yellow-400'
            } transition-colors text-sm font-medium`}
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Market</h1>
        <p className="text-base text-gray-400 opacity-70">Real-time cryptocurrency market data</p>
      </div>

      {/* Crypto Search Bar */}
      <div className="relative" ref={searchInputRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search cryptocurrencies by name or symbol..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-12 pr-4 py-4 bg-dark-secondary border-2 border-dark-tertiary rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue/50 transition-all"
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon-blue"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-dark-secondary border-2 border-dark-tertiary rounded-xl shadow-2xl max-h-80 overflow-y-auto">
            {searchLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <SkeletonLoader key={i} height="h-16" />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-gray-400 text-sm">
                  {searchQuery.trim().length < 2
                    ? 'Type at least 2 characters to search'
                    : 'No cryptocurrencies found'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {searchResults.map((coin) => (
                  <button
                    key={coin.id}
                    onClick={() => handleSearchResultClick(coin.id)}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-dark-tertiary transition-colors text-left"
                  >
                    <img
                      src={coin.thumb || coin.large}
                      alt={coin.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{coin.name}</h3>
                      <p className="text-xs text-gray-400">{coin.symbol}</p>
                    </div>
                    {coin.marketCapRank && (
                      <span className="text-xs text-gray-500">#{coin.marketCapRank}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Market Overview - Top Cards */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Global Market Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Fear & Greed Index */}
          <div className="bg-dark-secondary rounded-xl border-2 border-dark-tertiary p-6 hover:border-neon-green/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-green/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">Fear & Greed Index</h3>
              <span className="text-2xl">{fgStyle?.emoji}</span>
            </div>
            {fearGreed ? (
              <>
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className={`text-4xl font-bold ${fgStyle?.color}`}>
                    {fearGreed.value}
                  </span>
                  <span className="text-sm text-gray-400">/100</span>
                </div>
                <div className="w-full bg-dark-tertiary rounded-full h-2 mb-2">
                  <div
                    className={`${fgStyle?.bg} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${fearGreed.value}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{fearGreed.valueClassification}</p>
              </>
            ) : (
              <SkeletonLoader height="h-20" />
            )}
          </div>

          {/* BTC Dominance */}
          <div className="bg-dark-secondary rounded-xl border-2 border-dark-tertiary p-6 hover:border-neon-blue/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-blue/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">BTC Dominance</h3>
              <span className="text-2xl">₿</span>
            </div>
            {globalData ? (
              <>
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-4xl font-bold text-neon-blue">
                    {globalData.btcDominance.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">%</span>
                </div>
                <div className="w-full bg-dark-tertiary rounded-full h-2 mb-2">
                  <div
                    className="bg-neon-blue h-2 rounded-full transition-all duration-500"
                    style={{ width: `${globalData.btcDominance}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">Bitcoin market share</p>
              </>
            ) : (
              <SkeletonLoader height="h-20" />
            )}
          </div>

          {/* Global Market Cap */}
          <div className="bg-dark-secondary rounded-xl border-2 border-dark-tertiary p-6 hover:border-neon-purple/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-purple/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">Global Market Cap</h3>
              <span className="text-2xl">🌍</span>
            </div>
            {globalData ? (
              <>
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-4xl font-bold text-neon-purple">
                    {formatNumber(globalData.totalMarketCap)}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-sm mb-2">
                  <svg
                    className={`w-4 h-4 ${
                      globalData.marketCapChange24h >= 0 ? 'text-neon-green' : 'text-neon-pink'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {globalData.marketCapChange24h >= 0 ? (
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  <span
                    className={
                      globalData.marketCapChange24h >= 0 ? 'text-neon-green' : 'text-neon-pink'
                    }
                  >
                    {Math.abs(globalData.marketCapChange24h).toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">Total crypto value</p>
              </>
            ) : (
              <SkeletonLoader height="h-20" />
            )}
          </div>

          {/* 24h Volume */}
          <div className="bg-dark-secondary rounded-xl border-2 border-dark-tertiary p-6 hover:border-neon-pink/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-pink/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400">24h Volume</h3>
              <span className="text-2xl">📊</span>
            </div>
            {globalData ? (
              <>
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-4xl font-bold text-neon-pink">
                    {formatNumber(globalData.totalVolume)}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-sm mb-2">
                  <div className="w-4 h-4 bg-neon-pink/20 rounded-full" />
                  <span className="text-gray-400">Trading volume</span>
                </div>
                <p className="text-xs text-gray-500">Total 24h trading</p>
              </>
            ) : (
              <SkeletonLoader height="h-20" />
            )}
          </div>
        </div>
      </div>

      {/* Market Pulse - Top Coins */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Market Pulse</h2>
          <span className="text-sm text-gray-400">Top 10 by Market Cap</span>
        </div>
        <div className="bg-dark-secondary rounded-xl border-2 border-dark-tertiary p-6 hover:border-neon-blue/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-blue/10">
          {topCoinsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <SkeletonLoader key={i} height="h-16" />
              ))}
            </div>
          ) : topCoins.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Coins Available</h3>
              <p className="text-gray-500 mb-4">Unable to load top coins at this time.</p>
              <button
                onClick={fetchTopCoins}
                className="px-4 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/20 transition-all"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topCoins.map((coin) => (
                <div
                  key={coin.id}
                  className="flex items-center space-x-4 p-4 bg-dark-tertiary rounded-lg hover:bg-dark-tertiary/70 transition-all cursor-pointer"
                  onClick={() => handleViewDetails(coin.id)}
                >
                  {/* Logo */}
                  <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" />

                  {/* Name & Symbol */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{coin.name}</h3>
                    <p className="text-xs text-gray-400">{coin.symbol}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatCurrency(coin.currentPrice)}</p>
                    <div
                      className={`flex items-center space-x-1 text-xs ${
                        coin.priceChangePercentage24h >= 0 ? 'text-neon-green' : 'text-neon-pink'
                      }`}
                    >
                      <span>{coin.priceChangePercentage24h >= 0 ? '▲' : '▼'}</span>
                      <span>{Math.abs(coin.priceChangePercentage24h).toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Mini Sparkline */}
                  <div className="w-24 h-10 hidden lg:block">
                    <MiniSparkline
                      data={coin.sparkline}
                      isPositive={coin.priceChangePercentage24h >= 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coin Details Modal */}
      <CoinDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedCoinId(null)
        }}
        coinId={selectedCoinId}
      />
    </div>
  )
}

export default Market
