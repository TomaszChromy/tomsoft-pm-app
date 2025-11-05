'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface Timer {
  id: string
  description?: string
  startTime: string
  isRunning: boolean
  billable: boolean
  hourlyRate?: number
  tags: string[]
  project: {
    id: string
    name: string
  }
  task?: {
    id: string
    title: string
  }
  elapsedHours: number
  elapsedMs: number
}

interface StartTimerData {
  description?: string
  projectId: string
  taskId?: string
  billable?: boolean
  hourlyRate?: number
  tags?: string[]
}

export function useTimer() {
  const { token } = useAuth()
  const [timer, setTimer] = useState<Timer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current timer
  const fetchTimer = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/time-tracking/timer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTimer(data.timer)
      } else {
        console.error('Failed to fetch timer')
      }
    } catch (error) {
      console.error('Error fetching timer:', error)
    }
  }, [token])

  // Start timer
  const startTimer = async (data: StartTimerData) => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/time-tracking/timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        setTimer(result.timer)
        return result.timer
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to start timer')
        throw new Error(errorData.error)
      }
    } catch (error) {
      console.error('Error starting timer:', error)
      setError(error instanceof Error ? error.message : 'Failed to start timer')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Stop timer
  const stopTimer = async () => {
    if (!token || !timer) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/time-tracking/timer', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setTimer(null)
        return result.timer
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to stop timer')
        throw new Error(errorData.error)
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
      setError(error instanceof Error ? error.message : 'Failed to stop timer')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate current elapsed time
  const getCurrentElapsed = useCallback(() => {
    if (!timer || !timer.isRunning || !timer.startTime) return 0

    const startTime = new Date(timer.startTime).getTime()
    const now = Date.now()
    return (now - startTime) / (1000 * 60 * 60) // Convert to hours
  }, [timer])

  // Format time for display
  const formatTime = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    const s = Math.floor((hours * 3600) % 60)
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Auto-update timer every second
  useEffect(() => {
    if (!timer?.isRunning) return

    const interval = setInterval(() => {
      setTimer(prev => {
        if (!prev || !prev.isRunning) return prev
        
        const elapsed = getCurrentElapsed()
        return {
          ...prev,
          elapsedHours: Math.round(elapsed * 100) / 100,
          elapsedMs: elapsed * 1000 * 60 * 60
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timer?.isRunning, getCurrentElapsed])

  // Fetch timer on mount
  useEffect(() => {
    fetchTimer()
  }, [fetchTimer])

  return {
    timer,
    isLoading,
    error,
    startTimer,
    stopTimer,
    fetchTimer,
    getCurrentElapsed,
    formatTime,
    isRunning: timer?.isRunning || false
  }
}

// Hook for time tracking history
export function useTimeTracking() {
  const { token } = useAuth()
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTimeEntries = async (filters?: {
    projectId?: string
    taskId?: string
    userId?: string
    from?: string
    to?: string
    isRunning?: boolean
  }) => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.projectId) params.append('projectId', filters.projectId)
      if (filters?.taskId) params.append('taskId', filters.taskId)
      if (filters?.userId) params.append('userId', filters.userId)
      if (filters?.from) params.append('from', filters.from)
      if (filters?.to) params.append('to', filters.to)
      if (filters?.isRunning !== undefined) params.append('isRunning', filters.isRunning.toString())

      const response = await fetch(`/api/time-tracking?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTimeEntries(data.timeEntries)
        setSummary(data.summary)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch time entries')
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
      setError('Failed to fetch time entries')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTimeEntry = async (id: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/time-tracking/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTimeEntries(prev => prev.filter(entry => entry.id !== id))
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete time entry')
        return false
      }
    } catch (error) {
      console.error('Error deleting time entry:', error)
      setError('Failed to delete time entry')
      return false
    }
  }

  const updateTimeEntry = async (id: string, updates: any) => {
    if (!token) return

    try {
      const response = await fetch(`/api/time-tracking/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const result = await response.json()
        setTimeEntries(prev => prev.map(entry => 
          entry.id === id ? result.timeEntry : entry
        ))
        return result.timeEntry
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update time entry')
        return null
      }
    } catch (error) {
      console.error('Error updating time entry:', error)
      setError('Failed to update time entry')
      return null
    }
  }

  return {
    timeEntries,
    summary,
    isLoading,
    error,
    fetchTimeEntries,
    deleteTimeEntry,
    updateTimeEntry
  }
}
