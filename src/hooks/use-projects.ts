import { useQuery } from 'react-query'
import { useAuth } from '@/contexts/auth-context'

interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate?: string
  endDate?: string
  budget?: number
  progress: number
  ownerId: string
  clientId?: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  client?: {
    id: string
    name: string
  }
  totalTasks: number
  completedTasks: number
  progressPercentage: number
}

export interface ProjectsFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  priority?: string
  clientId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface ProjectsResponse {
  projects: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useProjects(filters: ProjectsFilters = {}) {
  const { token, isAuthenticated } = useAuth()

  return useQuery<ProjectsResponse>(
    ['projects', filters],
    async () => {
      if (!token) throw new Error('No token available')

      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token,
    }
  )
}
