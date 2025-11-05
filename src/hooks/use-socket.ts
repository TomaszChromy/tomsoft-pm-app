'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/auth-context'

interface Notification {
  type: string
  title: string
  message: string
  taskId?: string
  projectId?: string
  timestamp: string
}

interface OnlineUser {
  id: string
  name: string
  avatar?: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

export function useSocket() {
  // Safe auth context usage with error handling
  let authData
  try {
    authData = useAuth()
  } catch (error) {
    // If AuthProvider is not available, return default values
    authData = { token: null, user: null }
  }

  const { token, user } = authData
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    if (!token || !user) return

    // Initialize socket connection
    const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3002', {
      path: '/api/socket',
      auth: {
        token
      }
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      setIsConnected(true)
      
      // Get online users
      socket.emit('get-online-users')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    // Notification events
    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50 notifications
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        })
      }
    })

    // Online users events
    socket.on('online-users', (users: OnlineUser[]) => {
      setOnlineUsers(users)
    })

    socket.on('user-online', (user: OnlineUser) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.id === user.id)
        if (exists) return prev
        return [...prev, user]
      })
    })

    socket.on('user-offline', (data: { id: string }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== data.id))
    })

    // Typing events
    socket.on('user-typing', (data: { taskId: string; user: { id: string; name: string } }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.set(data.taskId, data.user.name)
        return newMap
      })
    })

    socket.on('user-stopped-typing', (data: { taskId: string; userId: string }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev)
        newMap.delete(data.taskId)
        return newMap
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [token, user])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const joinProject = (projectId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-project', projectId)
    }
  }

  const leaveProject = (projectId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-project', projectId)
    }
  }

  const updateTask = (taskId: string, updates: any) => {
    if (socketRef.current) {
      socketRef.current.emit('task-update', { taskId, updates })
    }
  }

  const addComment = (taskId: string, content: string) => {
    if (socketRef.current) {
      socketRef.current.emit('new-comment', { taskId, content })
    }
  }

  const startTyping = (taskId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-start', { taskId })
    }
  }

  const stopTyping = (taskId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-stop', { taskId })
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index))
  }

  // Subscribe to real-time events
  const subscribeToTaskUpdates = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('task-updated', callback)
      return () => {
        socketRef.current?.off('task-updated', callback)
      }
    }
    return () => {}
  }

  const subscribeToComments = (callback: (data: { taskId: string; comment: Comment }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('comment-added', callback)
      return () => {
        socketRef.current?.off('comment-added', callback)
      }
    }
    return () => {}
  }

  return {
    isConnected,
    notifications,
    onlineUsers,
    typingUsers,
    joinProject,
    leaveProject,
    updateTask,
    addComment,
    startTyping,
    stopTyping,
    clearNotifications,
    removeNotification,
    subscribeToTaskUpdates,
    subscribeToComments
  }
}

// Hook for specific project real-time features
export function useProjectSocket(projectId: string) {
  const socket = useSocket()

  useEffect(() => {
    if (projectId && socket.isConnected) {
      socket.joinProject(projectId)
      return () => {
        socket.leaveProject(projectId)
      }
    }
  }, [projectId, socket.isConnected])

  return socket
}

// Hook for task-specific real-time features
export function useTaskSocket(taskId: string) {
  const socket = useSocket()
  const [taskUpdates, setTaskUpdates] = useState<any[]>([])
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    const unsubscribeUpdates = socket.subscribeToTaskUpdates((data) => {
      if (data.taskId === taskId) {
        setTaskUpdates(prev => [data, ...prev].slice(0, 20))
      }
    })

    const unsubscribeComments = socket.subscribeToComments((data) => {
      if (data.taskId === taskId) {
        setComments(prev => [data.comment, ...prev])
      }
    })

    return () => {
      unsubscribeUpdates()
      unsubscribeComments()
    }
  }, [taskId, socket])

  const addComment = (content: string) => {
    socket.addComment(taskId, content)
  }

  const startTyping = () => {
    socket.startTyping(taskId)
  }

  const stopTyping = () => {
    socket.stopTyping(taskId)
  }

  return {
    taskUpdates,
    comments,
    addComment,
    startTyping,
    stopTyping,
    typingUser: socket.typingUsers.get(taskId)
  }
}
