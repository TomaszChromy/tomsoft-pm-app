'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Users, Calendar, BarChart3 } from 'lucide-react'
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

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'destructive' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

interface VelocityData {
  sprintId: string
  sprintName: string
  projectName: string
  startDate: string
  endDate: string
  duration: number
  completedStoryPoints: number
  totalTasks: number
  velocity: number
  teamContributions: TeamContribution[]
}

interface TeamContribution {
  id: string
  name: string
  storyPoints: number
  tasksCompleted: number
}

interface TeamPerformance {
  id: string
  name: string
  totalStoryPoints: number
  totalTasks: number
  sprintsParticipated: number
  averageVelocity: number
}

interface Statistics {
  totalStoryPoints: number
  totalSprints: number
  averageVelocity: number
  trend: 'improving' | 'declining' | 'stable'
  lastSprintVelocity: number
  periodMonths: number
}

interface PredictedCapacity {
  nextSprint: number
  next2Weeks: number
  nextMonth: number
}

interface Project {
  id: string
  name: string
}

export default function VelocityPage() {
  const [velocityData, setVelocityData] = useState<VelocityData[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([])
  const [predictedCapacity, setPredictedCapacity] = useState<PredictedCapacity | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('6')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchVelocityData()
  }, [selectedProject, selectedPeriod])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchVelocityData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const params = new URLSearchParams()
      if (selectedProject) params.append('projectId', selectedProject)
      params.append('period', selectedPeriod)
      
      const response = await fetch(`/api/analytics/velocity?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setVelocityData(data.velocityData || [])
        setStatistics(data.statistics)
        setTeamPerformance(data.teamPerformance || [])
        setPredictedCapacity(data.predictedCapacity)
      }
    } catch (error) {
      console.error('Error fetching velocity data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <Badge variant="success">Poprawa</Badge>
      case 'declining':
        return <Badge variant="destructive">Spadek</Badge>
      case 'stable':
        return <Badge variant="default">Stabilny</Badge>
      default:
        return <Badge>{trend}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Prepare chart data
  const chartData = velocityData.map(sprint => ({
    name: sprint.sprintName,
    velocity: sprint.velocity,
    storyPoints: sprint.completedStoryPoints,
    tasks: sprint.totalTasks,
    period: `${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}`
  }))

  // Team performance chart data
  const teamChartData = teamPerformance
    .sort((a, b) => b.averageVelocity - a.averageVelocity)
    .slice(0, 10) // Top 10 performers
    .map(member => ({
      name: member.name.split(' ').map(n => n.charAt(0)).join(''), // Initials
      fullName: member.name,
      velocity: member.averageVelocity,
      storyPoints: member.totalStoryPoints,
      sprints: member.sprintsParticipated
    }))

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Ładowanie danych velocity...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Velocity Tracking</h1>
        <p className="text-gray-600 mt-2">Analiza wydajności zespołu i prognozowanie</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projekt
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="">Wszystkie projekty</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Okres
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="3">Ostatnie 3 miesiące</option>
                <option value="6">Ostatnie 6 miesięcy</option>
                <option value="12">Ostatni rok</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent>
              <div className="flex items-center">
                <Target className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Średnia Velocity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.averageVelocity} SP/dzień
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Ostatni Sprint</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.lastSprintVelocity} SP/dzień
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Sprinty</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.totalSprints}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center">
                {statistics.trend === 'improving' ? (
                  <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                ) : statistics.trend === 'declining' ? (
                  <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
                ) : (
                  <Target className="w-8 h-8 text-gray-600 mr-3" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Trend</p>
                  <div className="mt-1">
                    {getTrendBadge(statistics.trend)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Velocity Chart */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-xl font-semibold">Velocity w czasie</h2>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Story Points / dzień', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    labelFormatter={(value, payload) => {
                      const item = payload?.[0]?.payload
                      return item ? `${item.name} (${item.period})` : value
                    }}
                    formatter={(value: number, name: string) => [
                      value?.toFixed(2) || 0,
                      name === 'velocity' ? 'Velocity' : name
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="velocity" 
                    stroke="#2563EB" 
                    strokeWidth={2}
                    name="Velocity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Brak danych velocity do wyświetlenia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Performance and Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Performance */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Wydajność zespołu</h2>
          </CardHeader>
          <CardContent>
            {teamChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        name === 'velocity' ? `${value.toFixed(2)} SP/sprint` : value,
                        name === 'velocity' ? 'Średnia velocity' : name
                      ]}
                      labelFormatter={(value, payload) => {
                        const item = payload?.[0]?.payload
                        return item ? item.fullName : value
                      }}
                    />
                    <Bar dataKey="velocity" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Brak danych zespołu</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Predictions */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Prognoza wydajności</h2>
          </CardHeader>
          <CardContent>
            {predictedCapacity ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Następny sprint</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {predictedCapacity.nextSprint.toFixed(1)} SP/dzień
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Następne 2 tygodnie</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {predictedCapacity.next2Weeks.toFixed(1)} SP/dzień
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Następny miesiąc</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {predictedCapacity.nextMonth.toFixed(1)} SP/dzień
                  </p>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Uwaga:</strong> Prognozy oparte są na ostatniej velocity zespołu. 
                    Rzeczywista wydajność może się różnić w zależności od złożoności zadań i dostępności zespołu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Brak danych do prognozy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
