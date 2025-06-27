'use client'

import { useState, useEffect, ReactNode } from 'react'
import { X, User, FileText, Eye, Calendar, BarChart3, Tags, Copy, TrendingUp, Target, Award, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { PromptDetailModal } from './PromptDetailModal'
import { getUserDetailedPromptsAction, getUserActivityAnalysisAction } from '@/lib/actions'

interface UserDetailData {
  user: {
    id: string
    name?: string
    email?: string
    role: string
    isActive: boolean
    createdAt: string
    expiresAt?: string
    _count: {
      prompts: number
      tags: number
    }
  }
  prompts: Array<{
    id: string
    title: string
    content: string
    category: string
    subCategory?: string
    createdAt: string
    updatedAt: string
    viewCount: number
    copyCount: number
    tags: Array<{
      id: string
      name: string
    }>
  }>
  stats: {
    totalPrompts: number
    totalViews: number
    totalCopies: number
    categoriesUsed: number
    tagsUsed: number
    recentActivity: number
  }
  categoryDistribution: Record<string, number>
  recentPrompts: Array<any>
}

interface UserDetailModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName?: string
}

export function UserDetailModal({ isOpen, onClose, userId, userName }: UserDetailModalProps) {
  const [userDetail, setUserDetail] = useState<UserDetailData | null>(null)
  const [activityAnalysis, setActivityAnalysis] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isActivityLoading, setIsActivityLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview')
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [selectedPromptTitle, setSelectedPromptTitle] = useState<string | null>(null)
  const [isPromptDetailModalOpen, setIsPromptDetailModalOpen] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDetail()
    }
  }, [isOpen, userId])

  const loadUserDetail = async () => {
    setIsLoading(true)
    try {
      const result = await getUserDetailedPromptsAction(userId, '사용자별 프롬프트 분석')
      
      if (result.success) {
        setUserDetail(result.data)
        console.log('✅ 사용자 상세 정보 로딩 완료:', result.data)
      } else {
        showToast('사용자 정보를 불러오는데 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('사용자 상세 정보 로딩 에러:', error)
      showToast('데이터 로딩 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadActivityAnalysis = async () => {
    if (activityAnalysis) return // 이미 로딩된 경우 스킵
    
    setIsActivityLoading(true)
    try {
      const result = await getUserActivityAnalysisAction(userId, '사용자 활동 패턴 분석')
      
      if (result.success) {
        setActivityAnalysis(result.data)
      } else {
        showToast('활동 분석 정보를 불러오는데 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('사용자 활동 분석 로딩 에러:', error)
      showToast('활동 분석 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsActivityLoading(false)
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

  const getTrendBadge = (trend: string) => {
    const trendConfig = {
      strong_growth: { label: '급성장', color: 'bg-green-100 text-green-800', icon: '🚀' },
      growth: { label: '성장', color: 'bg-blue-100 text-blue-800', icon: '📈' },
      stable: { label: '안정', color: 'bg-yellow-100 text-yellow-800', icon: '📊' },
      decline: { label: '감소', color: 'bg-red-100 text-red-800', icon: '📉' }
    }
    
    const config = trendConfig[trend as keyof typeof trendConfig] || trendConfig.stable
    return (
      <Badge variant="outline" className={`${config.color} text-xs`}>
        {config.icon} {config.label}
      </Badge>
    )
  }

  const getConsistencyLevel = (score: number) => {
    if (score >= 80) return { label: '매우 일관적', color: 'text-green-600', icon: '🎯' }
    if (score >= 60) return { label: '일관적', color: 'text-blue-600', icon: '📊' }
    if (score >= 40) return { label: '보통', color: 'text-yellow-600', icon: '⚡' }
    return { label: '불규칙', color: 'text-red-600', icon: '🌊' }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF4500] rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                사용자 상세 분석
              </h2>
              <p className="text-gray-600">
                {userName || '사용자'} 프롬프트 현황
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

        {/* 탭 네비게이션 */}
        <div className="flex border-b bg-gray-50">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4500]"
          >
            <FileText className="h-4 w-4 mr-2" />
            프롬프트 개요
          </Button>
          <Button
            variant={activeTab === 'activity' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('activity')
              loadActivityAnalysis()
            }}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF4500]"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            활동 분석
          </Button>
        </div>

        {/* 모달 바디 */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-[#FF4500] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">사용자 데이터를 분석하고 있습니다...</p>
                  </div>
                </div>
              ) : userDetail ? (
            <div className="space-y-6">
              {/* 사용자 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>사용자 기본 정보</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">이름</p>
                      <p className="font-semibold">{userDetail.user.name || '이름 없음'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-semibold">{userDetail.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">상태</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={userDetail.user.isActive ? "default" : "secondary"}>
                          {userDetail.user.isActive ? '활성' : '비활성'}
                        </Badge>
                        <Badge variant="outline">{userDetail.user.role}</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">가입일</p>
                      <p className="font-semibold">{formatDate(userDetail.user.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 통계 카드 */}
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 text-[#FF4500] mx-auto mb-2" />
                    <p className="text-2xl font-bold">{userDetail.stats.totalPrompts}</p>
                    <p className="text-xs text-gray-600">총 프롬프트</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{userDetail.stats.totalViews}</p>
                    <p className="text-xs text-gray-600">총 조회수</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Copy className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{userDetail.stats.totalCopies}</p>
                    <p className="text-xs text-gray-600">총 복사수</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{userDetail.stats.categoriesUsed}</p>
                    <p className="text-xs text-gray-600">사용 카테고리</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Tags className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{userDetail.stats.tagsUsed}</p>
                    <p className="text-xs text-gray-600">사용 태그</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{userDetail.stats.recentActivity}</p>
                    <p className="text-xs text-gray-600">최근 30일</p>
                  </CardContent>
                </Card>
              </div>

              {/* 카테고리 분포 */}
              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(userDetail.categoryDistribution).map(([category, count]) => (
                      <Badge key={category} variant="outline" className="text-sm">
                        {category}: {count}개
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 프롬프트 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle>모든 프롬프트 ({userDetail.prompts.length}개)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {userDetail.prompts.map((prompt) => (
                      <div key={prompt.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{prompt.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {prompt.content.length > 150 
                                ? `${prompt.content.substring(0, 150)}...` 
                                : prompt.content
                              }
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                              <span className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {prompt.viewCount} 조회
                              </span>
                              <span className="flex items-center">
                                <Copy className="h-3 w-3 mr-1" />
                                {prompt.copyCount} 복사
                              </span>
                              <span>{formatDate(prompt.createdAt)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{prompt.category}</Badge>
                              {prompt.tags.map((tag) => (
                                <Badge key={tag.id} variant="secondary" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPrompt(prompt.id)
                                setSelectedPromptTitle(prompt.title)
                                setIsPromptDetailModalOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              상세 보기
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(prompt.content)}
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
            </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">사용자 정보를 불러올 수 없습니다.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <>
              {isActivityLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-[#FF4500] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">활동 데이터를 분석하고 있습니다...</p>
                  </div>
                </div>
              ) : activityAnalysis ? (
                <div className="space-y-6">
                  {/* 활동 패턴 분석 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>활동 패턴 분석</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">활동 상태</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={activityAnalysis.activityPattern.isActiveUser ? "default" : "secondary"}>
                              {activityAnalysis.activityPattern.isActiveUser ? '활성 사용자' : '비활성 사용자'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-2">성장 트렌드</p>
                          {getTrendBadge(activityAnalysis.activityPattern.growthTrend)}
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-2">일관성 점수</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold">
                              {Math.round(activityAnalysis.activityPattern.consistencyScore)}
                            </span>
                            <span className={`text-sm ${getConsistencyLevel(activityAnalysis.activityPattern.consistencyScore).color}`}>
                              {getConsistencyLevel(activityAnalysis.activityPattern.consistencyScore).icon} {getConsistencyLevel(activityAnalysis.activityPattern.consistencyScore).label}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 mb-2">참여도</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold">
                              {Math.round(activityAnalysis.activityPattern.engagementRate)}%
                            </span>
                            <span className="text-xs text-gray-500">복사/조회 비율</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 최근 활동 요약 */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Zap className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{activityAnalysis.recentActivity.last7Days}</p>
                        <p className="text-xs text-gray-600">최근 7일</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{activityAnalysis.recentActivity.last30Days}</p>
                        <p className="text-xs text-gray-600">최근 30일</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{activityAnalysis.recentActivity.last90Days}</p>
                        <p className="text-xs text-gray-600">최근 90일</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 카테고리별 성과 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>카테고리별 성과</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                                                                          {activityAnalysis.categoryStats.map((stat: any, index: number) => (
                           <div key={`${stat.category}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-semibold">{stat.category}</p>
                              <p className="text-sm text-gray-600">{stat.count}개 프롬프트</p>
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

                  {/* 인기 프롬프트 TOP 5 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>🏆 인기 프롬프트 TOP 5</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {activityAnalysis.topPrompts.slice(0, 5).map((prompt: any, index: number) => (
                          <div key={prompt.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                            <div className="flex-shrink-0">
                              <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                                #{index + 1}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{prompt.title}</h4>
                              <p className="text-xs text-gray-500">{prompt.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-blue-600">{prompt.viewCount} 조회</p>
                              <p className="text-sm text-green-600">{prompt.copyCount} 복사</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 태그 사용 분석 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>태그 사용 빈도</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(activityAnalysis.tagFrequency)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 15)
                          .map(([tag, count]) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag} ({String(count)})
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">활동 분석 정보를 불러올 수 없습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* 프롬프트 상세 모달 */}
      {selectedPrompt && (
        <PromptDetailModal
          isOpen={isPromptDetailModalOpen}
          onClose={() => {
            setIsPromptDetailModalOpen(false)
            setSelectedPrompt(null)
            setSelectedPromptTitle(null)
          }}
          promptId={selectedPrompt}
          promptTitle={selectedPromptTitle || undefined}
        />
      )}
    </div>
  )
} 