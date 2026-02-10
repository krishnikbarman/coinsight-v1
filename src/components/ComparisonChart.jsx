import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchMarketComparison, normalizeHistoricalData, mergeHistoricalDatasets } from '../services/historicalApi'
import { getHistoryForRange, normalizeToPercentage } from '../utils/historyUtils'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

const ComparisonChart = () => {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState(30) // 7, 30, or 90 days
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleLines, setVisibleLines] = useState({
    portfolio: true,
    bitcoin: true,
    ethereum: true
  })

  useEffect(() => {
    loadComparisonData()
  }, [timeRange, user])

  const loadComparisonData = async () => {
    if (!user) {
      setChartData([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch BTC and ETH historical data
      const marketData = await fetchMarketComparison(timeRange)

      // Get portfolio historical data
      const portfolioHistory = await getHistoryForRange(timeRange, user.id)

      if (portfolioHistory.length === 0) {
        setError('Not enough portfolio history. Buy coins and check back later.')
        setChartData([])
        setLoading(false)
        return
      }

      // Normalize all datasets to percentage (base 100)
      const normalizedPortfolio = normalizeToPercentage(portfolioHistory)
      const normalizedBTC = normalizeHistoricalData(marketData.bitcoin)
      const normalizedETH = normalizeHistoricalData(marketData.ethereum)

      // Create datasets object
      const datasets = {
        portfolio: normalizedPortfolio,
        bitcoin: normalizedBTC,
        ethereum: normalizedETH
      }

      // Merge datasets by date
      const merged = mergeHistoricalDatasets(datasets)

      setChartData(merged)
    } catch (err) {
      console.error('Error loading comparison data:', err)
      setError('Failed to load comparison data')
    } finally {
      setLoading(false)
    }
  }

  const toggleLine = (line) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: !prev[line]
    }))
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-secondary border-2 border-neon-blue/40 rounded-xl p-4 shadow-2xl shadow-neon-blue/20 animate-fadeIn">
          <p className="text-gray-400 text-sm mb-3 font-semibold">{label}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-white text-sm font-medium capitalize">
                    {entry.name}
                  </span>
                </div>
                <span className="text-white font-bold">
                  {entry.value.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const timeRanges = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 }
  ]

  return (
    <div className="relative bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">Performance Comparison</h3>
          <p className="text-sm text-gray-400 opacity-70">Portfolio vs Bitcoin vs Ethereum (Normalized to 100%)</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                timeRange === range.value
                  ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/30'
                  : 'bg-dark-tertiary text-gray-400 hover:bg-dark-tertiary/70 hover:scale-105'
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={loadComparisonData}
            disabled={loading}
            className="p-2.5 bg-dark-tertiary hover:bg-dark-tertiary/70 rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-105"
            title="Refresh data"
          >
            <svg
              className={`w-5 h-5 text-neon-blue ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full" style={{ height: '400px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader text="Loading comparison data..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-dark-tertiary rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-400">{error}</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" opacity={0.12} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#00d4ff', strokeWidth: 1, opacity: 0.3 }} />
              <Legend
                onClick={(e) => toggleLine(e.value)}
                wrapperStyle={{ cursor: 'pointer', paddingTop: '20px' }}
                formatter={(value) => (
                  <span className="capitalize text-white font-semibold">
                    {value}
                  </span>
                )}
              />
              {visibleLines.portfolio && (
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  name="portfolio"
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                />
              )}
              {visibleLines.bitcoin && (
                <Line
                  type="monotone"
                  dataKey="bitcoin"
                  stroke="#f7931a"
                  strokeWidth={2.5}
                  dot={false}
                  name="bitcoin"
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                />
              )}
              {visibleLines.ethereum && (
                <Line
                  type="monotone"
                  dataKey="ethereum"
                  stroke="#627eea"
                  strokeWidth={2.5}
                  dot={false}
                  name="ethereum"
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend Info */}
      {!loading && !error && chartData.length > 0 && (
        <div className="mt-8 pt-5 border-t border-dark-tertiary">
          <p className="text-xs text-gray-400 text-center opacity-70">
            Click on legend items to toggle visibility • All values normalized to 100% at start date
          </p>
        </div>
      )}
    </div>
  )
}

export default ComparisonChart
