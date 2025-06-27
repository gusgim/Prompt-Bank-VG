'use client'

import { useEffect, useState } from 'react'
import { 
  getPromptStatsAction, 
  getCategoryStatsAction, 
  getMonthlyStatsAction, 
  getTagStatsAction 
} from '@/lib/actions'
import { PromptStats, CategoryStat, MonthlyStat, TagStat } from '@/lib/types'
import StatsCard from './StatsCard'
import CategoryChart from './CategoryChart'
import MonthlyChart from './MonthlyChart'
import TagCloud from './TagCloud'

export default function DashboardContainer() {
  const [stats, setStats] = useState<PromptStats | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([])
  const [tagStats, setTagStats] = useState<TagStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        
        // 모든 통계 데이터를 병렬로 로드
        const [
          promptStats,
          categoryData,
          monthlyData,
          tagData
        ] = await Promise.all([
          getPromptStatsAction(),
          getCategoryStatsAction(),
          getMonthlyStatsAction(),
          getTagStatsAction()
        ])

        setStats(promptStats)
        setCategoryStats(categoryData)
        setMonthlyStats(monthlyData)
        setTagStats(tagData)
      } catch (err) {
        console.error('대시보드 데이터 로드 에러:', err)
        setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        {/* 로딩 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/75 backdrop-blur-md rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/75 backdrop-blur-md rounded-lg shadow-lg p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white/75 backdrop-blur-md rounded-lg shadow-lg p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-semibold">오류 발생</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* KPI 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="총 프롬프트"
          value={stats?.totalPrompts || 0}
          icon="📝"
          color="blue"
        />
        <StatsCard
          title="카테고리"
          value={stats?.totalCategories || 0}
          icon="📂"
          color="green"
        />
        <StatsCard
          title="태그"
          value={stats?.totalTags || 0}
          icon="🏷️"
          color="purple"
        />
        <StatsCard
          title="이번 달"
          value={stats?.thisMonthPrompts || 0}
          icon="📈"
          color="orange"
        />
      </div>

      {/* 차트들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 카테고리 분포 차트 */}
        <div className="bg-white/75 backdrop-blur-md rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            카테고리 분포
          </h2>
          <CategoryChart data={categoryStats} />
        </div>

        {/* 월별 활동 차트 */}
        <div className="bg-white/75 backdrop-blur-md rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📈</span>
            월별 활동
          </h2>
          <MonthlyChart data={monthlyStats} />
        </div>
      </div>

      {/* 태그 클라우드 */}
      <div className="bg-white/75 backdrop-blur-md rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🏷️</span>
          인기 태그
        </h2>
        <TagCloud data={tagStats} />
      </div>
    </div>
  )
} 