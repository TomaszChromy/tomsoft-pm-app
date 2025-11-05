'use client'

import { Task } from '@/hooks/use-tasks'
import { Calendar, Clock, MessageCircle, Paperclip, User, AlertCircle } from 'lucide-react'

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-rose-500 bg-rose-50'
      case 'HIGH': return 'border-l-amber-500 bg-amber-50'
      case 'MEDIUM': return 'border-l-blue-500 bg-blue-50'
      case 'LOW': return 'border-l-slate-400 bg-slate-50'
      default: return 'border-l-slate-400 bg-white'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <AlertCircle className="w-3 h-3 text-rose-500" />
      case 'HIGH': return <AlertCircle className="w-3 h-3 text-amber-500" />
      case 'MEDIUM': return <AlertCircle className="w-3 h-3 text-blue-500" />
      case 'LOW': return <AlertCircle className="w-3 h-3 text-slate-400" />
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} dni temu`, color: 'text-rose-600' }
    } else if (diffDays === 0) {
      return { text: 'Dziś', color: 'text-amber-600' }
    } else if (diffDays === 1) {
      return { text: 'Jutro', color: 'text-amber-600' }
    } else if (diffDays <= 7) {
      return { text: `Za ${diffDays} dni`, color: 'text-slate-600' }
    } else {
      return { text: date.toLocaleDateString('pl-PL'), color: 'text-slate-600' }
    }
  }

  const dueDateInfo = task.dueDate ? formatDate(task.dueDate) : null

  return (
    <div 
      className={`
        bg-white border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer
        ${getPriorityColor(task.priority)}
        ${isDragging ? 'shadow-lg ring-2 ring-indigo-500 ring-opacity-50' : ''}
      `}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-slate-900 text-sm leading-tight mb-1">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {getPriorityIcon(task.priority)}
        </div>
      </div>

      {/* Task Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Task Meta */}
      <div className="space-y-2">
        {/* Project */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 bg-indigo-500 rounded-full" />
          <span className="truncate">{task.project.name}</span>
        </div>

        {/* Due Date */}
        {dueDateInfo && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
          </div>
        )}

        {/* Estimated Hours */}
        {task.estimatedHours && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{task.estimatedHours}h</span>
          </div>
        )}
      </div>

      {/* Task Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-indigo-600" />
              </div>
              <span className="text-xs text-slate-600 truncate max-w-[80px]">
                {task.assignee.firstName} {task.assignee.lastName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-xs text-slate-400">Nieprzypisane</span>
            </div>
          )}
        </div>

        {/* Task Stats */}
        <div className="flex items-center gap-3">
          {task._count.comments > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MessageCircle className="w-3 h-3" />
              <span>{task._count.comments}</span>
            </div>
          )}
          
          {task._count.attachments > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Paperclip className="w-3 h-3" />
              <span>{task._count.attachments}</span>
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-3 h-3 border border-slate-400 rounded-sm" />
              <span>{task.subtasks.filter(st => st.status === 'DONE').length}/{task.subtasks.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtasks Progress */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2">
          <div className="w-full bg-slate-200 rounded-full h-1">
            <div 
              className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
              style={{ 
                width: `${(task.subtasks.filter(st => st.status === 'DONE').length / task.subtasks.length) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
