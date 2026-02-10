import React, { useState, useEffect } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import CoinTable from '../components/CoinTable'
import EmptyState from '../components/EmptyState'
import AddCoinModal from '../components/AddCoinModal'
import Loader from '../components/Loader'

// Feature flags
const ENABLE_EXPORT_BUTTONS = false // Set to true to re-enable PDF, CSV, Share buttons

const Portfolio = () => {
  const { coins, formatCurrency, loading } = usePortfolio()
  const metrics = usePortfolio().calculateMetrics()

  // Buy Coin Modal state
  const [showAddCoin, setShowAddCoin] = useState(false)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'gainers', 'losers'
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  // Filter and sort coins
  const filteredCoins = coins.filter(coin => {
    // Search filter
    const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false

    // Type filter
    if (filterType === 'gainers') {
      const pl = (coin.quantity * coin.currentPrice) - (coin.quantity * coin.buyPrice)
      return pl > 0
    } else if (filterType === 'losers') {
      const pl = (coin.quantity * coin.currentPrice) - (coin.quantity * coin.buyPrice)
      return pl < 0
    }
    
    return true
  })

  // Sort coins by total value (descending) first, then apply user sort
  const sortedCoins = [...filteredCoins].sort((a, b) => {
    let aValue, bValue

    switch (sortConfig.key) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'value':
        aValue = a.quantity * a.currentPrice
        bValue = b.quantity * b.currentPrice
        break
      case 'profit':
        aValue = (a.quantity * a.currentPrice) - (a.quantity * a.buyPrice)
        bValue = (b.quantity * b.currentPrice) - (b.quantity * b.buyPrice)
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })
  
  // Pagination calculations
  const totalPages = Math.ceil(sortedCoins.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCoins = sortedCoins.slice(startIndex, endIndex)
  
  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setCurrentPage(1) // Reset to first page on sort
  }
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  // Show loading spinner while fetching data from Supabase
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fadeIn">
        <Loader size="large" text="Loading your portfolio from Supabase..." />
      </div>
    )
  }

  return (
    <div className="space-y-8 relative animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Portfolio</h1>
          <p className="text-base text-gray-400 opacity-70">Manage your cryptocurrency holdings</p>
        </div>
        <button
          onClick={() => setShowAddCoin(true)}
          className="group inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl hover:shadow-xl hover:shadow-neon-blue/50 transition-all duration-300 font-bold hover:scale-105"
          title="Buy Cryptocurrency"
        >
          <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Buy Coin</span>
        </button>
      </div>

      {/* Summary Cards */}
      {coins.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 group">
            <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-semibold opacity-70">Total Holdings</p>
            <p className="text-4xl font-black text-white mb-2 tracking-tight">{coins.length}</p>
            <p className="text-sm text-neon-blue font-semibold">Cryptocurrencies</p>
          </div>
          
          <div className="bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-purple/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-purple/10 group">
            <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-semibold opacity-70">Total Value</p>
            <p className="text-4xl font-black text-white mb-2 tracking-tight tabular-nums">{formatCurrency(metrics.totalValue || 0)}</p>
            <p className="text-sm text-gray-400 font-medium opacity-70">
              Invested: <span className="tabular-nums">{formatCurrency(metrics.totalInvested || 0)}</span>
            </p>
          </div>
          
          <div className="bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-green/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-green/10 group">
            <p className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-semibold opacity-70">Total P/L</p>
            <p className={`text-4xl font-black mb-2 tracking-tight tabular-nums ${(metrics.totalProfitLoss || 0) >= 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
              {formatCurrency(Math.abs(metrics.totalProfitLoss || 0))}
            </p>
            <p className={`text-sm font-bold tabular-nums ${(metrics.totalProfitLoss || 0) >= 0 ? 'text-neon-green' : 'text-neon-pink'}`}>
              {(metrics.totalProfitLoss || 0) >= 0 ? '+' : '-'}
              {Math.abs(metrics.profitLossPercentage || 0).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Portfolio Table */}
      <div className="bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary overflow-hidden hover:border-neon-blue/30 transition-all duration-500">
        <div className="p-8 border-b border-dark-tertiary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Your Holdings</h2>
              <p className="text-sm text-gray-400 mt-1.5 opacity-70">All your cryptocurrency positions</p>
            </div>
            {/* Export Buttons - temporarily hidden via feature flag */}
            {ENABLE_EXPORT_BUTTONS && (
              <div className="flex items-center space-x-3">
                <button
                  className="group relative px-4 py-2.5 bg-dark-tertiary rounded-xl hover:bg-neon-purple/10 hover:border-neon-purple/30 border-2 border-transparent transition-all duration-300 text-sm font-semibold text-gray-400 hover:text-white hover:scale-105"
                  title="Export as PDF"
                >
                  📄 PDF
                </button>
                <button
                  className="group relative px-4 py-2.5 bg-dark-tertiary rounded-xl hover:bg-neon-green/10 hover:border-neon-green/30 border-2 border-transparent transition-all duration-300 text-sm font-semibold text-gray-400 hover:text-white hover:scale-105"
                  title="Export as CSV"
                >
                  📊 CSV
                </button>
                <button
                  className="group relative px-4 py-2.5 bg-dark-tertiary rounded-xl hover:bg-neon-blue/10 hover:border-neon-blue/30 border-2 border-transparent transition-all duration-300 text-sm font-semibold text-gray-400 hover:text-white hover:scale-105"
                  title="Share Snapshot"
                >
                  📸 Share
                </button>
              </div>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search coins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-dark-tertiary border-2 border-dark-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue text-white text-sm shadow-inner transition-all duration-300"
                style={{ boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setFilterType('all')}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  filterType === 'all'
                    ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/30 scale-105'
                    : 'bg-dark-tertiary text-gray-400 hover:bg-dark-tertiary/70 hover:text-white hover:scale-105'
                }`}
              >
                All ({coins.length})
              </button>
              <button
                onClick={() => setFilterType('gainers')}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  filterType === 'gainers'
                    ? 'bg-neon-green text-white shadow-lg shadow-neon-green/30 scale-105'
                    : 'bg-dark-tertiary text-gray-400 hover:bg-dark-tertiary/70 hover:text-white hover:scale-105'
                }`}
              >
                📈 Gainers
              </button>
              <button
                onClick={() => setFilterType('losers')}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  filterType === 'losers'
                    ? 'bg-neon-pink text-white shadow-lg shadow-neon-pink/30 scale-105'
                    : 'bg-dark-tertiary text-gray-400 hover:bg-dark-tertiary/70 hover:text-white hover:scale-105'
                }`}
              >
                📉 Losers
              </button>
            </div>
          </div>

          {/* Results Count */}
          {searchQuery && (
            <p className="text-sm text-gray-400 mt-3">
              Found {filteredCoins.length} result{filteredCoins.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>
        
        {sortedCoins.length > 0 ? (
          <>
            <CoinTable coins={paginatedCoins} onSort={handleSort} sortConfig={sortConfig} />
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-dark-tertiary bg-dark-tertiary/20">
                <div className="flex items-center justify-center">
                  {/* Pagination Buttons */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="group flex items-center space-x-2 px-4 py-2 bg-dark-tertiary rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neon-blue/10 hover:border-neon-blue/40 hover:shadow-[0_0_15px_rgba(79,209,197,0.3)] border border-transparent disabled:hover:bg-dark-tertiary disabled:hover:border-transparent disabled:hover:shadow-none"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Prev</span>
                    </button>
                    
                    {/* Page Indicator */}
                    <div className="px-4 py-2 bg-dark-secondary border border-neon-blue/30 rounded-lg">
                      <span className="text-sm font-bold text-white">
                        Page <span className="text-neon-blue">{currentPage}</span> / {totalPages}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="group flex items-center space-x-2 px-4 py-2 bg-dark-tertiary rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neon-blue/10 hover:border-neon-blue/40 hover:shadow-[0_0_15px_rgba(79,209,197,0.3)] border border-transparent disabled:hover:bg-dark-tertiary disabled:hover:border-transparent disabled:hover:shadow-none"
                    >
                      <span>Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : coins.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon="📊"
              title="No coins yet"
              description="Start building your portfolio by purchasing your first cryptocurrency"
              actionLabel="Buy First Coin"
              onAction={() => setShowAddCoin(true)}
            />
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p className="text-gray-400">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Buy Coin Modal */}
      <AddCoinModal isOpen={showAddCoin} onClose={() => setShowAddCoin(false)} />
    </div>
  )
}

export default Portfolio
