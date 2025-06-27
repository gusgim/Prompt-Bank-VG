'use client'

import { TagStat } from '@/lib/types'

interface TagCloudProps {
  data: TagStat[]
}

export default function TagCloud({ data }: TagCloudProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🏷️</div>
          <p>아직 태그가 없습니다</p>
        </div>
      </div>
    )
  }

  // 태그 크기 계산 (최대값 기준)
  const maxCount = Math.max(...data.map(tag => tag.count))
  
  const getTagSize = (count: number) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) return 'text-2xl'
    if (ratio >= 0.6) return 'text-xl'
    if (ratio >= 0.4) return 'text-lg'
    if (ratio >= 0.2) return 'text-base'
    return 'text-sm'
  }

  const getTagColor = (count: number) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) return 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
    if (ratio >= 0.6) return 'bg-gradient-to-r from-orange-300 to-red-400 text-white'
    if (ratio >= 0.4) return 'bg-gradient-to-r from-orange-200 to-red-300 text-gray-800'
    if (ratio >= 0.2) return 'bg-gradient-to-r from-orange-100 to-red-200 text-gray-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-32">
      <div className="flex flex-wrap gap-3">
        {data.map((tag, index) => (
          <span
            key={index}
            className={`
              inline-flex items-center px-3 py-1 rounded-full font-medium shadow-sm
              ${getTagSize(tag.count)}
              ${getTagColor(tag.count)}
            `}
            title={`${tag.count}개의 프롬프트`}
          >
            #{tag.name}
            <span className="ml-2 text-xs opacity-75">
              {tag.count}
            </span>
          </span>
        ))}
      </div>
      
      {data.length > 10 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          상위 {data.length}개 태그 표시
        </div>
      )}
    </div>
  )
} 