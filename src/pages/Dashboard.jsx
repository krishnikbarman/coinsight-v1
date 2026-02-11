import { usePortfolio } from '../context/PortfolioContext'
import StatCard from '../components/StatCard'
import PortfolioPieChart from '../charts/PortfolioPieChart'
import PriceLineChart from '../charts/PriceLineChart'
import Loader from '../components/Loader'
import WelcomeScreen from '../components/WelcomeScreen'
import ActivityTimeline from '../components/ActivityTimeline'
import PerformerCard from '../components/PerformerCard'
import DiversificationCard from '../components/DiversificationCard'
import HealthMeter from '../components/HealthMeter'
import InsightCard from '../components/InsightCard'
import ComparisonChart from '../components/ComparisonChart'
import SnapshotCard from '../components/SnapshotCard'

// Feature Flags - Control visibility of dashboard sections
const FEATURE_HISTORY_ANALYTICS = false // Historical Performance section staged for v1.2

const Dashboard = () => {
  const { 
    coins, 
    formatCurrency, 
    loading, 
    priceLoading
  } = usePortfolio()
  const metrics = usePortfolio().calculateMetrics()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="large" text="Loading dashboard..." />
      </div>
    )
  }

  if (coins.length === 0) {
    return <WelcomeScreen />
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      {coins.length > 0 && (
        <div className="mb-2">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Dashboard</h1>
          <p className="text-base text-gray-400 opacity-70">Overview of your crypto portfolio</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Portfolio Value"
          value={formatCurrency(metrics.totalValue || 0)}
          icon="💰"
          color="blue"
          subtitle={`Invested: ${formatCurrency(metrics.totalInvested || 0)}`}
          loading={priceLoading}
        />
        
        <StatCard
          title="Total Profit/Loss"
          value={formatCurrency(Math.abs(metrics.totalProfitLoss || 0))}
          icon={(metrics.totalProfitLoss || 0) >= 0 ? "📈" : "📉"}
          color={(metrics.totalProfitLoss || 0) >= 0 ? "green" : "pink"}
          trend={(metrics.totalProfitLoss || 0) >= 0 ? "up" : "down"}
          trendValue={`${(metrics.totalProfitLoss || 0) >= 0 ? '+' : '-'}${Math.abs(metrics.profitLossPercentage || 0).toFixed(2)}%`}
          loading={priceLoading}
        />
        
        <StatCard
          title="Best Performer"
          value={metrics.bestCoin ? metrics.bestCoin.symbol : 'N/A'}
          subtitle={metrics.bestCoin ? metrics.bestCoin.name : 'No data'}
          icon="🏆"
          color="green"
          trend={metrics.bestCoin ? "up" : undefined}
          trendValue={metrics.bestCoin ? `+${metrics.bestCoin.profitLossPercentage.toFixed(2)}%` : undefined}
          loading={priceLoading}
        />
        
        <StatCard
          title="Worst Performer"
          value={metrics.worstCoin ? metrics.worstCoin.symbol : 'N/A'}
          subtitle={metrics.worstCoin ? metrics.worstCoin.name : 'No data'}
          icon="📉"
          color="pink"
          trend={metrics.worstCoin ? "down" : undefined}
          trendValue={metrics.worstCoin ? `${metrics.worstCoin.profitLossPercentage.toFixed(2)}%` : undefined}
          loading={priceLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Portfolio Distribution</h2>
            <p className="text-sm text-gray-400 opacity-70">Asset allocation by value</p>
          </div>
          <div className="h-80">
            <PortfolioPieChart coins={coins} />
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Portfolio Value (30 Days)</h2>
            <p className="text-sm text-gray-400 opacity-70">Total portfolio performance</p>
          </div>
          <div className="h-80">
            <PriceLineChart coins={coins} />
          </div>
        </div>
      </div>

      {/* Portfolio Analytics Section */}
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Portfolio Analytics</h2>
          <p className="text-base text-gray-400 opacity-70">Advanced insights and analysis powered by rule-based calculations</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equal height cards with minimum height */}
          <div className="lg:col-span-1 flex">
            <div className="flex-1 min-h-[500px]">
              <PerformerCard />
            </div>
          </div>
          <div className="lg:col-span-1 flex">
            <div className="flex-1 min-h-[500px]">
              <DiversificationCard />
            </div>
          </div>
          <div className="lg:col-span-1 flex">
            <div className="flex-1 min-h-[500px]">
              <HealthMeter />
            </div>
          </div>
        </div>
        
        {/* Insights below - full width */}
        <div className="mt-8">
          <InsightCard />
        </div>
      </div>

      {/* Historical Performance Section - Feature Staged for Future Release */}
      {FEATURE_HISTORY_ANALYTICS && (
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Historical Performance</h2>
            <p className="text-base text-gray-400 opacity-70">Compare your portfolio performance against market leaders</p>
          </div>
          
          {/* Comparison Chart */}
          <div className="mb-8">
            <ComparisonChart />
          </div>
          
          {/* Historical Snapshots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SnapshotCard daysAgo={7} title="7 Days Ago" icon="📅" />
            <SnapshotCard daysAgo={30} title="30 Days Ago" icon="📆" />
          </div>
        </div>
      )}

      {/* Activity Timeline - Temporarily Hidden for Cleaner Analytics Focus */}
      {/* <div className="bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 animate-fadeIn">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Recent Activity</h2>
          <p className="text-sm text-gray-400 opacity-70">Your latest portfolio actions</p>
        </div>
        <ActivityTimeline limit={5} />
      </div> */}

      {/* Portfolio Summary Table - Temporarily Hidden for Cleaner Analytics Focus 
      <div className="bg-dark-secondary rounded-[20px] border-2 border-dark-tertiary p-8 hover:border-neon-blue/40 transition-all duration-500 hover:shadow-xl hover:shadow-neon-blue/10 animate-fadeIn">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Quick Overview</h2>
          <p className="text-sm text-gray-400 opacity-70">Top holdings summary</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          Top coins display here
        </div>
      </div> */}
    </div>
  )
}

export default Dashboard
