'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Plus, User, LogOut, Settings, BarChart3, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { NoticeDropdown } from '@/components/features/notices/NoticeDropdown'
import { NotificationBell } from '@/components/features/admin/NotificationBell'

export function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { showToast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/auth/signin' })
      showToast('로그아웃되었습니다.', 'success')
    } catch (error) {
      showToast('로그아웃 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleForceSignOut = async () => {
    try {
      // 강제 세션 초기화: 모든 쿠키 및 로컬 스토리지 정리
      document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      localStorage.clear()
      sessionStorage.clear()
      
      await signOut({ callbackUrl: '/auth/signin' })
      showToast('세션이 강제 초기화되었습니다.', 'success')
    } catch (error) {
      showToast('세션 초기화 중 오류가 발생했습니다.', 'error')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-14 items-center justify-between px-6">
        <div className="flex">
          <Link href="/prompts" className="flex flex-col items-start">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              Prompt Bank
            </span>
            <span className="text-sm font-extrabold text-[#FF4500] -mt-1 tracking-wide">
              By AI SQUARE
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-lg" />
          ) : session ? (
            <>
              {/* 관리자만 알림 벨 표시 */}
              {session?.user?.role === 'ADMIN' && (
                <NotificationBell />
              )}

              {/* 대시보드 버튼 */}
              <Link
                href="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-medium ${
                  pathname === '/dashboard'
                    ? 'bg-[#FF4500] text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>대시보드</span>
              </Link>

              {/* 분석 버튼 */}
              <Link
                href="/analytics"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors font-medium ${
                  pathname === '/analytics'
                    ? 'bg-[#FF4500] text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>분석</span>
              </Link>

              {/* 공지사항 드롭다운 */}
              <NoticeDropdown />

              {/* 새 프롬프트 버튼 */}
              <Link
                href="/prompts/new"
                className="flex items-center space-x-2 px-4 py-2 bg-[#000080] text-white rounded-lg hover:bg-[#000080]/90 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>New Prompt</span>
              </Link>

              {/* 관리자 버튼 (관리자만 표시) */}
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>관리자</span>
                </Link>
              )}

              {/* 사용자 정보 및 로그아웃 */}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {session.user.name || session.user.email}
                  </span>
                  {session.user.role === 'ADMIN' && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-[#FF4500] text-white rounded-full font-medium">
                      관리자
                    </span>
                  )}
                </div>
                
                {/* 개발 환경에서만 강제 로그아웃 버튼 표시 */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={handleForceSignOut}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-xs border border-red-200"
                    title="강제 세션 초기화 (개발용)"
                  >
                    Reset
                  </button>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <User className="h-4 w-4" />
              <span>로그인</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
} 