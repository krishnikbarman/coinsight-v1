import React, { useState, useEffect } from 'react'
import { usePortfolio } from '../context/PortfolioContext'
import Modal from './Modal'

const CoinTable = ({ coins, onSort, sortConfig, onCoinClick }) => {
  const { formatCurrency, sellCoin, deleteCoin } = usePortfolio()
  const [sellingCoin, setSellingCoin] = useState(null)
  const [sellForm, setSellForm] = useState({
    quantity: 0,
    price: 0
  })
  const [showActionsMenu, setShowActionsMenu] = useState(null)

  // Close dropdown when clicking anywhere on the document
  useEffect(() => {
    const handleClick = () => setShowActionsMenu(null)
    if (showActionsMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showActionsMenu])

  const handleSell = (e, coin) => {
    e.stopPropagation() // Prevent row click
    setSellingCoin(coin)
    setSellForm({
      quantity: coin.quantity,
      price: coin.currentPrice
    })
    setShowActionsMenu(null)
  }

  const handleConfirmSell = () => {
    if (sellForm.quantity > 0 && sellForm.quantity <= sellingCoin.quantity) {
      sellCoin(sellingCoin.id, sellForm.quantity, sellForm.price)
      setSellingCoin(null)
      setSellForm({ quantity: 0, price: 0 })
    } else {
      alert('Invalid sell quantity')
    }
  }

  const handleDelete = (e, id, name) => {
    e.stopPropagation() // Prevent row click
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteCoin(id)
    }
  }

  const calculatePL = (coin) => {
    const invested = coin.quantity * coin.buyPrice
    const current = coin.quantity * coin.currentPrice
    const pl = current - invested
    const plPercent = invested > 0 ? ((pl / invested) * 100) : 0
    return { pl, plPercent }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-dark-tertiary">
              <th className="text-left py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Coin</th>
              <th className="text-right py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
              <th className="text-right py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Buy Price</th>
              <th className="text-right py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Current Price</th>
              <th className="text-right py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Value</th>
              <th className="text-right py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">P/L</th>
              <th className="text-center py-5 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, index) => {
              const { pl, plPercent } = calculatePL(coin)
              const totalValue = coin.quantity * coin.currentPrice
              const isPositive = pl >= 0

              return (
                <tr 
                  key={coin.id} 
                  className={`border-b border-dark-tertiary/50 transition-all duration-300 hover:bg-neon-blue/5 hover:shadow-lg hover:shadow-neon-blue/5 group ${
                    index % 2 === 0 ? 'bg-dark-primary/20' : 'bg-transparent'
                  }`}
                  style={{ height: '80px' }}
                >
                  <td className="py-5 px-6">
                    <div 
                      className="flex items-center space-x-4 cursor-pointer" 
                      onClick={() => onCoinClick && onCoinClick(coin)}
                      title="Click to view details"
                    >
                      <img 
                        src={coin.image || `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`}
                        alt={coin.name} 
                        className="w-10 h-10 rounded-full ring-2 ring-neon-blue/20 group-hover:ring-neon-blue/50 transition-all duration-300"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://via.placeholder.com/40/1a1b23/4fd1c5?text=${coin.symbol.charAt(0)}`
                        }}
                      />
                      <div>
                        <p className="font-bold text-white text-base hover:text-neon-blue transition-colors">{coin.symbol}</p>
                        <p className="text-sm text-gray-400 opacity-60 hover:opacity-100 transition-opacity">{coin.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right text-white tabular-nums font-medium">{coin.quantity.toLocaleString()}</td>
                  <td className="py-5 px-6 text-right text-white tabular-nums font-medium">{formatCurrency(coin.buyPrice)}</td>
                  <td className="py-5 px-6 text-right text-white tabular-nums font-bold">{formatCurrency(coin.currentPrice)}</td>
                  <td className="py-5 px-6 text-right font-black text-white tabular-nums text-lg">{formatCurrency(totalValue)}</td>
                  <td className="py-5 px-6 text-right">
                    <div className={`flex flex-col items-end ${isPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
                     <div className="flex items-center space-x-1">
                        <svg 
                          className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <p className="font-black text-base tabular-nums">{formatCurrency(Math.abs(pl))}</p>
                      </div>
                      <p className="text-sm font-bold tabular-nums mt-0.5">{isPositive ? '+' : '-'}{Math.abs(plPercent).toFixed(2)}%</p>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center justify-center space-x-3">
                      {/* Sell Button */}
                      <button
                        onClick={(e) => handleSell(e, coin)}
                        className="group/btn relative px-4 py-2 bg-neon-pink/10 text-neon-pink rounded-xl hover:bg-neon-pink/20 hover:shadow-lg hover:shadow-neon-pink/30 transition-all duration-300 hover:scale-105 font-semibold text-sm flex items-center space-x-2"
                        title="Sell Holdings"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Sell</span>
                      </button>
                      
                      {/* More Actions Dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowActionsMenu(showActionsMenu === coin.id ? null : coin.id)
                          }}
                          className="p-2.5 bg-dark-tertiary text-gray-400 rounded-xl hover:bg-dark-tertiary/70 hover:text-white transition-all duration-300 hover:scale-110"
                          title="More Actions"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showActionsMenu === coin.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-dark-secondary border border-dark-tertiary rounded-lg shadow-2xl z-50 overflow-hidden">
                            <button
                              onClick={(e) => {
                                handleDelete(e, coin.id, coin.name)
                                setShowActionsMenu(null)
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete Coin</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Sell Modal */}
      {sellingCoin && (
        <Modal
          isOpen={!!sellingCoin}
          onClose={() => setSellingCoin(null)}
          title={`Sell ${sellingCoin.name}`}
        >
          <div className="space-y-4">
            {/* Current Holdings Info */}
            <div className="bg-dark-tertiary/50 border border-dark-tertiary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Available Balance</span>
                <span className="text-lg font-bold text-white tabular-nums">
                  {sellingCoin.quantity.toLocaleString()} {sellingCoin.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Current Price</span>
                <span className="text-sm font-semibold text-neon-blue tabular-nums">
                  {formatCurrency(sellingCoin.currentPrice)}
                </span>
              </div>
            </div>

            {/* Sell Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Quantity to Sell
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={sellForm.quantity}
                  onChange={(e) => setSellForm({ ...sellForm, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-dark-tertiary border border-dark-tertiary rounded-lg focus:outline-none focus:border-neon-pink text-white pr-20"
                  step="0.00000001"
                  max={sellingCoin.quantity}
                  min="0"
                />
                <button
                  onClick={() => setSellForm({ ...sellForm, quantity: sellingCoin.quantity })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-neon-blue/20 text-neon-blue text-xs font-semibold rounded hover:bg-neon-blue/30 transition-colors"
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Max: {sellingCoin.quantity.toLocaleString()} {sellingCoin.symbol}
              </p>
            </div>

            {/* Sell Price Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Sell Price (per coin)
              </label>
              <input
                type="number"
                value={sellForm.price}
                onChange={(e) => setSellForm({ ...sellForm, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-dark-tertiary border border-dark-tertiary rounded-lg focus:outline-none focus:border-neon-pink text-white"
                step="0.01"
                min="0"
              />
            </div>

            {/* Total Value Display */}
            <div className="bg-neon-pink/10 border border-neon-pink/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Total Sale Value</span>
                <span className="text-xl font-bold text-neon-pink tabular-nums">
                  {formatCurrency((sellForm.quantity || 0) * (sellForm.price || 0))}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleConfirmSell}
                disabled={!sellForm.quantity || sellForm.quantity <= 0 || sellForm.quantity > sellingCoin.quantity}
                className="flex-1 px-6 py-3 bg-neon-pink text-white rounded-lg hover:bg-neon-pink/80 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Sale
              </button>
              <button
                onClick={() => setSellingCoin(null)}
                className="px-6 py-3 bg-dark-tertiary text-gray-400 rounded-lg hover:bg-dark-tertiary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CoinTable
