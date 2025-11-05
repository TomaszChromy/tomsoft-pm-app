'use client'

import { useState, useEffect } from 'react'
import { FunnelIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export interface FilterCondition {
  id: string
  field: string
  operator: string
  value: string | string[]
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
}

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: { value: string; label: string }[]
}

interface AdvancedFilterProps {
  fields: FilterField[]
  conditions: FilterCondition[]
  onChange: (conditions: FilterCondition[]) => void
  onApply?: () => void
  onClear?: () => void
}

const operators = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'notContains', label: 'Does not contain' },
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'in', label: 'In' },
    { value: 'notIn', label: 'Not in' },
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'between', label: 'Between' },
  ],
  boolean: [
    { value: 'equals', label: 'Equals' },
  ],
}

export function AdvancedFilter({ fields, conditions, onChange, onApply, onClear }: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: fields[0]?.key || '',
      operator: 'contains',
      value: '',
      type: fields[0]?.type || 'text',
    }
    onChange([...conditions, newCondition])
  }

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    onChange(
      conditions.map(condition =>
        condition.id === id ? { ...condition, ...updates } : condition
      )
    )
  }

  const removeCondition = (id: string) => {
    onChange(conditions.filter(condition => condition.id !== id))
  }

  const clearAllConditions = () => {
    onChange([])
    onClear?.()
  }

  const getFieldType = (fieldKey: string) => {
    return fields.find(f => f.key === fieldKey)?.type || 'text'
  }

  const getFieldOptions = (fieldKey: string) => {
    return fields.find(f => f.key === fieldKey)?.options || []
  }

  const renderValueInput = (condition: FilterCondition) => {
    const field = fields.find(f => f.key === condition.field)
    
    switch (condition.type) {
      case 'select':
        if (condition.operator === 'in' || condition.operator === 'notIn') {
          return (
            <select
              multiple
              value={Array.isArray(condition.value) ? condition.value : []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                updateCondition(condition.id, { value: values })
              }}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {getFieldOptions(condition.field).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        }
        return (
          <select
            value={typeof condition.value === 'string' ? condition.value : ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select...</option>
            {getFieldOptions(condition.field).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'boolean':
        return (
          <select
            value={typeof condition.value === 'string' ? condition.value : ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={typeof condition.value === 'string' ? condition.value : ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={typeof condition.value === 'string' ? condition.value : ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter number..."
          />
        )
      
      default:
        return (
          <input
            type="text"
            value={typeof condition.value === 'string' ? condition.value : ''}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter value..."
          />
        )
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
          conditions.length > 0 ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
      >
        <FunnelIcon className="h-4 w-4 mr-2" />
        Filter
        {conditions.length > 0 && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {conditions.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Advanced Filter
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center space-x-2">
                  {index > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      AND
                    </span>
                  )}
                  
                  <select
                    value={condition.field}
                    onChange={(e) => {
                      const fieldType = getFieldType(e.target.value)
                      updateCondition(condition.id, {
                        field: e.target.value,
                        type: fieldType,
                        operator: operators[fieldType][0].value,
                        value: '',
                      })
                    }}
                    className="block w-24 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                  >
                    {fields.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
                    className="block w-24 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
                  >
                    {operators[condition.type].map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex-1">
                    {renderValueInput(condition)}
                  </div>

                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="text-red-400 hover:text-red-500 dark:hover:text-red-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={addCondition}
                className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add condition
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={clearAllConditions}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    onApply?.()
                    setIsOpen(false)
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
