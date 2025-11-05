'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const presets = [
    {
      label: 'Ostatnie 7 dni',
      getValue: () => ({
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date()
      })
    },
    {
      label: 'Ostatnie 30 dni',
      getValue: () => ({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
      })
    },
    {
      label: 'Ostatnie 3 miesiące',
      getValue: () => ({
        from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        to: new Date()
      })
    },
    {
      label: 'Ostatnie 6 miesięcy',
      getValue: () => ({
        from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        to: new Date()
      })
    },
    {
      label: 'Ostatni rok',
      getValue: () => ({
        from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        to: new Date()
      })
    },
    {
      label: 'Bieżący miesiąc',
      getValue: () => ({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      })
    },
    {
      label: 'Poprzedni miesiąc',
      getValue: () => {
        const now = new Date()
        const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          from: firstDayPrevMonth,
          to: lastDayPrevMonth
        }
      }
    }
  ]

  const formatDateRange = (range: DateRange) => {
    return `${format(range.from, 'dd MMM yyyy', { locale: pl })} - ${format(range.to, 'dd MMM yyyy', { locale: pl })}`
  }

  const handlePresetClick = (preset: typeof presets[0]) => {
    const newRange = preset.getValue()
    onChange(newRange)
    setIsOpen(false)
  }

  const handleCustomDateChange = (field: 'from' | 'to', dateString: string) => {
    const newDate = new Date(dateString)
    if (isNaN(newDate.getTime())) return

    const newRange = {
      ...value,
      [field]: newDate
    }

    // Ensure 'from' is not after 'to'
    if (field === 'from' && newRange.from > newRange.to) {
      newRange.to = newRange.from
    }
    if (field === 'to' && newRange.to < newRange.from) {
      newRange.from = newRange.to
    }

    onChange(newRange)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {formatDateRange(value)}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Wybierz zakres dat</h4>
            
            {/* Presets */}
            <div className="space-y-1 mb-4">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <hr className="my-4" />

            {/* Custom date inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data początkowa
                </label>
                <input
                  type="date"
                  value={format(value.from, 'yyyy-MM-dd')}
                  onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data końcowa
                </label>
                <input
                  type="date"
                  value={format(value.to, 'yyyy-MM-dd')}
                  onChange={(e) => handleCustomDateChange('to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
              >
                Zastosuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
