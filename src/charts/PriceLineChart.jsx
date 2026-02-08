import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getHistoryForRange } from '../utils/historyUtils'

const PriceLineChart = ({ coins }) => {
  // Get portfolio history for last 30 days
  const history = getHistoryForRange(30)

  // Handle empty state
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📈</div>
          <p className="text-gray-400 text-sm">No portfolio history available</p>
          <p className="text-gray-500 text-xs mt-1">History builds up as you track your portfolio daily</p>
        </div>
      </div>
    )
  }

  // Transform data for chart
  const data = history.map(snapshot => ({
    date: new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: snapshot.value,
    fullDate: snapshot.date
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-secondary border-2 border-neon-blue/40 rounded-xl p-4 shadow-2xl shadow-neon-blue/20 animate-fadeIn">
          <p className="text-white font-bold mb-2 text-sm">{label}</p>
          <div className="flex items-center justify-between space-x-4 text-sm">
            <span className="text-gray-400">Portfolio Value:</span>
            <span className="text-neon-blue font-bold">
              ${payload[0].value.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2640" opacity={0.12} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '11px', fontWeight: '500' }}
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '11px', fontWeight: '500' }}
            tick={{ fill: '#9ca3af' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#00d4ff', strokeWidth: 1, opacity: 0.3 }} />
          <Line
            type="monotone"
            dataKey="value"
            name="Portfolio Value"
            stroke="#00d4ff"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 7, fill: '#00d4ff', strokeWidth: 2, stroke: '#fff' }}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PriceLineChart
