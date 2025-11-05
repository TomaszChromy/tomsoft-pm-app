'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingDown, TrendingUp, Target, Calendar, Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Temporary inline components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 border-b border-gray-200">
    {children}
  </div>
)

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4">
    {children}
  </div>
)

const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'default',
  className = '' 
}: { 
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50',
    ghost: 'hover:bg-gray-100'
  }
  
  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8'
  }
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface BurndownData {
  date: string
  day: number
  remaining: number
  completed?: number
}

interface TaskBreakdown {
  todo: number
  inProgress: number
  review: number
  done: number
  cancelled: number
}

interface SprintMetrics {
  totalStoryPoints: number
  completedStoryPoints: number
  remainingStoryPoints: number
  totalDays: number
  daysElapsed: number
  daysRemaining: number
  averageVelocity: number
  predictedCompletionDay: number | null
  predictedCompletionDate: string | null
  isOnTrack: boolean
  progress: number
}

interface Sprint {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  project: {
    id: string
    name: string
  }
}

interface BurndownResponse {
  sprint: Sprint
  burndownData: BurndownData[]
  idealBurndownData: BurndownData[]
  metrics: SprintMetrics
  taskBreakdown: TaskBreakdown
}

export default function BurndownPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<BurndownResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchBurndownData()
  }, [params.id])

  const fetchBurndownData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/sprints/${params.id}/burndown`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const burndownData = await response.json()
        setData(burndownData)
      } else {
        setError('Nie udało się pobrać danych burndown')
      }
    } catch (error) {
      console.error('Error fetching burndown data:', error)
      setError('Błąd podczas pobierania danych')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTooltipDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Ładowanie danych burndown...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error || 'Nie znaleziono danych'}</div>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>
        </div>
      </div>
    )
  }

  const { sprint, burndownData, idealBurndownData, metrics, taskBreakdown } = data

  // Combine data for chart
  const chartData = idealBurndownData.map(ideal => {
    const actual = burndownData.find(b => b.date === ideal.date)
    return {
      date: ideal.date,
      day: ideal.day,
      ideal: ideal.remaining,
      actual: actual?.remaining,
      formattedDate: formatDate(ideal.date)
    }
  })

  // Task breakdown chart data
  const taskChartData = [
    { name: 'Do zrobienia', value: taskBreakdown.todo, color: '#6B7280' },
    { name: 'W trakcie', value: taskBreakdown.inProgress, color: '#F59E0B' },
    { name: 'Do przeglądu', value: taskBreakdown.review, color: '#8B5CF6' },
    { name: 'Zakończone', value: taskBreakdown.done, color: '#10B981' },
    { name: 'Anulowane', value: taskBreakdown.cancelled, color: '#EF4444' },
  ].filter(item => item.value > 0)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrót
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Burndown Chart</h1>
          <p className="text-gray-600">{sprint.name} - {sprint.project.name}</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Story Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.completedStoryPoints}/{metrics.totalStoryPoints}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Dni</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.daysElapsed}/{metrics.totalDays}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              {metrics.isOnTrack ? (
                <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-600">Velocity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.averageVelocity} SP/dzień
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Postęp</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Burndown Chart */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-xl font-semibold">Wykres Burndown</h2>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  labelFormatter={(value, payload) => {
                    const item = payload?.[0]?.payload
                    return item ? `Dzień ${item.day} (${formatTooltipDate(item.date)})` : value
                  }}
                  formatter={(value: number, name: string) => [
                    value?.toFixed(1) || 0,
                    name === 'ideal' ? 'Idealny' : 'Rzeczywisty'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ideal" 
                  stroke="#6B7280" 
                  strokeDasharray="5 5"
                  name="Idealny"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  name="Rzeczywisty"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Task Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Podział zadań</h2>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Prognoza</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Status sprintu</p>
                <p className={`text-lg font-semibold ${metrics.isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.isOnTrack ? 'Na dobrej drodze' : 'Opóźnienie'}
                </p>
              </div>
              
              {metrics.predictedCompletionDate && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Przewidywane zakończenie</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(metrics.predictedCompletionDate).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-600">Pozostało story points</p>
                <p className="text-lg font-semibold text-gray-900">
                  {metrics.remainingStoryPoints}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Pozostało dni</p>
                <p className="text-lg font-semibold text-gray-900">
                  {metrics.daysRemaining}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
