'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface BudgetAnalysisData {
  project: string
  budget: number
  spent: number
  remaining: number
  utilization: number
}

interface BudgetAnalysisChartProps {
  data: BudgetAnalysisData[]
}

export function BudgetAnalysisChart({ data }: BudgetAnalysisChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Budżet: <span className="font-medium text-blue-600">${data.budget.toLocaleString()}</span>
            </p>
            <p className="text-gray-600">
              Wydane: <span className="font-medium text-red-600">${data.spent.toLocaleString()}</span>
            </p>
            <p className="text-gray-600">
              Pozostało: <span className="font-medium text-green-600">${data.remaining.toLocaleString()}</span>
            </p>
            <p className="text-gray-600">
              Wykorzystanie: <span className="font-medium text-purple-600">{data.utilization}%</span>
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
            💰
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
            dataKey="project" 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#64748b"
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="budget" 
            fill="#3b82f6" 
            radius={[2, 2, 0, 0]}
            name="Budżet"
          />
          <Bar 
            dataKey="spent" 
            fill="#ef4444" 
            radius={[2, 2, 0, 0]}
            name="Wydane"
          />
          <Bar 
            dataKey="remaining" 
            fill="#10b981" 
            radius={[2, 2, 0, 0]}
            name="Pozostało"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
