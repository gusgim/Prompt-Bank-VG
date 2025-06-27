'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PromptForm from '@/components/features/prompts/PromptForm'
import { getPromptByIdAction, getCategoriesAction } from '@/lib/actions'
import { PromptWithTags } from '@/lib/types'

export default function EditPromptPage() {
  const params = useParams()
  const router = useRouter()
  const promptId = params.id as string

  const [prompt, setPrompt] = useState<PromptWithTags | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📝 프롬프트 수정 페이지 데이터 로딩 시작')
        setIsLoading(true)

        // 병렬로 데이터 로딩
        const [promptData, categoriesData] = await Promise.all([
          getPromptByIdAction(promptId),
          getCategoriesAction()
        ])

        setPrompt(promptData)
        setCategories(categoriesData)
        
        console.log('✅ 프롬프트 수정 페이지 데이터 로딩 성공', {
          promptTitle: promptData.title,
          categoriesCount: categoriesData.length
        })
      } catch (error) {
        console.error('💥 프롬프트 수정 페이지 데이터 로딩 실패:', error)
        setError(error instanceof Error ? error.message : '데이터를 불러올 수 없습니다.')
        
        // 프롬프트를 찾을 수 없는 경우 404 페이지로 이동
        if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
          router.push('/404')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [promptId, router])

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">프롬프트 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">프롬프트를 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <PromptForm 
      prompt={prompt} 
      categories={categories} 
    />
  )
} 