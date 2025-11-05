'use client'

import { useState, useCallback } from 'react'
import { TaskCard } from './task-card'
import { TaskDetailModal } from './task-detail-modal'
import { useBulkUpdateTasks } from '@/hooks/use-tasks'
import { Task } from '@/hooks/use-tasks'
import { DragDropKanban, DefaultTaskCard } from '@/components/ui/drag-drop-kanban'
import { Plus } from 'lucide-react'

interface KanbanBoardProps {
  tasks: Task[]
  projects: any[]
  onTaskUpdate: () => void
}

const COLUMNS = [
  { id: 'TODO', title: 'Do zrobienia', color: 'slate' },
  { id: 'IN_PROGRESS', title: 'W trakcie', color: 'blue' },
  { id: 'REVIEW', title: 'Do sprawdzenia', color: 'amber' },
  { id: 'DONE', title: 'Ukończone', color: 'emerald' }
] as const

export function KanbanBoard({ tasks, projects, onTaskUpdate }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const bulkUpdateMutation = useBulkUpdateTasks()

  // Prepare columns for drag & drop component
  const columns = COLUMNS.map(column => ({
    id: column.id,
    title: column.title,
    status: column.id,
    tasks: tasks
      .filter(task => task.status === column.id)
      .sort((a, b) => a.position - b.position)
      .map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
      }))
  }))

  const handleTaskMove = useCallback(async (taskId: string, newStatus: string, newIndex?: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Prepare updates for all affected tasks
    const updates: Array<{ id: string; status?: string; position?: number }> = []

    // Update task status
    if (task.status !== newStatus) {
      updates.push({
        id: taskId,
        status: newStatus,
        position: newIndex ?? 0
      })
    }

    // Update positions of other tasks in the new column
    const newColumnTasks = tasks.filter(t => t.status === newStatus && t.id !== taskId)
    if (typeof newIndex === 'number') {
      newColumnTasks.forEach((t, index) => {
        const newPosition = index >= newIndex ? index + 1 : index
        if (t.position !== newPosition) {
          updates.push({
            id: t.id,
            position: newPosition
          })
        }
      })
    }

    // Execute bulk update
    if (updates.length > 0) {
      bulkUpdateMutation.mutate(updates, {
        onSuccess: () => {
          onTaskUpdate()
        },
        onError: (error) => {
          console.error('Failed to update task positions:', error)
        }
      })
    }
  }, [tasks, bulkUpdateMutation, onTaskUpdate])

  const renderTask = useCallback((task: any, isDragging: boolean) => {
    const fullTask = tasks.find(t => t.id === task.id)
    if (!fullTask) return null

    return (
      <div onClick={() => setSelectedTask(fullTask)}>
        <TaskCard
          task={fullTask}
          projects={projects}
          onClick={() => setSelectedTask(fullTask)}
        />
      </div>
    )
  }, [tasks, projects])

  const renderColumn = useCallback((column: any, children: React.ReactNode) => {
    const columnConfig = COLUMNS.find(c => c.id === column.status)

    return (
      <div className="bg-slate-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              columnConfig?.color === 'slate' ? 'bg-slate-400' :
              columnConfig?.color === 'blue' ? 'bg-blue-500' :
              columnConfig?.color === 'amber' ? 'bg-amber-500' :
              'bg-emerald-500'
            }`} />
            <h3 className="font-semibold text-slate-900 dark:text-gray-100">{column.title}</h3>
            <span className="text-sm text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
              {column.tasks.length}
            </span>
          </div>

          {column.status === 'TODO' && (
            <button
              type="button"
              className="p-1 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    )
  }, [])

  return (
    <>
      <DragDropKanban
        columns={columns}
        onTaskMove={handleTaskMove}
        renderTask={renderTask}
        renderColumn={renderColumn}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            setSelectedTask(null)
            onTaskUpdate()
          }}
        />
      )}
    </>
  )
}
