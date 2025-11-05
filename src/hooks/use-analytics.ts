'use client'

import { useQuery } from 'react-query'
import { useAuth } from '@/contexts/auth-context'

interface AnalyticsFilters {
  dateRange: {
    from: Date
    to: Date
  }
  projectIds?: string[]
  userIds?: string[]
}

interface AnalyticsData {
  overview: {
    totalProjects: number
    completedTasks: number
    totalHours: number
    budgetUtilization: number
  }
  projectProgress: Array<{
    name: string
    progress: number
    tasksCompleted: number
    totalTasks: number
    budget: number
    spent: number
  }>
  taskStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  teamPerformance: Array<{
    name: string
    tasksCompleted: number
    hoursLogged: number
    efficiency: number
    avatar?: string
  }>
  timeTracking: Array<{
    date: string
    hours: number
    project: string
    user: string
  }>
  budgetAnalysis: Array<{
    project: string
    budget: number
    spent: number
    remaining: number
    utilization: number
  }>
  projects: Array<{
    id: string
    name: string
  }>
  teamMembers: Array<{
    id: string
    firstName: string
    lastName: string
  }>
}

export function useAnalytics(filters: AnalyticsFilters) {
  const { token, isAuthenticated } = useAuth()

  return useQuery<AnalyticsData>(
    ['analytics', filters],
    async () => {
      if (!token) throw new Error('No token available')

      const params = new URLSearchParams()
      params.append('from', filters.dateRange.from.toISOString())
      params.append('to', filters.dateRange.to.toISOString())

      if (filters.projectIds?.length) {
        filters.projectIds.forEach(id => params.append('projectIds', id))
      }

      if (filters.userIds?.length) {
        filters.userIds.forEach(id => params.append('userIds', id))
      }

      const response = await fetch(`/api/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

// Hook for project-specific analytics
export function useProjectAnalytics(projectId: string, dateRange: { from: Date; to: Date }) {
  const { token, isAuthenticated } = useAuth()

  return useQuery(
    ['project-analytics', projectId, dateRange],
    async () => {
      if (!token) throw new Error('No token available')

      const params = new URLSearchParams()
      params.append('from', dateRange.from.toISOString())
      params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/projects/${projectId}/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project analytics')
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token && !!projectId,
      staleTime: 5 * 60 * 1000,
    }
  )
}

// Hook for team analytics
export function useTeamAnalytics(dateRange: { from: Date; to: Date }) {
  const { token, isAuthenticated } = useAuth()

  return useQuery(
    ['team-analytics', dateRange],
    async () => {
      if (!token) throw new Error('No token available')

      const params = new URLSearchParams()
      params.append('from', dateRange.from.toISOString())
      params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/team/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch team analytics')
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token,
      staleTime: 5 * 60 * 1000,
    }
  )
}

// Hook for time tracking analytics
export function useTimeTrackingAnalytics(filters: {
  dateRange: { from: Date; to: Date }
  userId?: string
  projectId?: string
}) {
  const { token, isAuthenticated } = useAuth()

  return useQuery(
    ['time-tracking-analytics', filters],
    async () => {
      if (!token) throw new Error('No token available')

      const params = new URLSearchParams()
      params.append('from', filters.dateRange.from.toISOString())
      params.append('to', filters.dateRange.to.toISOString())

      if (filters.userId) params.append('userId', filters.userId)
      if (filters.projectId) params.append('projectId', filters.projectId)

      const response = await fetch(`/api/time-tracking/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch time tracking analytics')
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token,
      staleTime: 5 * 60 * 1000,
    }
  )
}

// Hook for budget analytics
export function useBudgetAnalytics(dateRange: { from: Date; to: Date }) {
  const { token, isAuthenticated } = useAuth()

  return useQuery(
    ['budget-analytics', dateRange],
    async () => {
      if (!token) throw new Error('No token available')

      const params = new URLSearchParams()
      params.append('from', dateRange.from.toISOString())
      params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/budget/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch budget analytics')
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token,
      staleTime: 5 * 60 * 1000,
    }
  )
}
