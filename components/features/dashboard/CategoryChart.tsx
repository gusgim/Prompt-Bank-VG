'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { CategoryStat } from '@/lib/types'

interface CategoryChartProps {
  data: CategoryStat[]
}

// 다양한 색상 팔레트
const COLORS = [
  '#FF6B35', // Lush Lava
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#0891B2', // Cyan
  '#BE185D', // Pink
]

export default function CategoryChart({ data }: CategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📂</div>
          <p>아직 카테고리가 없습니다</p>
        </div>
      </div>
    )
  }

  // 데이터에 색상 추가
  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ category, percent }) => 
              `${category} (${((percent || 0) * 100).toFixed(0)}%)`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [value, '프롬프트 수']}
            labelFormatter={(label) => `카테고리: ${label}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 