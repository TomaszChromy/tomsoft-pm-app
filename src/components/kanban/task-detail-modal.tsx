'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdateTask, useDeleteTask, Task } from '@/hooks/use-tasks'
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Flag, 
  Tag, 
  MessageCircle, 
  Paperclip, 
  Trash2,
  Edit3,
  Save,
  AlertCircle
} from 'lucide-react'

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Tytuł zadania jest wymagany'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  tags: z.string().optional()
})

type FormData = z.infer<typeof updateTaskSchema>

interface TaskDetailModalProps {
  task: Task
  projects: any[]
  onClose: () => void
  onUpdate: () => void
}

export function TaskDetailModal({ task, projects, onClose, onUpdate }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedHours: task.estimatedHours || 0,
      tags: task.tags?.join(', ') || ''
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          assigneeId: data.assigneeId || undefined,
          dueDate: data.dueDate || undefined,
          estimatedHours: data.estimatedHours || undefined,
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
        }
      })
      
      setIsEditing(false)
      onUpdate()
    } catch (error: any) {
      console.error('Failed to update task:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task.id)
      onUpdate()
    } catch (error: any) {
      console.error('Failed to delete task:', error)
      // TODO: Show error toast
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-rose-600 bg-rose-100'
      case 'HIGH': return 'text-amber-600 bg-amber-100'
      case 'MEDIUM': return 'text-blue-600 bg-blue-100'
      case 'LOW': return 'text-slate-600 bg-slate-100'
      default: return 'text-slate-600 bg-slate-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'text-emerald-600 bg-emerald-100'
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100'
      case 'REVIEW': return 'text-amber-600 bg-amber-100'
      case 'TODO': return 'text-slate-600 bg-slate-100'
      default: return 'text-slate-600 bg-slate-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {isEditing ? 'Edytuj zadanie' : 'Szczegóły zadania'}
            </h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
              {task.status === 'TODO' ? 'Do zrobienia' :
               task.status === 'IN_PROGRESS' ? 'W trakcie' :
               task.status === 'REVIEW' ? 'Do sprawdzenia' : 'Ukończone'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Edytuj zadanie"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
              title="Usuń zadanie"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tytuł zadania *
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-rose-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opis
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="TODO">Do zrobienia</option>
                    <option value="IN_PROGRESS">W trakcie</option>
                    <option value="REVIEW">Do sprawdzenia</option>
                    <option value="DONE">Ukończone</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priorytet
                  </label>
                  <select
                    {...register('priority')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="LOW">Niski</option>
                    <option value="MEDIUM">Średni</option>
                    <option value="HIGH">Wysoki</option>
                    <option value="URGENT">Pilny</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Termin wykonania
                  </label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Szacowane godziny
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    {...register('estimatedHours', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tagi
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="frontend, bug, feature (oddziel przecinkami)"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    reset()
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Title and Description */}
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{task.title}</h3>
                {task.description && (
                  <p className="text-slate-600 leading-relaxed">{task.description}</p>
                )}
              </div>

              {/* Task Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Project */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                  <div>
                    <p className="text-sm text-slate-500">Projekt</p>
                    <p className="font-medium text-slate-900">{task.project.name}</p>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Flag className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Priorytet</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'LOW' ? 'Niski' :
                       task.priority === 'MEDIUM' ? 'Średni' :
                       task.priority === 'HIGH' ? 'Wysoki' : 'Pilny'}
                    </span>
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Przypisane do</p>
                    <p className="font-medium text-slate-900">
                      {task.assignee ? 
                        `${task.assignee.firstName} ${task.assignee.lastName}` : 
                        'Nieprzypisane'
                      }
                    </p>
                  </div>
                </div>

                {/* Due Date */}
                {task.dueDate && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Termin wykonania</p>
                      <p className="font-medium text-slate-900">{formatDate(task.dueDate)}</p>
                    </div>
                  </div>
                )}

                {/* Estimated Hours */}
                {task.estimatedHours && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Szacowane godziny</p>
                      <p className="font-medium text-slate-900">{task.estimatedHours}h</p>
                    </div>
                  </div>
                )}

                {/* Created */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Utworzone</p>
                    <p className="font-medium text-slate-900">{formatDate(task.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tagi
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 text-sm font-medium bg-indigo-100 text-indigo-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Komentarze</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{task._count.comments}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">Załączniki</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{task._count.attachments}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Wpisy czasu</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{task._count.timeEntries}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-rose-500" />
                <h3 className="text-lg font-semibold text-slate-900">Usuń zadanie</h3>
              </div>
              
              <p className="text-slate-600 mb-6">
                Czy na pewno chcesz usunąć zadanie "{task.title}"? Ta akcja jest nieodwracalna.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Usuń zadanie
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
