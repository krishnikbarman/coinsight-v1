import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import EmptyState from '../components/EmptyState'

const COLORS = ['#00d4ff', '#b537ff', '#ff2e97', '#00ff88', '#ffd700', '#ff6b35']
const OTHERS_COLOR = '#6b7280' // Neutral gray for "Others"

const PortfolioPieChart = ({ coins }) => {
  // Handle empty state
  if (!coins || coins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400 text-sm">No portfolio data available</p>
          <p className="text-gray-500 text-xs mt-1">Buy coins to see distribution</p>
        </div>
      </div>
    )
  }

  // Calculate coin values and sort by value descending
  const coinsWithValues = coins.map(coin => ({
    name: coin.symbol,
    value: coin.quantity * coin.currentPrice,
    fullName: coin.name
  })).sort((a, b) => b.value - a.value)

  // Prepare chart data: top 3 coins + "Others" if needed
  let data = []
  if (coinsWithValues.length <= 3) {
    // Show all coins if 3 or fewer
    data = coinsWithValues
  } else {
    // Show top 3 and group the rest into "Others"
    const top3 = coinsWithValues.slice(0, 3)
    const remaining = coinsWithValues.slice(3)
    const othersValue = remaining.reduce((sum, coin) => sum + coin.value, 0)
    const othersCount = remaining.length
    
    data = [
      ...top3,
      {
        name: 'Others',
        value: othersValue,
        fullName: `Others (${othersCount} coins)`,
        isOthers: true
      }
    ]
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-secondary border-2 border-neon-blue/40 rounded-xl p-4 shadow-2xl shadow-neon-blue/20 animate-fadeIn">
          <p className="text-white font-bold text-sm mb-2">{payload[0].payload.fullName}</p>
          <p className="text-neon-blue font-semibold text-xs mb-1">{payload[0].name}</p>
          <p className="text-white font-bold text-base">
            ${payload[0].value.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            {((payload[0].value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}% of portfolio
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isOthers ? OTHERS_COLOR : COLORS[index % COLORS.length]}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value, entry) => (
              <span className="text-white text-sm">{entry.payload.fullName}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PortfolioPieChart
