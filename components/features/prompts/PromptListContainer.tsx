'use client'

import { useState, useCallback, useMemo, useEffect, useTransition } from 'react'
import { PromptList } from './PromptList'
import FilterSidebar from './FilterSidebar'
import { PromptFilters, PromptWithTags, PaginatedResponse } from '@/lib/types'
import { useToast } from '@/components/ui/Toast'
import { getPromptsAction, getCategoriesAction, getTagsAction } from '@/lib/actions'
import { BannerSection } from './BannerSection'
import { ImportantNoticesBanner } from '@/components/features/notices/ImportantNoticesBanner'

export function PromptListContainer() {
  const [filters, setFilters] = useState<PromptFilters>({ page: 1 })
  const { showToast } = useToast()
  
  // 서버 액션 상태 관리
  const [promptsData, setPromptsData] = useState<PaginatedResponse<PromptWithTags> | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const [isPending, startTransition] = useTransition()

  // 초기 데이터 로딩
  useEffect(() => {
    const initializeData = async () => {
      if (isInitialized) return
      
      setIsLoading(true)
      setIsInitialized(true)
      
      try {
        // 병렬로 모든 데이터 로딩
        const [promptsResult, categoriesResult, tagsResult] = await Promise.all([
          getPromptsAction({ page: 1 }),
          getCategoriesAction(),
          getTagsAction()
        ])
        
        setPromptsData(promptsResult)
        setCategories(categoriesResult)
        setTags(tagsResult)
        
      } catch (error) {
        console.error('초기 데이터 로딩 중 오류:', error)
        showToast('데이터 로딩 중 오류가 발생했습니다.', 'error')
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeData()
  }, [isInitialized, showToast])

  // 필터 변경 시 프롬프트 재로딩
  useEffect(() => {
    const loadFilteredPrompts = async () => {
      if (!isInitialized) return
      
      try {
        startTransition(() => {
          getPromptsAction(filters).then(result => {
            setPromptsData(result)
          }).catch(error => {
            console.error('필터링된 프롬프트 로딩 실패:', error)
            showToast('프롬프트 로딩 실패', 'error')
          })
        })
      } catch (error) {
        console.error('필터 변경 중 오류:', error)
      }
    }
    
    loadFilteredPrompts()
  }, [filters, isInitialized, showToast])

  const prompts: PromptWithTags[] = useMemo(() => {
    if (!promptsData) {
      return []
    }
    
    return promptsData.data || []
  }, [promptsData])

  // handleFiltersChange 콜백
  const handleFiltersChange = useCallback((newFilters: PromptFilters) => {
    setFilters(newFilters)
  }, [])

  const handleDelete = useCallback(async () => {
    // 삭제 후 데이터 새로고침
    try {
      const result = await getPromptsAction(filters)
      setPromptsData(result)
    } catch (error) {
      console.error('삭제 후 데이터 새로고침 실패:', error)
    }
  }, [filters])

  const tagNames = useMemo(() => {
    return tags.map(tag => tag.name)
  }, [tags])

  const finalIsLoading = (isLoading || isPending) && isInitialized

  // 초기화 전에는 로딩 스피너 표시
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-200/80 to-indigo-300/90 relative">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
        
        <div className="w-full px-6 py-6 relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-200/80 to-indigo-300/90 relative">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }}></div>
      
      <div className="w-full px-6 py-6 relative z-10">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* 왼쪽 사이드바 */}
          <div className="xl:w-80 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              categories={categories}
              tags={tagNames}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* 중앙 메인 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {/* 중요 공지사항 배너 */}
            <ImportantNoticesBanner />
            
            {/* 프롬프트 총 개수 표시 */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {promptsData?.pagination ? (
                  <>
                    총 <span className="font-semibold text-gray-700">{promptsData.pagination.totalCount}</span>개의 프롬프트
                    {filters.query && (
                      <span className="ml-2">
                        ("<span className="font-medium">{filters.query}</span>" 검색 결과)
                      </span>
                    )}
                    {filters.category && (
                      <span className="ml-2">
                        (<span className="font-medium">{filters.category}</span> 카테고리)
                      </span>
                    )}
                  </>
                ) : (
                  '프롬프트 개수 확인 중...'
                )}
              </div>
              
              {/* 정렬 옵션 */}
              <div className="text-sm text-gray-400">
                {promptsData?.pagination && (
                  <>
                    {promptsData.pagination.currentPage} / {promptsData.pagination.totalPages} 페이지
                  </>
                )}
              </div>
            </div>

            <PromptList
              prompts={prompts}
              isLoading={finalIsLoading}
              onDelete={handleDelete}
            />
            
            {/* 페이지네이션 */}
            {promptsData?.pagination && promptsData.pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleFiltersChange({ ...filters, page: filters.page! - 1 })}
                  disabled={!promptsData.pagination.hasPrev || finalIsLoading}
                  className="px-3 py-2 text-sm bg-white/75 backdrop-blur-md border border-gray-400/60 rounded-md hover:bg-white/85 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  이전
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: promptsData.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handleFiltersChange({ ...filters, page: pageNum })}
                      disabled={finalIsLoading}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors shadow-md ${
                        pageNum === promptsData.pagination.currentPage
                          ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                          : 'bg-white/75 backdrop-blur-md text-gray-700 border-gray-400/60 hover:bg-white/85'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handleFiltersChange({ ...filters, page: filters.page! + 1 })}
                  disabled={!promptsData.pagination.hasNext || finalIsLoading}
                  className="px-3 py-2 text-sm bg-white/75 backdrop-blur-md border border-gray-400/60 rounded-md hover:bg-white/85 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  다음
                </button>
              </div>
            )}
          </div>

          {/* 오른쪽 배너 영역 */}
          <div className="hidden xl:block xl:w-80 flex-shrink-0">
            <BannerSection />
          </div>
        </div>
      </div>
    </div>
  )
} 