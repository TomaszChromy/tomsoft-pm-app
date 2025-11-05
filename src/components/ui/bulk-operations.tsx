'use client'

import { useState, useEffect } from 'react'
import { CheckIcon, ChevronDownIcon, TrashIcon, PencilIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export interface BulkAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  action: (selectedIds: string[]) => void | Promise<void>
  variant?: 'default' | 'danger' | 'warning'
  requiresConfirmation?: boolean
  confirmationMessage?: string
}

interface BulkOperationsProps {
  selectedIds: string[]
  totalCount: number
  actions: BulkAction[]
  onSelectAll: () => void
  onDeselectAll: () => void
  isSelectAllChecked: boolean
  isSelectAllIndeterminate: boolean
}

export function BulkOperations({
  selectedIds,
  totalCount,
  actions,
  onSelectAll,
  onDeselectAll,
  isSelectAllChecked,
  isSelectAllIndeterminate,
}: BulkOperationsProps) {
  const [isExecuting, setIsExecuting] = useState<string | null>(null)

  const handleAction = async (action: BulkAction) => {
    if (selectedIds.length === 0) return

    if (action.requiresConfirmation) {
      const message = action.confirmationMessage || `Are you sure you want to ${action.label.toLowerCase()} ${selectedIds.length} item(s)?`
      if (!confirm(message)) return
    }

    setIsExecuting(action.id)
    try {
      await action.action(selectedIds)
    } catch (error) {
      console.error(`Error executing ${action.label}:`, error)
    } finally {
      setIsExecuting(null)
    }
  }

  const getActionVariantClasses = (variant: BulkAction['variant'] = 'default') => {
    switch (variant) {
      case 'danger':
        return 'text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
      default:
        return 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
    }
  }

  if (selectedIds.length === 0) {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isSelectAllChecked}
          ref={(input) => {
            if (input) input.indeterminate = isSelectAllIndeterminate
          }}
          onChange={isSelectAllChecked ? onDeselectAll : onSelectAll}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
        />
        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
          Select all ({totalCount})
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isSelectAllChecked}
          ref={(input) => {
            if (input) input.indeterminate = isSelectAllIndeterminate
          }}
          onChange={isSelectAllChecked ? onDeselectAll : onSelectAll}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
        />
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {actions.slice(0, 2).map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={isExecuting !== null}
              className={`inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${getActionVariantClasses(action.variant)}`}
            >
              {isExecuting === action.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : (
                Icon && <Icon className="h-4 w-4 mr-2" />
              )}
              {action.label}
            </button>
          )
        })}

        {actions.length > 2 && (
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                More
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
                <div className="py-1">
                  {actions.slice(2).map((action) => {
                    const Icon = action.icon
                    return (
                      <Menu.Item key={action.id}>
                        {({ active }) => (
                          <button
                            onClick={() => handleAction(action)}
                            disabled={isExecuting !== null}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } ${getActionVariantClasses(action.variant)} group flex items-center w-full px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isExecuting === action.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3" />
                            ) : (
                              Icon && <Icon className="mr-3 h-4 w-4" />
                            )}
                            {action.label}
                          </button>
                        )}
                      </Menu.Item>
                    )
                  })}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}

        <button
          onClick={onDeselectAll}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Clear selection
        </button>
      </div>
    </div>
  )
}

// Hook for managing bulk selection
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const isSelected = (id: string) => selectedIds.includes(id)
  
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedIds(items.map(item => item.id))
  }

  const deselectAll = () => {
    setSelectedIds([])
  }

  const isSelectAllChecked = selectedIds.length === items.length && items.length > 0
  const isSelectAllIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length

  // Clear selection when items change
  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => items.some(item => item.id === id)))
  }, [items])

  return {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelectAllChecked,
    isSelectAllIndeterminate,
    selectedItems: items.filter(item => selectedIds.includes(item.id)),
  }
}

// Common bulk actions
export const commonBulkActions: BulkAction[] = [
  {
    id: 'delete',
    label: 'Delete',
    icon: TrashIcon,
    variant: 'danger',
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete the selected items? This action cannot be undone.',
    action: async (selectedIds) => {
      // Implementation depends on the specific use case
      console.log('Deleting items:', selectedIds)
    },
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: ArchiveBoxIcon,
    variant: 'warning',
    requiresConfirmation: true,
    action: async (selectedIds) => {
      console.log('Archiving items:', selectedIds)
    },
  },
  {
    id: 'edit',
    label: 'Bulk Edit',
    icon: PencilIcon,
    action: async (selectedIds) => {
      console.log('Bulk editing items:', selectedIds)
    },
  },
]
