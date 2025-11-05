'use client'

import { useDragAndDrop, DragItem } from '@/hooks/use-drag-and-drop'
import { ReactNode } from 'react'

interface Task {
  id: string
  title: string
  status: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assigneeId?: string
  dueDate?: string
}

interface Column {
  id: string
  title: string
  status: string
  tasks: Task[]
}

interface DragDropKanbanProps {
  columns: Column[]
  onTaskMove: (taskId: string, newStatus: string, newIndex?: number) => void
  onColumnReorder?: (newOrder: Column[]) => void
  renderTask: (task: Task, isDragging: boolean) => ReactNode
  renderColumn?: (column: Column, children: ReactNode) => ReactNode
}

export function DragDropKanban({
  columns,
  onTaskMove,
  onColumnReorder,
  renderTask,
  renderColumn,
}: DragDropKanbanProps) {
  const { getDragProps, getDropProps, draggedItem, isDragging } = useDragAndDrop({
    onDrop: async (item: DragItem, dropZone: string) => {
      if (item.type === 'task') {
        const task = item.data as Task
        const [newStatus, indexStr] = dropZone.split(':')
        const newIndex = indexStr ? parseInt(indexStr) : undefined
        
        if (task.status !== newStatus) {
          await onTaskMove(task.id, newStatus, newIndex)
        }
      } else if (item.type === 'column' && onColumnReorder) {
        const draggedIndex = columns.findIndex(col => col.id === item.id)
        const dropIndex = columns.findIndex(col => col.id === dropZone)
        
        if (draggedIndex !== -1 && dropIndex !== -1 && draggedIndex !== dropIndex) {
          const newColumns = [...columns]
          const [draggedColumn] = newColumns.splice(draggedIndex, 1)
          newColumns.splice(dropIndex, 0, draggedColumn)
          onColumnReorder(newColumns)
        }
      }
    }
  })

  const TaskCard = ({ task, index }: { task: Task; index: number }) => {
    const dragProps = getDragProps({
      id: task.id,
      type: 'task',
      data: task
    })

    const dropProps = getDropProps({
      id: `${task.status}:${index}`,
      accepts: ['task'],
      onDrop: () => {} // Handled by main onDrop
    })

    const isBeingDragged = isDragging && draggedItem?.id === task.id

    return (
      <div
        {...dragProps}
        {...dropProps}
        className={`relative ${isBeingDragged ? 'opacity-50' : ''}`}
      >
        {renderTask(task, isBeingDragged)}
        
        {/* Drop indicator */}
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 opacity-0 transition-opacity duration-200 data-[drag-over=true]:opacity-100" />
      </div>
    )
  }

  const ColumnComponent = ({ column }: { column: Column }) => {
    const columnDragProps = onColumnReorder ? getDragProps({
      id: column.id,
      type: 'column',
      data: column
    }) : {}

    const columnDropProps = onColumnReorder ? getDropProps({
      id: column.id,
      accepts: ['column'],
      onDrop: () => {} // Handled by main onDrop
    }) : {}

    const taskDropProps = getDropProps({
      id: `${column.status}:${column.tasks.length}`,
      accepts: ['task'],
      onDrop: () => {} // Handled by main onDrop
    })

    const isColumnDragged = isDragging && draggedItem?.type === 'column' && draggedItem?.id === column.id

    const columnContent = (
      <div className="flex flex-col h-full">
        {/* Column Header */}
        <div 
          className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 ${
            onColumnReorder ? 'cursor-grab' : ''
          } ${isColumnDragged ? 'opacity-50' : ''}`}
          {...columnDragProps}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {column.title}
            </h3>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {column.tasks.length}
            </span>
          </div>
          
          {onColumnReorder && (
            <div className="flex items-center text-gray-400 dark:text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Tasks Container */}
        <div 
          className="flex-1 p-4 space-y-3 min-h-32 overflow-y-auto"
          {...taskDropProps}
        >
          {column.tasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
          
          {/* Empty state */}
          {column.tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400">
              <span className="text-sm">Drop tasks here</span>
            </div>
          )}
        </div>
      </div>
    )

    if (renderColumn) {
      return (
        <div {...columnDropProps}>
          {renderColumn(column, columnContent)}
        </div>
      )
    }

    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm min-w-80 max-w-80"
        {...columnDropProps}
      >
        {columnContent}
      </div>
    )
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <ColumnComponent key={column.id} column={column} />
      ))}
    </div>
  )
}

// Priority badge component
export function PriorityBadge({ priority }: { priority?: Task['priority'] }) {
  if (!priority) return null

  const colors = {
    LOW: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
    MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
    HIGH: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300',
    URGENT: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
      {priority}
    </span>
  )
}

// Default task card component
export function DefaultTaskCard({ task, isDragging }: { task: Task; isDragging: boolean }) {
  return (
    <div className={`p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
      isDragging ? 'rotate-2 shadow-lg' : ''
    }`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>
      
      {task.dueDate && (
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          {new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}
      
      {task.assigneeId && (
        <div className="flex items-center mt-2">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              {task.assigneeId.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
