'use client'

import { memo, useCallback, useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { getCategoryIcon } from '@/lib/category-icons'
import { PromptFilters } from '@/lib/types'
import { cn } from '@/lib/utils'
// import { useDebouncedCallback } from 'use-debounce' - 직접 구현으로 대체

interface FilterSidebarProps {
  filters: PromptFilters
  onFiltersChange: (filters: PromptFilters) => void
  categories: string[]
  tags: string[]
}

// 카테고리 한글 매핑 - 실제 사용되는 카테고리만 유지
const categoryLabels: Record<string, string> = {
  'real_estate': '부동산',
  'coding': '코딩',
  'general': '일반',
  'writing': '글쓰기'
}

// 카테고리 표시명을 가져오는 함수
const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category
}

export default memo(function FilterSidebar({
  filters,
  onFiltersChange,
  categories,
  tags
}: FilterSidebarProps) {
  console.log('🎛️ FilterSidebar 렌더링:', { 
    categories: categories.length, 
    tags: tags.length, 
    currentFilters: filters 
  })

  // 로컬 검색 상태 - 자동 검색 기능
  const [localQuery, setLocalQuery] = useState(filters.query || '')
  const [isTyping, setIsTyping] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 검색 실행 함수
  const executeSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim()
    console.log('🔍 자동 검색 실행:', { 검색어: trimmedQuery })
    
    setIsTyping(false) // 검색 완료 시 타이핑 상태 해제
    onFiltersChange({ 
      ...filters, 
      query: trimmedQuery || undefined, 
      page: 1 
    })
  }, [filters, onFiltersChange])

  // 수동 검색 실행 함수 (검색 버튼용)
  const handleSearchSubmit = useCallback(() => {
    // 기존 타이머 클리어 (즉시 검색)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    executeSearch(localQuery)
  }, [localQuery, executeSearch])

  // 타이핑 처리 함수 (1.5초 디바운스)
  const handleQueryChange = useCallback((newValue: string) => {
    console.log('⌨️ 검색어 입력:', { 이전: localQuery, 새값: newValue })
    
    setLocalQuery(newValue)
    setIsTyping(newValue.trim().length > 0)
    
    // 기존 타이머 클리어
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 1.5초 후 자동 검색 실행
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(newValue)
    }, 1500)
  }, [localQuery, executeSearch])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // 외부 필터 변경 시 로컬 상태 동기화 - 무한 루프 방지
  useEffect(() => {
    const externalQuery = filters.query || ''
    console.log('🔄 외부 쿼리 동기화 확인:', { 외부: externalQuery, 현재로컬: localQuery })
    setLocalQuery(externalQuery)
  }, [filters.query]) // localQuery 의존성 제거로 무한 루프 방지

  const handleCategoryChange = useCallback((category: string) => {
    console.log('📁 카테고리 변경 시도:', { 
      클릭한_카테고리: category, 
      현재_선택된_카테고리: filters.category,
      동일한가: filters.category === category
    })
    
    const newCategory = filters.category === category ? undefined : category
    console.log('📁 새 카테고리 설정:', newCategory)
    
    const newFilters = { 
      ...filters, 
      category: newCategory,
      page: 1 
    }
    
    console.log('📁 카테고리 필터 변경 완료:', newFilters)
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const handleTagChange = useCallback((tag: string) => {
    console.log('🏷️ 태그 변경 시도:', { 
      클릭한_태그: tag, 
      현재_선택된_태그들: filters.tags,
      이미_선택됨: filters.tags?.includes(tag)
    })
    
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    
    console.log('🏷️ 새 태그 목록:', newTags)
    
    const newFilters = { 
      ...filters, 
      tags: newTags.length > 0 ? newTags : undefined, 
      page: 1 
    }
    
    console.log('🏷️ 태그 필터 변경 완료:', newFilters)
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const clearFilters = useCallback(() => {
    console.log('🧹 모든 필터 초기화')
    setLocalQuery('')
    onFiltersChange({ page: 1 })
  }, [onFiltersChange])

  const hasActiveFilters = !!(filters.query || filters.category || (filters.tags && filters.tags.length > 0))

  return (
    <Card className="h-fit bg-white/75 backdrop-blur-md border-white/30 shadow-xl shadow-blue-200/60">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">필터</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 검색 - 자동 검색 기능 */}
        <div className="space-y-2">
          <Label htmlFor="search">검색</Label>
          <Input
            id="search"
            placeholder="프롬프트 검색..."
            value={localQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="focus:border-[#000080] focus:ring-[#000080]/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit()
              }
            }}
          />
          
          {/* 타이핑 중 표시 */}
          {isTyping && localQuery.trim() && (
            <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
              ⏳ 타이핑 중... (1.5초 후 자동 검색)
            </p>
          )}
          
          {/* 검색 결과 표시 */}
          {filters.query && !isTyping && (
            <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
              🔍 "{filters.query}" 검색 결과
            </p>
          )}
        </div>

        {/* 카테고리 */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <Label>카테고리 ({categories.length}개)</Label>
            <div className="space-y-2">
              {categories.map((category) => {
                const CategoryIcon = getCategoryIcon(category)
                const isSelected = filters.category === category
                
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={cn(
                      "w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors",
                      isSelected
                        ? "bg-[#FF4500] text-white"
                        : "text-gray-700 hover:bg-gray-100 border border-gray-200"
                    )}
                  >
                    <CategoryIcon className="h-4 w-4" />
                    <span className="text-sm">{getCategoryLabel(category)}</span>
                    {isSelected && (
                      <span className="ml-auto text-xs">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 태그 - 항상 표시하되 태그가 없으면 안내 메시지 */}
        <div className="space-y-3">
          <Label>태그 ({tags.length}개)</Label>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = filters.tags?.includes(tag) || false
                
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected
                        ? "bg-[#000080] text-white hover:bg-[#000080]/90"
                        : "hover:bg-[#000080]/10 hover:text-[#000080] border-gray-300"
                    )}
                    onClick={() => handleTagChange(tag)}
                  >
                    {tag}
                    {isSelected && <span className="ml-1">✓</span>}
                  </Badge>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 bg-gray-50 px-2 py-2 rounded border">
              아직 생성된 태그가 없습니다.
            </p>
          )}
        </div>

        {/* 현재 활성 필터 표시 */}
        {hasActiveFilters && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <Label>활성 필터</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs px-2 py-1 h-6"
              >
                초기화
              </Button>
            </div>
            <div className="space-y-2">
              {filters.query && (
                <div className="flex items-center justify-between text-sm bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  <span>🔍 검색: "{filters.query}"</span>
                </div>
              )}
              {filters.category && (
                <div className="flex items-center justify-between text-sm bg-orange-50 px-2 py-1 rounded border border-orange-200">
                  <span>📁 카테고리: {getCategoryLabel(filters.category)}</span>
                </div>
              )}
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex items-center justify-between text-sm bg-purple-50 px-2 py-1 rounded border border-purple-200">
                  <span>🏷️ 태그: {filters.tags.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}) 