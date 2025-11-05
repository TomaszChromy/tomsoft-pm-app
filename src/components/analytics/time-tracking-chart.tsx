'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

interface TimeTrackingData {
  date: string
  hours: number
  project: string
  user: string
}

interface TimeTrackingChartProps {
  data: TimeTrackingData[]
}

export function TimeTrackingChart({ data }: TimeTrackingChartProps) {
  // Group data by date and sum hours
  const groupedData = data.reduce((acc, entry) => {
    const date = entry.date
    if (!acc[date]) {
      acc[date] = { date, hours: 0 }
    }
    acc[date].hours += entry.hours
    return acc
  }, {} as Record<string, { date: string; hours: number }>)

  const chartData = Object.values(groupedData)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      ...item,
      hours: Math.round(item.hours * 10) / 10,
      formattedDate: format(parseISO(item.date), 'dd MMM', { locale: pl })
    }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">
            {format(parseISO(data.date), 'dd MMMM yyyy', { locale: pl })}
          </p>
          <p className="text-sm text-gray-600">
            Przepracowane godziny: <span className="font-medium text-blue-600">{data.hours}h</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            ⏰
          </div>
          <p>Brak danych do wyświetlenia</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="hours" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
