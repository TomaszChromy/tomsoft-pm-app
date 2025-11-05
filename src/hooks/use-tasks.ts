import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '@/contexts/auth-context'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  position: number
  estimatedHours?: number
  dueDate?: string
  createdAt: string
  updatedAt: string
  projectId: string
  assigneeId?: string
  createdById: string
  parentTaskId?: string
  tags?: string[]
  assignee?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  project: {
    id: string
    name: string
    status: string
  }
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  subtasks?: Task[]
  _count: {
    comments: number
    attachments: number
    timeEntries: number
  }
}

export interface TasksResponse {
  tasks: Task[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CreateTaskData {
  title: string
  description?: string
  projectId: string
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assigneeId?: string
  dueDate?: string
  estimatedHours?: number
  parentTaskId?: string
  tags?: string[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assigneeId?: string
  dueDate?: string
  estimatedHours?: number
  position?: number
  tags?: string[]
}

export interface TaskFilters {
  projectId?: string
  status?: string
  priority?: string
  assigneeId?: string
  clientId?: string
  search?: string
  page?: number
  limit?: number
}

export function useTasks(filters: TaskFilters = {}) {
  const { token, isAuthenticated } = useAuth()

  return useQuery<TasksResponse>(
    ['tasks', filters],
    async () => {
      if (!token) throw new Error('No token available')

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/tasks?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token,
    }
  )
}

export function useTask(taskId: string) {
  const { token, isAuthenticated } = useAuth()

  return useQuery<Task>(
    ['task', taskId],
    async () => {
      if (!token) throw new Error('No token available')

      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Task not found')
        }
        if (response.status === 403) {
          throw new Error('Access denied')
        }
        throw new Error('Failed to fetch task')
      }

      return response.json()
    },
    {
      enabled: isAuthenticated && !!token && !!taskId,
    }
  )
}

export function useCreateTask() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation(
    async (data: CreateTaskData) => {
      if (!token) throw new Error('No token available')

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      return response.json()
    },
    {
      onSuccess: (newTask) => {
        // Invalidate tasks queries
        queryClient.invalidateQueries(['tasks'])

        // Update specific project tasks if projectId is available
        if (newTask.projectId) {
          queryClient.invalidateQueries(['tasks', { projectId: newTask.projectId }])
        }
      },
    }
  )
}

export function useUpdateTask() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation(
    async ({ taskId, data }: { taskId: string; data: UpdateTaskData }) => {
      if (!token) throw new Error('No token available')

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }

      return response.json()
    },
    {
      onSuccess: (updatedTask) => {
        // Invalidate tasks queries
        queryClient.invalidateQueries(['tasks'])

        // Update specific task
        queryClient.setQueryData(['task', updatedTask.id], updatedTask)

        // Update specific project tasks
        if (updatedTask.projectId) {
          queryClient.invalidateQueries(['tasks', { projectId: updatedTask.projectId }])
        }
      },
    }
  )
}

export function useDeleteTask() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation(
    async (taskId: string) => {
      if (!token) throw new Error('No token available')

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }

      return response.json()
    },
    {
      onSuccess: () => {
        // Invalidate all tasks queries
        queryClient.invalidateQueries(['tasks'])
      },
    }
  )
}

export function useBulkUpdateTasks() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation(
    async (updates: Array<{ id: string; status?: string; position?: number; assigneeId?: string }>) => {
      if (!token) throw new Error('No token available')

      const response = await fetch('/api/tasks/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tasks')
      }

      return response.json()
    },
    {
      onSuccess: () => {
        // Invalidate all tasks queries
        queryClient.invalidateQueries(['tasks'])
      },
    }
  )
}
