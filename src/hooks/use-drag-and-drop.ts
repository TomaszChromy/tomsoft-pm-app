'use client'

import { useState, useRef, useCallback } from 'react'

export interface DragItem {
  id: string
  type: string
  data?: any
}

export interface DropZone {
  id: string
  accepts: string[]
  onDrop: (item: DragItem, dropZone: string) => void | Promise<void>
}

interface UseDragAndDropOptions {
  onDragStart?: (item: DragItem) => void
  onDragEnd?: (item: DragItem) => void
  onDrop?: (item: DragItem, dropZone: string) => void | Promise<void>
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragImageRef = useRef<HTMLElement | null>(null)

  const startDrag = useCallback((item: DragItem, event: React.DragEvent) => {
    setDraggedItem(item)
    setIsDragging(true)
    
    // Set drag data
    event.dataTransfer.setData('application/json', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
    
    // Custom drag image if provided
    if (dragImageRef.current) {
      event.dataTransfer.setDragImage(dragImageRef.current, 0, 0)
    }
    
    options.onDragStart?.(item)
  }, [options])

  const endDrag = useCallback((event: React.DragEvent) => {
    setIsDragging(false)
    setDragOverZone(null)
    
    if (draggedItem) {
      options.onDragEnd?.(draggedItem)
      setDraggedItem(null)
    }
  }, [draggedItem, options])

  const dragOver = useCallback((event: React.DragEvent, dropZoneId: string, accepts: string[]) => {
    event.preventDefault()
    
    if (!draggedItem || !accepts.includes(draggedItem.type)) {
      event.dataTransfer.dropEffect = 'none'
      return
    }
    
    event.dataTransfer.dropEffect = 'move'
    setDragOverZone(dropZoneId)
  }, [draggedItem])

  const dragLeave = useCallback((event: React.DragEvent) => {
    // Only clear if we're leaving the drop zone entirely
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDragOverZone(null)
    }
  }, [])

  const drop = useCallback(async (event: React.DragEvent, dropZoneId: string, accepts: string[], onDrop?: (item: DragItem, dropZone: string) => void | Promise<void>) => {
    event.preventDefault()
    setDragOverZone(null)
    
    let item: DragItem
    
    if (draggedItem) {
      item = draggedItem
    } else {
      // Try to get item from dataTransfer
      try {
        const data = event.dataTransfer.getData('application/json')
        item = JSON.parse(data)
      } catch {
        return
      }
    }
    
    if (!accepts.includes(item.type)) {
      return
    }
    
    try {
      await onDrop?.(item, dropZoneId)
      await options.onDrop?.(item, dropZoneId)
    } catch (error) {
      console.error('Drop operation failed:', error)
    }
  }, [draggedItem, options])

  // Drag source props
  const getDragProps = useCallback((item: DragItem) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => startDrag(item, event),
    onDragEnd: endDrag,
    className: isDragging && draggedItem?.id === item.id ? 'opacity-50 cursor-grabbing' : 'cursor-grab',
  }), [startDrag, endDrag, isDragging, draggedItem])

  // Drop zone props
  const getDropProps = useCallback((dropZone: DropZone) => ({
    onDragOver: (event: React.DragEvent) => dragOver(event, dropZone.id, dropZone.accepts),
    onDragLeave: dragLeave,
    onDrop: (event: React.DragEvent) => drop(event, dropZone.id, dropZone.accepts, dropZone.onDrop),
    className: dragOverZone === dropZone.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : '',
  }), [dragOver, dragLeave, drop, dragOverZone])

  return {
    draggedItem,
    dragOverZone,
    isDragging,
    dragImageRef,
    getDragProps,
    getDropProps,
    startDrag,
    endDrag,
  }
}

// Hook for sortable lists
export function useSortable<T extends { id: string }>(
  items: T[],
  onReorder: (newOrder: T[]) => void
) {
  const { getDragProps, getDropProps, draggedItem, isDragging } = useDragAndDrop({
    onDrop: (item, dropZone) => {
      const draggedIndex = items.findIndex(i => i.id === item.id)
      const dropIndex = items.findIndex(i => i.id === dropZone)
      
      if (draggedIndex === -1 || dropIndex === -1 || draggedIndex === dropIndex) {
        return
      }
      
      const newItems = [...items]
      const [draggedItem] = newItems.splice(draggedIndex, 1)
      newItems.splice(dropIndex, 0, draggedItem)
      
      onReorder(newItems)
    }
  })

  const getSortableProps = useCallback((item: T, index: number) => {
    const dragProps = getDragProps({ id: item.id, type: 'sortable', data: item })
    const dropProps = getDropProps({
      id: item.id,
      accepts: ['sortable'],
      onDrop: () => {} // Handled by useDragAndDrop onDrop
    })

    return {
      ...dragProps,
      ...dropProps,
      style: {
        transform: isDragging && draggedItem?.id === item.id ? 'rotate(5deg)' : 'none',
        transition: 'transform 0.2s ease',
      }
    }
  }, [getDragProps, getDropProps, isDragging, draggedItem])

  return {
    getSortableProps,
    isDragging,
    draggedItem,
  }
}

// File drop hook
export function useFileDrop(
  onFileDrop: (files: File[]) => void,
  options: {
    accept?: string[]
    maxFiles?: number
    maxSize?: number
  } = {}
) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFiles = useCallback((files: File[]) => {
    const { accept, maxFiles, maxSize } = options
    
    if (maxFiles && files.length > maxFiles) {
      throw new Error(`Maximum ${maxFiles} files allowed`)
    }
    
    for (const file of files) {
      if (maxSize && file.size > maxSize) {
        throw new Error(`File ${file.name} is too large (max ${maxSize} bytes)`)
      }
      
      if (accept && !accept.some(type => file.type.match(type))) {
        throw new Error(`File ${file.name} type not allowed`)
      }
    }
  }, [options])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
    setError(null)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    setError(null)
    
    const files = Array.from(event.dataTransfer.files)
    
    try {
      validateFiles(files)
      onFileDrop(files)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File validation failed')
    }
  }, [onFileDrop, validateFiles])

  const getFileDropProps = useCallback(() => ({
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    className: isDragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : '',
  }), [handleDragOver, handleDragLeave, handleDrop, isDragOver])

  return {
    isDragOver,
    error,
    getFileDropProps,
  }
}
