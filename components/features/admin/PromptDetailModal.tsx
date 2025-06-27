'use client'

import { useState, useEffect } from 'react'
import { X, FileText, User, Calendar, Eye, Copy, Tags, BarChart3, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { getPromptDetailForAdminAction } from '@/lib/actions'

interface PromptDetailData {
  id: string
  title: string
  content: string
  category: string
  subCategory?: string
  createdAt: string
  updatedAt: string
  viewCount: number
  copyCount: number
  userId: string
  tags: Array<{
    id: string
    name: string
  }>
  user: {
    id: string
    name?: string
    email?: string
    role: string
  }
}

interface PromptDetailModalProps {
  isOpen: boolean
  onClose: () => void
  promptId: string
  promptTitle?: string
}

export function PromptDetailModal({ isOpen, onClose, promptId, promptTitle }: PromptDetailModalProps) {
  const [promptDetail, setPromptDetail] = useState<PromptDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (isOpen && promptId) {
      loadPromptDetail()
    }
  }, [isOpen, promptId])

  const loadPromptDetail = async () => {
    setIsLoading(true)
    try {
      const result = await getPromptDetailForAdminAction(promptId, '프롬프트 상세 내용 검토')
      
      if (result.success) {
        setPromptDetail(result.data)
        console.log('✅ 프롬프트 상세 정보 로딩 완료:', result.data)
      } else {
        showToast('프롬프트 정보를 불러오는데 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('프롬프트 상세 정보 로딩 에러:', error)
      showToast('데이터 로딩 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[95vh] overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF4500] rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                프롬프트 상세 분석
              </h2>
              <p className="text-gray-600">
                {promptTitle || '프롬프트'} 전체 내용
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

        {/* 모달 바디 */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-[#FF4500] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">프롬프트 데이터를 분석하고 있습니다...</p>
              </div>
            </div>
          ) : promptDetail ? (
            <div className="space-y-6">
              {/* 프롬프트 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>기본 정보</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">제목</p>
                        <h3 className="text-xl font-bold text-gray-900">{promptDetail.title}</h3>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">카테고리</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-sm">
                            {promptDetail.category}
                          </Badge>
                          {promptDetail.subCategory && (
                            <Badge variant="secondary" className="text-xs">
                              {promptDetail.subCategory}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">태그</p>
                        <div className="flex flex-wrap gap-2">
                          {promptDetail.tags.length > 0 ? (
                            promptDetail.tags.map((tag) => (
                              <Badge key={tag.id} variant="secondary" className="text-xs">
                                <Tags className="h-3 w-3 mr-1" />
                                {tag.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">태그 없음</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">작성자</p>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">
                            {promptDetail.user.name || promptDetail.user.email || '알 수 없음'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {promptDetail.user.role}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">생성일</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(promptDetail.createdAt)}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">수정일</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(promptDetail.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 성과 지표 */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold">{promptDetail.viewCount}</p>
                    <p className="text-sm text-gray-600">총 조회수</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <Copy className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold">{promptDetail.copyCount}</p>
                    <p className="text-sm text-gray-600">총 복사수</p>
                  </CardContent>
                </Card>
              </div>

              {/* 프롬프트 전체 내용 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>프롬프트 전체 내용</span>
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(promptDetail.content)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        전체 복사
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                      {promptDetail.content}
                    </pre>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      총 {promptDetail.content.length.toLocaleString()}자
                    </div>
                    <div className="flex space-x-4 text-xs text-gray-500">
                      <span>조회: {promptDetail.viewCount}회</span>
                      <span>복사: {promptDetail.copyCount}회</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 관리자 액션 */}
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-amber-800">관리자 전용 액션</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: 사용자 프로필로 이동
                        showToast('사용자 프로필 기능 준비 중입니다.', 'info')
                      }}
                      className="border-amber-300 hover:bg-amber-100"
                    >
                      <User className="h-4 w-4 mr-1" />
                      작성자 프로필
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: 프롬프트 관리 페이지로 이동
                        showToast('프롬프트 관리 기능 준비 중입니다.', 'info')
                      }}
                      className="border-amber-300 hover:bg-amber-100"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      관리 페이지
                    </Button>
                  </div>
                  
                  <p className="text-xs text-amber-700 mt-2">
                    ⚠️ 이 액션들은 관리자 접근 로그에 기록됩니다.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">프롬프트 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 