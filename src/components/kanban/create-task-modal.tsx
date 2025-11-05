'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTask, CreateTaskData } from '@/hooks/use-tasks'
import { X, Calendar, Clock, User, Flag, Tag } from 'lucide-react'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Tytuł zadania jest wymagany'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Projekt jest wymagany'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  tags: z.string().optional()
})

type FormData = z.infer<typeof createTaskSchema>

interface CreateTaskModalProps {
  projects: any[]
  onClose: () => void
  onSuccess: () => void
}

export function CreateTaskModal({ projects, onClose, onSuccess }: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createTaskMutation = useCreateTask()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: 'MEDIUM'
    }
  })

  const selectedProjectId = watch('projectId')

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      
      const taskData: CreateTaskData = {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        priority: data.priority,
        assigneeId: data.assigneeId || undefined,
        dueDate: data.dueDate || undefined,
        estimatedHours: data.estimatedHours || undefined,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
      }

      await createTaskMutation.mutateAsync(taskData)
      onSuccess()
    } catch (error: any) {
      console.error('Failed to create task:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Nowe zadanie</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tytuł zadania *
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Wprowadź tytuł zadania..."
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
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Opisz zadanie..."
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Projekt *
            </label>
            <select
              {...register('projectId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Wybierz projekt</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-sm text-rose-600">{errors.projectId.message}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Flag className="w-4 h-4 inline mr-1" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
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
                <Clock className="w-4 h-4 inline mr-1" />
                Szacowane godziny
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                {...register('estimatedHours', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Przypisz do
            </label>
            <select
              {...register('assigneeId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Nie przypisane</option>
              {/* Team members will be loaded based on selected project */}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tagi
            </label>
            <input
              type="text"
              {...register('tags')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="frontend, bug, feature (oddziel przecinkami)"
            />
            <p className="mt-1 text-xs text-slate-500">
              Oddziel tagi przecinkami
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Tworzenie...' : 'Utwórz zadanie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
