import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

interface AuthenticatedSocket {
  userId: string
  userRole: string
  userEmail: string
}

// Store active users
const activeUsers = new Map<string, { socketId: string; userId: string; userInfo: any }>()

export function initializeSocket(server: NetServer): ServerIO {
  const io = new ServerIO(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3002'],
      methods: ['GET', 'POST']
    }
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          isActive: true
        }
      })

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'))
      }

      // Attach user info to socket
      ;(socket as any).user = user
      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    const user = (socket as any).user
    console.log(`User ${user.email} connected with socket ${socket.id}`)

    // Store active user
    activeUsers.set(socket.id, {
      socketId: socket.id,
      userId: user.id,
      userInfo: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar
      }
    })

    // Join user to their personal room
    socket.join(`user:${user.id}`)

    // Join user to project rooms they have access to
    socket.on('join-project', async (projectId: string) => {
      try {
        // Verify user has access to this project
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            OR: [
              { ownerId: user.id },
              { clientId: user.id },
              { members: { some: { userId: user.id } } }
            ]
          }
        })

        if (project) {
          socket.join(`project:${projectId}`)
          console.log(`User ${user.email} joined project room: ${projectId}`)
        }
      } catch (error) {
        console.error('Error joining project room:', error)
      }
    })

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project:${projectId}`)
      console.log(`User ${user.email} left project room: ${projectId}`)
    })

    // Handle task updates
    socket.on('task-update', async (data: { taskId: string; updates: any }) => {
      try {
        // Verify user has permission to update this task
        const task = await prisma.task.findFirst({
          where: {
            id: data.taskId,
            OR: [
              { assigneeId: user.id },
              { project: { ownerId: user.id } },
              { project: { members: { some: { userId: user.id } } } }
            ]
          },
          include: {
            project: true,
            assignee: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        })

        if (task) {
          // Broadcast to project room
          socket.to(`project:${task.projectId}`).emit('task-updated', {
            taskId: data.taskId,
            updates: data.updates,
            updatedBy: {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`
            },
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error('Error handling task update:', error)
      }
    })

    // Handle comments
    socket.on('new-comment', async (data: { taskId: string; content: string }) => {
      try {
        const task = await prisma.task.findFirst({
          where: {
            id: data.taskId,
            OR: [
              { assigneeId: user.id },
              { project: { ownerId: user.id } },
              { project: { members: { some: { userId: user.id } } } }
            ]
          },
          include: { project: true }
        })

        if (task) {
          // Create comment in database
          const comment = await prisma.comment.create({
            data: {
              content: data.content,
              taskId: data.taskId,
              userId: user.id
            },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, avatar: true }
              }
            }
          })

          // Broadcast to project room
          socket.to(`project:${task.projectId}`).emit('comment-added', {
            taskId: data.taskId,
            comment: {
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt,
              user: comment.user
            }
          })

          // Send notification to task assignee if different from commenter
          if (task.assigneeId && task.assigneeId !== user.id) {
            io.to(`user:${task.assigneeId}`).emit('notification', {
              type: 'comment',
              title: 'Nowy komentarz',
              message: `${user.firstName} ${user.lastName} dodał komentarz do zadania "${task.title}"`,
              taskId: task.id,
              projectId: task.projectId,
              timestamp: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error('Error handling new comment:', error)
      }
    })

    // Handle typing indicators
    socket.on('typing-start', (data: { taskId: string }) => {
      socket.to(`project:${data.taskId}`).emit('user-typing', {
        taskId: data.taskId,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`
        }
      })
    })

    socket.on('typing-stop', (data: { taskId: string }) => {
      socket.to(`project:${data.taskId}`).emit('user-stopped-typing', {
        taskId: data.taskId,
        userId: user.id
      })
    })

    // Send online users list
    socket.on('get-online-users', () => {
      const onlineUsers = Array.from(activeUsers.values()).map(u => u.userInfo)
      socket.emit('online-users', onlineUsers)
    })

    // Broadcast user status
    socket.broadcast.emit('user-online', {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${user.email} disconnected`)
      activeUsers.delete(socket.id)
      
      // Broadcast user offline
      socket.broadcast.emit('user-offline', {
        id: user.id
      })
    })
  })

  return io
}

// Helper functions to emit events from API routes
export function emitToUser(io: ServerIO, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data)
}

export function emitToProject(io: ServerIO, projectId: string, event: string, data: any) {
  io.to(`project:${projectId}`).emit(event, data)
}

export function emitNotification(io: ServerIO, userId: string, notification: {
  type: string
  title: string
  message: string
  taskId?: string
  projectId?: string
}) {
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString()
  })
}
