'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'

export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'CLIENT' | 'VIEWER'
  avatar?: string
  bio?: string
  skills?: string[]
  hourlyRate?: number
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  stats?: {
    totalProjects: number
    totalTasks: number
    activeTasks: number
    completedTasksThisMonth: number
    totalComments: number
    totalTimeEntries: number
    hoursThisMonth: number
  }
}

export interface UserProfile extends User {
  stats: {
    totalProjects: number
    totalTasks: number
    activeTasks: number
    overdueTasks: number
    completedTasksThisMonth: number
    completedTasksLastMonth: number
    totalComments: number
    totalTimeEntries: number
    hoursThisMonth: number
    hoursLastMonth: number
    taskCompletionRate: number
    hoursChangeRate: number
  }
  recentTasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    project: {
      id: string
      name: string
      status: string
    }
  }>
  ownedProjects: Array<{
    id: string
    name: string
    status: string
    priority: string
    progress: number
  }>
  recentTimeEntries: Array<{
    id: string
    hours: number
    description?: string
    createdAt: string
    task: {
      id: string
      title: string
    }
  }>
}

export interface UsersFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateUserData {
  email: string
  username: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'CLIENT' | 'VIEWER'
  password: string
  avatar?: string
  bio?: string
  skills?: string[]
  hourlyRate?: number
  isActive?: boolean
}

export interface UpdateUserData {
  email?: string
  username?: string
  firstName?: string
  lastName?: string
  role?: 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'CLIENT' | 'VIEWER'
  avatar?: string
  bio?: string
  skills?: string[]
  hourlyRate?: number
  isActive?: boolean
  password?: string
}

// Fetch users with filters
export function useUsers(filters: UsersFilters = {}) {
  return useQuery(
    ['users', filters],
    async () => {
      const params = new URLSearchParams()

      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.role) params.append('role', filters.role)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    }
  )
}

// Fetch single user profile
export function useUser(userId: string) {
  return useQuery(
    ['user', userId],
    async () => {
      const response = await fetch(`/api/users/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      return response.json()
    },
    {
      enabled: !!userId
    }
  )
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation(
    async (data: CreateUserData) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
      }
    }
  )
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation(
    async ({ userId, data }: { userId: string; data: UpdateUserData }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      return response.json()
    },
    {
      onSuccess: (_, { userId }) => {
        queryClient.invalidateQueries(['users'])
        queryClient.invalidateQueries(['user', userId])
      }
    }
  )
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation(
    async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
      }
    }
  )
}

// Fetch team stats
export function useTeamStats() {
  return useQuery(
    ['team-stats'],
    async () => {
      const response = await fetch('/api/team/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch team stats')
      }
      return response.json()
    }
  )
}
