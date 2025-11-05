'use client'

import { useState, useEffect } from 'react'
import { AdvancedFilter, FilterCondition, FilterField } from './advanced-filter'
import { BookmarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface SavedFilter {
  id: string
  name: string
  conditions: FilterCondition[]
  isDefault?: boolean
  createdAt: Date
}

interface FilterManagerProps {
  fields: FilterField[]
  conditions: FilterCondition[]
  onChange: (conditions: FilterCondition[]) => void
  onApply?: () => void
  savedFilters?: SavedFilter[]
  onSaveFilter?: (name: string, conditions: FilterCondition[]) => void
  onDeleteFilter?: (filterId: string) => void
  onLoadFilter?: (filter: SavedFilter) => void
}

export function FilterManager({
  fields,
  conditions,
  onChange,
  onApply,
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
  onLoadFilter,
}: FilterManagerProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState('')

  const handleSaveFilter = () => {
    if (filterName.trim() && conditions.length > 0) {
      onSaveFilter?.(filterName.trim(), conditions)
      setFilterName('')
      setShowSaveDialog(false)
    }
  }

  const handleLoadFilter = (filter: SavedFilter) => {
    onChange(filter.conditions)
    onLoadFilter?.(filter)
    onApply?.()
  }

  const hasActiveFilters = conditions.length > 0

  return (
    <div className="flex items-center gap-2">
      {/* Advanced Filter */}
      <AdvancedFilter
        fields={fields}
        conditions={conditions}
        onChange={onChange}
        onApply={onApply}
        onClear={() => onChange([])}
      />

      {/* Saved Filters Dropdown */}
      {savedFilters.length > 0 && (
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
              <BookmarkIcon className="h-4 w-4 mr-2" />
              Saved Filters
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
            <Menu.Items className="absolute left-0 z-10 mt-2 w-64 origin-top-left rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
              <div className="py-1">
                {savedFilters.map((filter) => (
                  <Menu.Item key={filter.id}>
                    {({ active }) => (
                      <div
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        } flex items-center justify-between px-4 py-2`}
                      >
                        <button
                          onClick={() => handleLoadFilter(filter)}
                          className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300"
                        >
                          <div className="font-medium">{filter.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {filter.conditions.length} condition(s)
                            {filter.isDefault && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                Default
                              </span>
                            )}
                          </div>
                        </button>
                        
                        {onDeleteFilter && !filter.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteFilter(filter.id)
                            }}
                            className="ml-2 p-1 text-red-400 hover:text-red-500 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      )}

      {/* Save Filter Button */}
      {hasActiveFilters && onSaveFilter && (
        <button
          onClick={() => setShowSaveDialog(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Save Filter
        </button>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowSaveDialog(false)} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
                    Save Filter
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Give your filter a name to save it for later use.
                    </p>
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Filter name..."
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveFilter()
                        } else if (e.key === 'Escape') {
                          setShowSaveDialog(false)
                        }
                      }}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleSaveFilter}
                  disabled={!filterName.trim()}
                  className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-2"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:col-start-1 sm:mt-0"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {conditions.length} filter(s) active
          </span>
          <button
            onClick={() => onChange([])}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

// Hook for managing saved filters
export function useSavedFilters(storageKey: string) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const filters = JSON.parse(stored).map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt)
        }))
        setSavedFilters(filters)
      } catch (error) {
        console.error('Failed to load saved filters:', error)
      }
    }
  }, [storageKey])

  const saveFilter = (name: string, conditions: FilterCondition[]) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      conditions,
      createdAt: new Date(),
    }
    
    const updated = [...savedFilters, newFilter]
    setSavedFilters(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const deleteFilter = (filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId)
    setSavedFilters(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  const setDefaultFilter = (filterId: string) => {
    const updated = savedFilters.map(f => ({
      ...f,
      isDefault: f.id === filterId
    }))
    setSavedFilters(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  return {
    savedFilters,
    saveFilter,
    deleteFilter,
    setDefaultFilter,
  }
}
