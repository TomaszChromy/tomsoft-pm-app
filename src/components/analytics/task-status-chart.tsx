'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface TaskStatusData {
  status: string
  count: number
  percentage: number
}

interface TaskStatusChartProps {
  data: TaskStatusData[]
}

const STATUS_COLORS = {
  TODO: '#64748b',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#f59e0b',
  DONE: '#10b981'
}

const STATUS_LABELS = {
  TODO: 'Do zrobienia',
  IN_PROGRESS: 'W trakcie',
  REVIEW: 'Do przeglądu',
  DONE: 'Ukończone'
}

export function TaskStatusChart({ data }: TaskStatusChartProps) {
  const chartData = data.map(item => ({
    ...item,
    name: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status,
    fill: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#64748b'
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Zadania: <span className="font-medium text-gray-900">{data.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Procent: <span className="font-medium text-gray-900">{data.percentage}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            📈
          </div>
          <p>Brak danych do wyświetlenia</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color, fontSize: '12px' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
