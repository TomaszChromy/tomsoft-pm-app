'use client'

import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import { TrendingUp, BarChart3, PieChart, Activity, Download, Calendar } from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
)

// Temporary UI components
const Card = ({ children, className }: any) => (
  <div className={`border rounded-lg shadow-sm bg-white ${className}`}>{children}</div>
)

const CardHeader = ({ children }: any) => (
  <div className="p-6 border-b">{children}</div>
)

const CardTitle = ({ children, className }: any) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

const CardContent = ({ children, className }: any) => (
  <div className={`p-6 ${className}`}>{children}</div>
)

const Button = ({ children, onClick, disabled, className, variant, size }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${size === 'sm' ? 'px-3 py-1.5 text-sm' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
)

interface EnhancedChartsProps {
  className?: string
}

export function EnhancedCharts({ className }: EnhancedChartsProps) {
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')

  const fetchChartData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/analytics/enhanced-charts?timeRange=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const data = await response.json()
      setChartData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChartData()
  }, [selectedTimeRange])

  const exportChart = (chartType: string) => {
    // Implementation for exporting charts to PDF/Excel
    console.log(`Exporting ${chartType} chart...`)
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchChartData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mock data for demonstration (will be replaced with real API data)
  const projectVelocityData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Tasks Completed',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Story Points',
        data: [28, 45, 35, 58, 52, 68],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ]
  }

  const budgetAnalysisData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Planned Budget',
        data: [50000, 55000, 60000, 65000, 70000, 75000],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Actual Spending',
        data: [48000, 52000, 58000, 62000, 68000, 72000],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Forecasted',
        data: [49000, 54000, 59000, 64000, 69000, 74000],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
      }
    ]
  }

  const teamPerformanceData = {
    labels: ['Frontend', 'Backend', 'Design', 'QA', 'DevOps'],
    datasets: [{
      label: 'Performance Score',
      data: [85, 92, 78, 88, 90],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  }

  const riskAssessmentData = {
    labels: ['Budget Risk', 'Timeline Risk', 'Quality Risk', 'Resource Risk', 'Technical Risk'],
    datasets: [{
      label: 'Current Risk Level',
      data: [3, 7, 4, 6, 5],
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: 'rgba(239, 68, 68, 1)',
      pointBackgroundColor: 'rgba(239, 68, 68, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(239, 68, 68, 1)',
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 10
      }
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <Button onClick={() => exportChart('all')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Project Velocity Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Project Velocity
              </CardTitle>
              <Button onClick={() => exportChart('velocity')} variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={projectVelocityData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Budget Analysis Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Budget Analysis
              </CardTitle>
              <Button onClick={() => exportChart('budget')} variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={budgetAnalysisData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Team Performance
              </CardTitle>
              <Button onClick={() => exportChart('team')} variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut data={teamPerformanceData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-500" />
                Risk Assessment
              </CardTitle>
              <Button onClick={() => exportChart('risk')} variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Radar data={riskAssessmentData} options={radarOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
