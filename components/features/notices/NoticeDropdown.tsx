'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getRecentNoticesAction, incrementNoticeViewAction } from '@/lib/actions'

interface RecentNotice {
  id: string
  title: string
  category: string
  isImportant: boolean
  createdAt: string
}

export function NoticeDropdown() {
  const [notices, setNotices] = useState<RecentNotice[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 최근 공지사항 로딩
  useEffect(() => {
    const loadRecentNotices = async () => {
      try {
        const result = await getRecentNoticesAction(5)
        if (result.success && result.data) {
          setNotices(result.data)
        }
      } catch (error) {
        console.error('최근 공지사항 로딩 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecentNotices()
  }, [])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 공지사항 클릭 시 조회수 증가
  const handleNoticeClick = async (noticeId: string) => {
    try {
      await incrementNoticeViewAction(noticeId)
      setIsOpen(false)
    } catch (error) {
      console.error('조회수 증가 실패:', error)
    }
  }

  // 카테고리 색상 가져오기
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-orange-100 text-orange-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'urgent': return '긴급'
      case 'maintenance': return '점검'
      case 'update': return '업데이트'
      default: return '일반'
    }
  }

  // 새로운 공지사항이 있는지 확인 (7일 이내)
  const hasNewNotices = notices.some(notice => {
    const noticeDate = new Date(notice.createdAt)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return noticeDate > weekAgo
  })

  if (isLoading || notices.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 공지사항 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center space-x-1 text-gray-600 hover:text-gray-900"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden sm:inline">공지사항</span>
        <ChevronDown className="h-3 w-3" />
        
        {/* 새 공지사항 표시 */}
        {hasNewNotices && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        )}
      </Button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">최근 공지사항</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notices.map((notice) => (
              <button
                key={notice.id}
                onClick={() => handleNoticeClick(notice.id)}
                className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {notice.isImportant && (
                      <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(notice.category)}`}>
                      {getCategoryLabel(notice.category)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed">
                  {notice.title}
                </h4>
              </button>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false)
                // 공지사항 전체 페이지로 이동 (추후 구현)
                console.log('공지사항 전체 페이지로 이동')
              }}
              className="w-full text-center text-gray-600 hover:text-gray-900"
            >
              전체 공지사항 보기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 