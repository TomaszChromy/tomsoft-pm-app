'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ProjectProgressData {
  name: string
  progress: number
  tasksCompleted: number
  totalTasks: number
  budget: number
  spent: number
}

interface ProjectProgressChartProps {
  data: ProjectProgressData[]
}

export function ProjectProgressChart({ data }: ProjectProgressChartProps) {
  // Color based on progress
  const getBarColor = (progress: number) => {
    if (progress >= 90) return '#10b981' // green
    if (progress >= 70) return '#f59e0b' // yellow
    if (progress >= 50) return '#f97316' // orange
    return '#ef4444' // red
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Postęp: <span className="font-medium text-gray-900">{data.progress}%</span>
            </p>
            <p className="text-gray-600">
              Zadania: <span className="font-medium text-gray-900">
                {data.tasksCompleted}/{data.totalTasks}
              </span>
            </p>
            <p className="text-gray-600">
              Budżet: <span className="font-medium text-gray-900">
                ${data.spent.toLocaleString()}/${data.budget.toLocaleString()}
              </span>
            </p>
            <p className="text-gray-600">
              Wykorzystanie: <span className="font-medium text-gray-900">
                {data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0}%
              </span>
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
            📊
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
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="progress" 
            radius={[4, 4, 0, 0]}
            name="Postęp (%)"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.progress)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
