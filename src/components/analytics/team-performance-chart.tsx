'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface TeamPerformanceData {
  name: string
  tasksCompleted: number
  hoursLogged: number
  efficiency: number
  avatar?: string
}

interface TeamPerformanceChartProps {
  data: TeamPerformanceData[]
}

export function TeamPerformanceChart({ data }: TeamPerformanceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Ukończone zadania: <span className="font-medium text-blue-600">{data.tasksCompleted}</span>
            </p>
            <p className="text-gray-600">
              Przepracowane godziny: <span className="font-medium text-green-600">{data.hoursLogged}h</span>
            </p>
            <p className="text-gray-600">
              Wydajność: <span className="font-medium text-purple-600">{data.efficiency}%</span>
            </p>
          </div>
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
            👥
          </div>
          <p>Brak danych do wyświetlenia</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="tasksCompleted" 
            fill="#3b82f6" 
            radius={[2, 2, 0, 0]}
            name="Ukończone zadania"
          />
          <Bar 
            dataKey="hoursLogged" 
            fill="#10b981" 
            radius={[2, 2, 0, 0]}
            name="Przepracowane godziny"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
