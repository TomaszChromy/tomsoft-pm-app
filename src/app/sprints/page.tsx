'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Users, TrendingUp, Clock, Target } from 'lucide-react'

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
  className = '',
  disabled = false 
}: { 
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  disabled?: boolean
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  
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
      disabled={disabled}
    >
      {children}
    </button>
  )
}

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

interface Sprint {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  startDate: string
  endDate: string
  totalStoryPoints: number
  completedStoryPoints: number
  totalTasks: number
  completedTasks: number
  progress: number
  project: {
    id: string
    name: string
  }
}

interface Project {
  id: string
  name: string
}

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
    fetchSprints()
  }, [selectedProject, selectedStatus])

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

  const fetchSprints = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const params = new URLSearchParams()
      if (selectedProject) params.append('projectId', selectedProject)
      if (selectedStatus) params.append('status', selectedStatus)
      
      const response = await fetch(`/api/sprints?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSprints(data.sprints || [])
      }
    } catch (error) {
      console.error('Error fetching sprints:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return <Badge variant="default">Planowanie</Badge>
      case 'ACTIVE':
        return <Badge variant="warning">Aktywny</Badge>
      case 'COMPLETED':
        return <Badge variant="success">Zakończony</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Anulowany</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL')
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Ładowanie sprintów...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sprinty</h1>
          <p className="text-gray-600 mt-2">Zarządzaj sprintami i śledź postępy</p>
        </div>
        <Button onClick={() => router.push('/sprints/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nowy Sprint
        </Button>
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
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="">Wszystkie statusy</option>
                <option value="PLANNING">Planowanie</option>
                <option value="ACTIVE">Aktywny</option>
                <option value="COMPLETED">Zakończony</option>
                <option value="CANCELLED">Anulowany</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprints Grid */}
      {sprints.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Brak sprintów</h3>
              <p className="text-gray-600 mb-4">Rozpocznij od utworzenia pierwszego sprintu</p>
              <Button onClick={() => router.push('/sprints/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Utwórz Sprint
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map(sprint => {
            const daysRemaining = getDaysRemaining(sprint.endDate)
            
            return (
              <Card key={sprint.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{sprint.name}</h3>
                      <p className="text-sm text-gray-600">{sprint.project.name}</p>
                    </div>
                    {getStatusBadge(sprint.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Postęp</span>
                        <span>{sprint.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${sprint.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{sprint.completedStoryPoints}/{sprint.totalStoryPoints} SP</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span>{sprint.completedTasks}/{sprint.totalTasks} zadań</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</span>
                      </div>
                      {sprint.status === 'ACTIVE' && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>
                            {daysRemaining > 0 
                              ? `${daysRemaining} dni pozostało`
                              : daysRemaining === 0 
                                ? 'Ostatni dzień'
                                : `Przekroczono o ${Math.abs(daysRemaining)} dni`
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/sprints/${sprint.id}`)}
                        className="flex-1"
                      >
                        Szczegóły
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/sprints/${sprint.id}/burndown`)}
                        className="flex-1"
                      >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Burndown
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
