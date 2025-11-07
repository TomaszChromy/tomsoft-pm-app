'use client'

import { useState } from 'react'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  AlertTriangleIcon,
  CalendarIcon,
  UserIcon,
  MessageSquareIcon,
  PaperclipIcon,
  ChevronRightIcon
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  project?: {
    id: string
    name: string
    status: string
  }
  assignee?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  commentsCount?: number
  attachmentsCount?: number
  isOverdue?: boolean
  createdAt: string
  updatedAt: string
}

interface MobileTaskCardProps {
  task: Task
  onStatusChange?: (taskId: string, newStatus: string) => void
  onTaskClick?: (task: Task) => void
  className?: string
}

export function MobileTaskCard({ 
  task, 
  onStatusChange, 
  onTaskClick,
  className 
}: MobileTaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!onStatusChange || isUpdating) return
    
    setIsUpdating(true)
    
    try {
      const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
      await onStatusChange(task.id, newStatus)
    } catch (error) {
      console.error('Failed to update task status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'text-green-600'
      case 'IN_PROGRESS': return 'text-blue-600'
      case 'TODO': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm active:bg-gray-50 transition-colors ${className}`}
      onClick={() => onTaskClick?.(task)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <button
            onClick={handleStatusToggle}
            disabled={isUpdating}
            className={`mt-0.5 flex-shrink-0 ${isUpdating ? 'opacity-50' : ''}`}
          >
            <CheckCircleIcon 
              className={`h-5 w-5 ${
                task.status === 'DONE' 
                  ? 'text-green-600 fill-current' 
                  : 'text-gray-400 hover:text-green-600'
              }`} 
            />
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium text-gray-900 line-clamp-2 ${
              task.status === 'DONE' ? 'line-through text-gray-500' : ''
            }`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
        
        <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {/* Priority and Status */}
      <div className="flex items-center space-x-2 mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
        
        {task.isOverdue && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Overdue
          </span>
        )}
      </div>

      {/* Project */}
      {task.project && (
        <div className="flex items-center text-xs text-gray-600 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
          <span className="truncate">{task.project.name}</span>
        </div>
      )}

      {/* Due Date and Time */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
        {task.dueDate && (
          <div className="flex items-center">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span className={task.isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatDate(task.dueDate)}
            </span>
          </div>
        )}
        
        {task.estimatedHours && (
          <div className="flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>
              {task.actualHours ? `${task.actualHours}h` : `~${task.estimatedHours}h`}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center text-xs text-gray-600">
            {task.assignee.avatar ? (
              <img 
                src={task.assignee.avatar} 
                alt={`${task.assignee.firstName} ${task.assignee.lastName}`}
                className="h-5 w-5 rounded-full mr-2"
              />
            ) : (
              <div className="h-5 w-5 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
                <UserIcon className="h-3 w-3 text-gray-600" />
              </div>
            )}
            <span className="truncate">
              {task.assignee.firstName} {task.assignee.lastName}
            </span>
          </div>
        )}

        {/* Comments and Attachments */}
        <div className="flex items-center space-x-3">
          {(task.commentsCount ?? 0) > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <MessageSquareIcon className="h-3 w-3 mr-1" />
              <span>{task.commentsCount}</span>
            </div>
          )}
          
          {(task.attachmentsCount ?? 0) > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <PaperclipIcon className="h-3 w-3 mr-1" />
              <span>{task.attachmentsCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
