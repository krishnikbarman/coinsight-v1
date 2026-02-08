import React from 'react'
import { usePortfolio } from '../context/PortfolioContext'

const TransactionHistory = () => {
  const { transactions, currency, supportedCurrencies } = usePortfolio()

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatCurrency = (amount) => {
    const symbol = supportedCurrencies[currency]?.symbol || '$'
    return `${symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatQuantity = (quantity) => {
    return quantity.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    })
  }

  return (
    <div className="flex flex-col h-full p-6">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Transaction History
        </h1>
        <p className="text-gray-400">Track all your portfolio activities</p>
      </div>

      {/* Scrollable Transaction List */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth transaction-history-scrollbar"
        style={{
          maxHeight: '65vh',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(96, 165, 250, 0.6) transparent'
        }}
      >
        {transactions.length === 0 ? (
          <div className="bg-dark-secondary border border-dark-tertiary rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Transactions Yet</h3>
            <p className="text-gray-500">Your transaction history will appear here once you start adding coins to your portfolio.</p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-3">
            {transactions.map((transaction, index) => (
              <div key={transaction.id}>
                <div className="bg-dark-secondary border border-dark-tertiary rounded-xl p-4 hover:bg-dark-tertiary/30 hover:border-neon-blue/30 hover:shadow-[0_0_15px_rgba(79,209,197,0.1)] transition-all duration-200">
                  {/* Transaction Card Content */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Left: Coin Info & Action */}
                    <div className="flex items-center space-x-4">
                      {/* Coin */}
                      <div className="flex items-center space-x-3">
                        <img
                          src={`https://assets.coincap.io/assets/icons/${transaction.symbol.toLowerCase()}@2x.png`}
                          alt={transaction.symbol}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = 'https://via.placeholder.com/40/1a1b23/4fd1c5?text=' + transaction.symbol[0]
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-white font-semibold text-base">
                            {transaction.symbol}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {transaction.name}
                          </span>
                        </div>
                      </div>

                      {/* Action Badge */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.action === 'BUY' 
                          ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                          : 'bg-neon-pink/10 text-neon-pink border border-neon-pink/30'
                      }`}>
                        {transaction.action}
                      </span>
                    </div>

                    {/* Right: Transaction Details */}
                    <div className="flex items-center space-x-6 ml-auto">
                      {/* Quantity */}
                      <div className="text-right hidden sm:block">
                        <p className="text-gray-400 text-xs mb-1">Quantity</p>
                        <p className="text-white font-mono font-medium text-sm">
                          {formatQuantity(transaction.quantity)}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right hidden md:block">
                        <p className="text-gray-400 text-xs mb-1">Price</p>
                        <p className="text-white font-mono font-medium text-sm">
                          {formatCurrency(transaction.price)}
                        </p>
                      </div>

                      {/* Total */}
                      <div className="text-right">
                        <p className="text-gray-400 text-xs mb-1">Total</p>
                        <p className="text-neon-blue font-mono font-bold text-base">
                          {formatCurrency(transaction.total)}
                        </p>
                      </div>

                      {/* Date & Time */}
                      <div className="text-right hidden lg:block">
                        <p className="text-white font-medium text-sm">
                          {formatDate(transaction.timestamp)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {formatTime(transaction.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Additional Details */}
                  <div className="mt-3 pt-3 border-t border-dark-tertiary/50 flex justify-between text-sm sm:hidden">
                    <div>
                      <span className="text-gray-400">Qty: </span>
                      <span className="text-white font-mono">{formatQuantity(transaction.quantity)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">@ </span>
                      <span className="text-white font-mono">{formatCurrency(transaction.price)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">{formatDate(transaction.timestamp)}</span>
                    </div>
                  </div>
                </div>
                {/* Subtle divider between cards */}
                {index < transactions.length - 1 && (
                  <div className="h-px bg-white/5 my-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Summary Footer (outside scroll) */}
      {transactions.length > 0 && (
        <div className="flex-shrink-0 mt-4 bg-dark-secondary border border-dark-tertiary rounded-xl p-6">
          {/* Total Transactions Header */}
          <div className="mb-5">
            <p className="text-gray-400 text-sm mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06] mb-5"></div>

          {/* Buy vs Sell Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Buy */}
            <div className="bg-neon-green/5 border border-neon-green/20 rounded-lg p-4 hover:bg-neon-green/10 transition-colors">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-neon-green/20 border border-neon-green/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">Total Buy</p>
              </div>
              <p className="text-2xl font-bold text-neon-green">
                {formatCurrency(
                  transactions
                    .filter(tx => tx.action === 'BUY')
                    .reduce((sum, tx) => sum + tx.total, 0)
                )}
              </p>
            </div>

            {/* Total Sell */}
            <div className="bg-neon-pink/5 border border-neon-pink/20 rounded-lg p-4 hover:bg-neon-pink/10 transition-colors">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-neon-pink/20 border border-neon-pink/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-neon-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">Total Sell</p>
              </div>
              <p className="text-2xl font-bold text-neon-pink">
                {formatCurrency(
                  transactions
                    .filter(tx => tx.action === 'SELL')
                    .reduce((sum, tx) => sum + tx.total, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
