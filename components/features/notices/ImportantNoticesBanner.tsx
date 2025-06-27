'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getImportantNoticesAction, incrementNoticeViewAction } from '@/lib/actions'

interface ImportantNotice {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
}

export function ImportantNoticesBanner() {
  const [notices, setNotices] = useState<ImportantNotice[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // 중요 공지사항 로딩
  useEffect(() => {
    const loadImportantNotices = async () => {
      try {
        const result = await getImportantNoticesAction()
        if (result.success && result.data) {
          setNotices(result.data)
        }
      } catch (error) {
        console.error('중요 공지사항 로딩 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadImportantNotices()
  }, [])

  // 자동 슬라이드 (5초마다)
  useEffect(() => {
    if (notices.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [notices.length])

  // 공지사항 조회수 증가
  const handleNoticeView = async (noticeId: string) => {
    try {
      await incrementNoticeViewAction(noticeId)
    } catch (error) {
      console.error('조회수 증가 실패:', error)
    }
  }

  // 이전/다음 공지사항
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length)
  }

  // 배너 닫기
  const handleClose = () => {
    setIsVisible(false)
    // 로컬 스토리지에 닫힌 상태 저장 (세션 동안 유지)
    sessionStorage.setItem('importantNoticesClosed', 'true')
  }

  // 세션 스토리지에서 닫힌 상태 확인
  useEffect(() => {
    const isClosed = sessionStorage.getItem('importantNoticesClosed')
    if (isClosed === 'true') {
      setIsVisible(false)
    }
  }, [])

  // 카테고리 색상 가져오기
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'bg-red-50 border-red-200 text-red-800'
      case 'maintenance': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'update': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'urgent': return '긴급'
      case 'maintenance': return '점검'
      case 'update': return '업데이트'
      default: return '공지'
    }
  }

  if (isLoading || !isVisible || notices.length === 0) {
    return null
  }

  const currentNotice = notices[currentIndex]

  return (
    <div className="relative mb-6 overflow-hidden">
      {/* 메인 배너 */}
      <div 
        className={`relative p-4 rounded-xl shadow-sm border ${getCategoryColor(currentNotice.category)} backdrop-blur-sm transition-all duration-300 cursor-pointer ${
          isHovered ? 'shadow-lg scale-[1.02]' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleNoticeView(currentNotice.id)}
      >
        {/* 배경 그라데이션 효과 */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-70' : 'opacity-50'
        }`}></div>
        
        {/* 호버 시 미리보기 툴팁 */}
        {isHovered && currentNotice.content && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full z-50 w-80 max-w-sm">
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 p-4 text-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-semibold text-gray-600">📋 미리보기</span>
                <span className="text-xs text-gray-500">
                  {new Date(currentNotice.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <p className="text-sm leading-relaxed line-clamp-4">
                {currentNotice.content}
              </p>
              {/* 화살표 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/95"></div>
            </div>
          </div>
        )}
        
        {/* 닫기 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full hover:bg-white/20 transition-all duration-200 group z-10"
          title="공지사항 숨기기"
        >
          <X className="h-3 w-3 group-hover:scale-110 transition-transform" />
        </Button>

        <div className="flex items-center space-x-4 pr-10 relative z-10">
          {/* 공지사항 내용 */}
          <div className="flex-1 min-w-0">
            <div 
              className="flex items-center space-x-3 mb-1 cursor-pointer"
              onClick={() => handleNoticeView(currentNotice.id)}
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-gray-700 shadow-sm">
                📢 {getCategoryLabel(currentNotice.category)}
              </span>
              <h3 className="font-bold text-lg hover:underline decoration-2 underline-offset-2 transition-all duration-200 leading-tight flex-1">
                {currentNotice.title}
              </h3>
              <span className="text-xs font-medium opacity-70 flex-shrink-0">
                {new Date(currentNotice.createdAt).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            {/* 하단 네비게이션 */}
            {notices.length > 1 && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePrevious()
                    }}
                    className="h-7 w-7 p-0 rounded-full hover:bg-white/20 transition-all duration-200"
                    title="이전 공지사항"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNext()
                    }}
                    className="h-7 w-7 p-0 rounded-full hover:bg-white/20 transition-all duration-200"
                    title="다음 공지사항"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
                
                <span className="text-xs font-medium opacity-70 bg-white/20 px-2 py-0.5 rounded-full">
                  {currentIndex + 1} / {notices.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 진행 표시기 (여러 공지사항이 있을 때만) */}
      {notices.length > 1 && (
        <div className="flex space-x-2 mt-3 justify-center">
          {notices.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-current opacity-100 shadow-sm' 
                  : 'w-2 bg-current opacity-40 hover:opacity-70'
              }`}
              title={`공지사항 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  )
} 