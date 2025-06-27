'use client'

import { memo } from 'react'
import { PromptCard } from './PromptCard'
import { PromptWithTags } from '@/lib/types'

interface PromptListProps {
  prompts: PromptWithTags[]
  isLoading: boolean
  onDelete?: () => void
}

// Skeleton loader component
const PromptSkeleton = memo(() => (
  <div className="rounded-lg border bg-white shadow-sm p-6 h-60 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
  </div>
))
PromptSkeleton.displayName = 'PromptSkeleton'

export function PromptList({ prompts, isLoading, onDelete }: PromptListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PromptSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!prompts || prompts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          검색 결과가 없습니다. 필터를 조정해보세요.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} onDelete={onDelete} />
      ))}
    </div>
  )
} 