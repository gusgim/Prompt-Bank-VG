'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Edit, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { getCategoryIcon } from '@/lib/category-icons'
import { getPromptByIdAction, trackPromptViewAction, trackPromptCopyAction } from '@/lib/actions'
import { PromptWithTags } from '@/lib/types'

export default function PromptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const promptId = params.id as string

  const [prompt, setPrompt] = useState<PromptWithTags | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 프롬프트 로딩
  useEffect(() => {
    const loadPrompt = async () => {
      if (!promptId) return

      try {
        console.log('🔍 프롬프트 상세 로딩 시작:', promptId)
        setIsLoading(true)
        setError(null)

        const result = await getPromptByIdAction(promptId)
        console.log('✅ 프롬프트 상세 로딩 성공:', result)
        
        setPrompt({
          ...result,
          tags: result.tags ?? []  // tags가 없으면 빈 배열로 설정
        })
        
        // 조회수 추적 (백그라운드에서 실행)
        try {
          await trackPromptViewAction(promptId)
        } catch (trackError) {
          console.warn('조회수 추적 실패:', trackError)
          // 조회수 추적 실패해도 페이지 로딩은 정상 진행
        }
      } catch (err) {
        console.error('💥 프롬프트 상세 로딩 실패:', err)
        setError(err as Error)
        setPrompt(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadPrompt()
  }, [promptId])

  const CategoryIcon = prompt ? getCategoryIcon(prompt.category) : null

  const handleCopy = useCallback(async () => {
    if (!prompt) return
    
    try {
      await navigator.clipboard.writeText(prompt.content)
      
      // 복사 횟수 추적 (백그라운드에서 실행)
      try {
        await trackPromptCopyAction(prompt.id)
      } catch (trackError) {
        console.warn('복사 추적 실패:', trackError)
        // 복사 추적 실패해도 복사 기능은 정상 동작
      }
      
      showToast('프롬프트가 클립보드에 복사되었습니다!', 'success')
    } catch (error) {
      showToast('복사에 실패했습니다.', 'error')
    }
  }, [prompt, showToast])

  const handleEdit = useCallback(() => {
    router.push(`/prompts/${promptId}/edit`)
  }, [router, promptId])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !prompt) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">프롬프트를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-6">
              {error?.message || '요청하신 프롬프트가 존재하지 않거나 접근 권한이 없습니다.'}
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로 가기
              </Button>
              <Button
                onClick={() => router.push('/prompts')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                프롬프트 목록으로
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로 가기
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleCopy}
              className="bg-[#FF4500] hover:bg-[#FF4500]/90 text-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              복사
            </Button>
            
            <Button
              onClick={handleEdit}
              variant="outline"
              className="border-[#000080] text-[#000080] hover:bg-[#000080] hover:text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Button>
          </div>
        </div>

        {/* 프롬프트 카드 */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {CategoryIcon && (
                  <CategoryIcon className="h-6 w-6 text-[#000080]" />
                )}
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {prompt.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="bg-[#FF4500] text-white">
                      {prompt.category}
                    </Badge>
                    {prompt.subCategory && (
                      <Badge variant="outline">
                        {prompt.subCategory}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 내용 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">프롬프트 내용</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {prompt.content}
                </p>
              </div>
            </div>

            {/* 태그 */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">태그</h3>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-sm">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 메타 정보 */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>생성일: {new Date(prompt.createdAt).toLocaleDateString('ko-KR')}</span>
                <span>수정일: {new Date(prompt.updatedAt).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 