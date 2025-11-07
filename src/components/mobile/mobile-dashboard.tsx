'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUpIcon, 
  ClockIcon, 
  CheckSquareIcon,
  FolderIcon,
  AlertCircleIcon,
  PlusIcon,
  RefreshCwIcon
} from 'lucide-react'
import { MobileTaskCard } from './mobile-task-card'

interface DashboardData {
  user: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    avatar?: string
    role: string
  }
  stats: {
    totalTasks: number
    completedTasks: number
    completionRate: number
    totalProjects: number
    activeProjects: number
    thisWeekHours: number
    timeToday: number
  }
  tasks: {
    recent: any[]
    today: any[]
    upcoming: any[]
  }
  projects: {
    active: any[]
  }
  notifications: any[]
  quickActions: any[]
}

interface MobileDashboardProps {
  className?: string
}

export function MobileDashboard({ className }: MobileDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/mobile/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const result = await response.json()
      setData(result.data)
      setError(null)
    } catch (error) {
      console.error('Dashboard error:', error)
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/mobile/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId, status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      // Refresh dashboard data
      await loadDashboardData()
    } catch (error) {
      console.error('Task update error:', error)
      throw error
    }
  }

  const handleTaskClick = (task: any) => {
    // Navigate to task detail
    window.location.href = `/tasks/${task.id}`
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load dashboard
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome back, {data.user.firstName}!
          </h1>
          <p className="text-sm text-gray-600">
            Here's what's happening with your projects
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCwIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.stats.completedTasks}/{data.stats.totalTasks}
              </p>
              <p className="text-xs text-green-600">
                {data.stats.completionRate}% complete
              </p>
            </div>
            <CheckSquareIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Time Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.stats.timeToday.toFixed(1)}h
              </p>
              <p className="text-xs text-blue-600">
                {data.stats.thisWeekHours.toFixed(1)}h this week
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.stats.activeProjects}
              </p>
              <p className="text-xs text-purple-600">
                {data.stats.totalProjects} total
              </p>
            </div>
            <FolderIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.stats.completionRate}%
              </p>
              <p className="text-xs text-orange-600">
                Completion rate
              </p>
            </div>
            <TrendingUpIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {data.quickActions.map((action) => (
            <button
              key={action.id}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              onClick={() => {
                // Handle quick action
                switch (action.id) {
                  case 'create_task':
                    window.location.href = '/tasks/new'
                    break
                  case 'log_time':
                    window.location.href = '/time-tracking'
                    break
                  case 'view_projects':
                    window.location.href = '/projects'
                    break
                  case 'team_chat':
                    window.location.href = '/team'
                    break
                }
              }}
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Tasks */}
      {data.tasks.today.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Today's Tasks</h2>
            <span className="text-sm text-gray-600">
              {data.tasks.today.length} task{data.tasks.today.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-3">
            {data.tasks.today.slice(0, 3).map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task}
                onStatusChange={handleTaskStatusChange}
                onTaskClick={handleTaskClick}
              />
            ))}
            
            {data.tasks.today.length > 3 && (
              <button
                onClick={() => window.location.href = '/tasks?filter=today'}
                className="w-full text-center py-2 text-blue-600 font-medium text-sm"
              >
                View all {data.tasks.today.length} tasks
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      {data.tasks.recent.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
            <button
              onClick={() => window.location.href = '/tasks'}
              className="text-sm text-blue-600 font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {data.tasks.recent.slice(0, 3).map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task}
                onStatusChange={handleTaskStatusChange}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {data.tasks.upcoming.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
            <span className="text-sm text-orange-600">
              {data.tasks.upcoming.length} task{data.tasks.upcoming.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-3">
            {data.tasks.upcoming.slice(0, 3).map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task}
                onStatusChange={handleTaskStatusChange}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Projects */}
      {data.projects.active.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
            <button
              onClick={() => window.location.href = '/projects'}
              className="text-sm text-blue-600 font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {data.projects.active.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                onClick={() => window.location.href = `/projects/${project.id}`}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {project.openTasks} open task{project.openTasks !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8 text-right">
                    {project.progress || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
