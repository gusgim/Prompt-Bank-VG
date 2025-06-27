import { Eye, Copy, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { getUserAnalyticsAction } from '@/lib/actions'
import { getCategoryIcon } from '@/lib/category-icons'

export default async function AnalyticsPage() {
  const analytics = await getUserAnalyticsAction()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-200/80 to-indigo-300/90">
      <div className="absolute inset-0 opacity-20 bg-gray-200"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-[#FF4500]" />
            프롬프트 분석
          </h1>
          <p className="text-gray-600">
            나의 프롬프트 사용 패턴과 통계를 확인하세요
          </p>
        </div>

        {/* 전체 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/75 backdrop-blur-md border-white/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 프롬프트</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalStats.totalPrompts}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur-md border-white/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 조회수</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalStats.totalViews}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/75 backdrop-blur-md border-white/40 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 복사 횟수</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalStats.totalCopies}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Copy className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 인기 프롬프트 (조회수) */}
          <Card className="bg-white/75 backdrop-blur-md border-white/40 shadow-lg">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-[#FF4500]" />
                가장 많이 본 프롬프트
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.topViewed.length > 0 ? (
                analytics.topViewed.map((prompt, index) => {
                  const CategoryIcon = getCategoryIcon(prompt.category)
                  return (
                    <div 
                      key={prompt.id} 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-[#FF4500] text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <CategoryIcon className="h-4 w-4 text-[#000080] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {prompt.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {prompt.category}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Eye className="h-3 w-3 mr-1" />
                        {prompt.viewCount}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-gray-500 py-8">
                  아직 조회된 프롬프트가 없습니다
                </p>
              )}
            </CardContent>
          </Card>

          {/* 인기 프롬프트 (복사수) */}
          <Card className="bg-white/75 backdrop-blur-md border-white/40 shadow-lg">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Copy className="h-5 w-5 mr-2 text-[#FF4500]" />
                가장 많이 복사한 프롬프트
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.topCopied.length > 0 ? (
                analytics.topCopied.map((prompt, index) => {
                  const CategoryIcon = getCategoryIcon(prompt.category)
                  return (
                    <div 
                      key={prompt.id} 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-[#FF4500] text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <CategoryIcon className="h-4 w-4 text-[#000080] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {prompt.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {prompt.category}
                        </p>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Copy className="h-3 w-3 mr-1" />
                        {prompt.copyCount}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-gray-500 py-8">
                  아직 복사된 프롬프트가 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 카테고리별 통계 */}
        <Card className="bg-white/75 backdrop-blur-md border-white/40 shadow-lg mt-8">
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">
              카테고리별 활동 통계
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.categoryStats.map((stat) => {
                const CategoryIcon = getCategoryIcon(stat.category)
                return (
                  <div 
                    key={stat.category}
                    className="p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <CategoryIcon className="h-5 w-5 text-[#000080]" />
                      <span className="font-medium text-gray-900">
                        {stat.category}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>프롬프트:</span>
                        <span className="font-medium">{stat.promptCount}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span>총 조회:</span>
                        <span className="font-medium">{stat.totalViews}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span>총 복사:</span>
                        <span className="font-medium">{stat.totalCopies}회</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        {analytics.recentActivity.length > 0 && (
          <Card className="bg-white/75 backdrop-blur-md border-white/40 shadow-lg mt-8">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-[#FF4500]" />
                최근 7일 활동
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        {(activity as any).lastViewed && (
                          <span>
                            마지막 조회: {new Date((activity as any).lastViewed).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                        {(activity as any).lastCopied && (
                          <span>
                            마지막 복사: {new Date((activity as any).lastCopied).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {(activity as any).viewCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        {(activity as any).copyCount || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 