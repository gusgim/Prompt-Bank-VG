'use client'

import { useState, useEffect } from 'react'
import { X, Search, Filter, User, Calendar, Eye, Copy, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/components/ui/Toast'
import { advancedSearchAction, getAllUsersAction, getCategoriesAction } from '@/lib/actions'

interface AdvancedSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchFilters {
  searchTerm: string
  category: string
  userId: string
  dateFrom: string
  dateTo: string
  sortBy: 'latest' | 'oldest' | 'most_viewed' | 'most_copied'
  limit: number
}

export function AdvancedSearchModal({ isOpen, onClose }: AdvancedSearchModalProps) {
  const [searchResults, setSearchResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const { showToast } = useToast()

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'latest',
    limit: 50
  })

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  const loadInitialData = async () => {
    try {
      const [usersResult, categoriesResult] = await Promise.all([
        getAllUsersAction(),
        getCategoriesAction()
      ])
      
      if (usersResult.success) {
        setUsers(usersResult.data || [])
      }
      
      if (categoriesResult) {
        setCategories(categoriesResult)
      }
    } catch (error) {
      console.error('초기 데이터 로딩 에러:', error)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const result = await advancedSearchAction(filters)
      
      if (result.success) {
        setSearchResults(result.data)
        console.log('✅ 검색 완료:', result.data)
        showToast(`${result.data.summary.resultCount}개의 결과를 찾았습니다.`, 'success')
      } else {
        showToast('검색에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('검색 에러:', error)
      showToast('검색 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      category: '',
      userId: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'latest',
      limit: 50
    })
    setSearchResults(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('클립보드에 복사되었습니다.', 'success')
    } catch (error) {
      showToast('복사에 실패했습니다.', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportResults = () => {
    if (!searchResults?.results) return
    
    const csv = [
      ['제목', '카테고리', '작성자', '조회수', '복사수', '생성일'].join(','),
      ...searchResults.results.map((item: any) => [
        `"${item.title}"`,
        item.category,
        item.user?.name || item.user?.email || '알 수 없음',
        item.viewCount,
        item.copyCount,
        formatDate(item.createdAt)
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `search_results_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    showToast('검색 결과가 CSV 파일로 다운로드되었습니다.', 'success')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF4500] rounded-lg">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                고급 검색 및 분석
              </h2>
              <p className="text-gray-600">
                모든 사용자 데이터에서 실시간 검색
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-full">
          {/* 검색 필터 사이드바 */}
          <div className="w-80 bg-gray-50 border-r p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  검색 필터
                </h3>
              </div>

              {/* 텍스트 검색 */}
              <div>
                <Label htmlFor="searchTerm">키워드 검색</Label>
                <Input
                  id="searchTerm"
                  type="text"
                  placeholder="제목 또는 내용 검색..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  className="mt-1"
                />
              </div>

              {/* 카테고리 필터 */}
              <div>
                <Label htmlFor="category">카테고리</Label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="mt-1 w-full p-2 border rounded-md"
                >
                  <option value="">모든 카테고리</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* 사용자 필터 */}
              <div>
                <Label htmlFor="userId">작성자</Label>
                <select
                  id="userId"
                  value={filters.userId}
                  onChange={(e) => setFilters({...filters, userId: e.target.value})}
                  className="mt-1 w-full p-2 border rounded-md"
                >
                  <option value="">모든 사용자</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* 날짜 범위 */}
              <div>
                <Label>날짜 범위</Label>
                <div className="mt-1 space-y-2">
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    placeholder="시작일"
                  />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    placeholder="종료일"
                  />
                </div>
              </div>

              {/* 정렬 옵션 */}
              <div>
                <Label htmlFor="sortBy">정렬 기준</Label>
                <select
                  id="sortBy"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
                  className="mt-1 w-full p-2 border rounded-md"
                >
                  <option value="latest">최신순</option>
                  <option value="oldest">오래된순</option>
                  <option value="most_viewed">조회수 높은순</option>
                  <option value="most_copied">복사수 높은순</option>
                </select>
              </div>

              {/* 결과 제한 */}
              <div>
                <Label htmlFor="limit">표시할 결과 수</Label>
                <select
                  id="limit"
                  value={filters.limit}
                  onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
                  className="mt-1 w-full p-2 border rounded-md"
                >
                  <option value={25}>25개</option>
                  <option value={50}>50개</option>
                  <option value={100}>100개</option>
                  <option value={200}>200개</option>
                </select>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  검색 실행
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  필터 초기화
                </Button>
              </div>
            </div>
          </div>

          {/* 검색 결과 영역 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {searchResults ? (
              <div className="space-y-6">
                {/* 검색 요약 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>검색 결과 요약</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportResults}
                        disabled={!searchResults.results?.length}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        CSV 다운로드
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#FF4500]">
                          {searchResults.summary.resultCount}
                        </p>
                        <p className="text-sm text-gray-600">검색 결과</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {searchResults.summary.totalViews}
                        </p>
                        <p className="text-sm text-gray-600">총 조회수</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {searchResults.summary.totalCopies}
                        </p>
                        <p className="text-sm text-gray-600">총 복사수</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {searchResults.summary.uniqueUsers}
                        </p>
                        <p className="text-sm text-gray-600">관련 사용자</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 검색 결과 목록 */}
                <Card>
                  <CardHeader>
                    <CardTitle>검색 결과 ({searchResults.summary.resultCount}개)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {searchResults.results.map((item: any) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {item.content.length > 200 
                                  ? `${item.content.substring(0, 200)}...` 
                                  : item.content
                                }
                              </p>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {item.user?.name || item.user?.email || '알 수 없음'}
                                </span>
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {item.viewCount} 조회
                                </span>
                                <span className="flex items-center">
                                  <Copy className="h-3 w-3 mr-1" />
                                  {item.copyCount} 복사
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(item.createdAt)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{item.category}</Badge>
                                {item.tags?.slice(0, 3).map((tag: any) => (
                                  <Badge key={tag.id} variant="secondary" className="text-xs">
                                    {tag.name}
                                  </Badge>
                                ))}
                                {item.tags?.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(item.content)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                복사
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 카테고리 분포 */}
                {searchResults.categoryStats?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>카테고리별 분포</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {searchResults.categoryStats.map((stat: any) => (
                          <div key={stat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-semibold">{stat.category}</p>
                              <p className="text-sm text-gray-600">{stat.count}개</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-blue-600">{stat.totalViews} 조회</p>
                              <p className="text-sm text-green-600">{stat.totalCopies} 복사</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    고급 검색 시작
                  </h3>
                  <p className="text-gray-500 mb-6">
                    왼쪽 필터를 사용하여 원하는 데이터를 검색해보세요
                  </p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>💡 검색 팁:</p>
                    <p>• 키워드는 제목과 내용에서 동시에 검색됩니다</p>
                    <p>• 여러 필터를 조합하여 정확한 결과를 얻을 수 있습니다</p>
                    <p>• 결과는 CSV로 내보낼 수 있습니다</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 