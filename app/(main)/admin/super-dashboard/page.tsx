'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, Users, FileText, Activity, Database, Eye, AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { UserDetailModal } from '@/components/features/admin/UserDetailModal'
import { AdvancedSearchModal } from '@/components/features/admin/AdvancedSearchModal'
import { 
  getAllUsersPromptsAction, 
  getAllUsersAction, 
  getAdminAccessLogsAction,
  isSuperAdminAction 
} from '@/lib/actions'

interface SuperAdminStats {
  totalUsers: number
  totalPrompts: number
  totalConsents: number
  totalAccessLogs: number
}

interface UserData {
  id: string
  name?: string
  email?: string
  role: string
  isActive: boolean
  createdAt: string
  expiresAt?: string
  _count: {
    prompts: number
    consents: number
  }
}

interface PromptData {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  user: {
    name?: string
    email?: string
  }
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'prompts' | 'logs'>('overview')
  
  const [stats, setStats] = useState<SuperAdminStats>({
    totalUsers: 0,
    totalPrompts: 0,
    totalConsents: 0,
    totalAccessLogs: 0
  })
  
  const [users, setUsers] = useState<UserData[]>([])
  const [prompts, setPrompts] = useState<PromptData[]>([])
  const [accessLogs, setAccessLogs] = useState<any[]>([])
  
  // 사용자 상세 모달 상태
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null)
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false)
  
  // 고급 검색 모달 상태
  const [isAdvancedSearchModalOpen, setIsAdvancedSearchModalOpen] = useState(false)

  // 슈퍼 관리자 권한 확인
  useEffect(() => {
    checkSuperAdminAccess()
  }, [session, status])

  const checkSuperAdminAccess = async () => {
    if (status === 'loading') return
    
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    
    try {
      const result = await isSuperAdminAction()
      
             if (result.success && result.isSuperAdmin) {
         setIsAuthorized(true)
         await loadDashboardData()
       } else {
        showToast('슈퍼 관리자 권한이 필요합니다.', 'error')
        router.push('/admin')
      }
    } catch (error) {
      console.error('슈퍼 관리자 권한 확인 실패:', error)
      showToast('권한 확인 중 오류가 발생했습니다.', 'error')
      router.push('/admin')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      console.log('📊 슈퍼 관리자 대시보드 데이터 로딩 시작')
      
      // 병렬로 데이터 로드
      const [usersResult, promptsResult, logsResult] = await Promise.all([
        getAllUsersAction(),
        getAllUsersPromptsAction(),
        getAdminAccessLogsAction()
      ])
      
      if (usersResult.success) {
        setUsers(usersResult.data || [])
        console.log(`👥 전체 사용자 로딩: ${usersResult.data?.length || 0}명`)
      }
      
      if (promptsResult.success) {
        setPrompts(promptsResult.data || [])
        console.log(`📝 전체 프롬프트 로딩: ${promptsResult.data?.length || 0}개`)
      }
      
      if (logsResult.success) {
        setAccessLogs(logsResult.data || [])
        console.log(`📋 접근 로그 로딩: ${logsResult.data?.length || 0}개`)
      }
      
      // 통계 계산
      setStats({
        totalUsers: usersResult.data?.length || 0,
        totalPrompts: promptsResult.data?.length || 0,
        totalConsents: usersResult.data?.reduce((sum, user) => sum + (user._count?.consents || 0), 0) || 0,
        totalAccessLogs: logsResult.data?.length || 0
      })
      
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error)
      showToast('데이터 로딩 중 오류가 발생했습니다.', 'error')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#FF4500] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">슈퍼 관리자 권한을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">슈퍼 관리자 대시보드</h1>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            최고 권한
          </Badge>
        </div>
        <p className="text-gray-600">
          모든 사용자 데이터에 대한 완전한 접근 권한을 가지고 있습니다.
        </p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">⚠️ 법적 고지</p>
              <p>모든 접근 활동은 <strong>자동으로 기록</strong>되며, 교육 목적 외의 사용은 금지됩니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              활성 사용자 포함
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 프롬프트</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrompts}</div>
            <p className="text-xs text-muted-foreground">
              모든 사용자 합계
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">동의 기록</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsents}</div>
            <p className="text-xs text-muted-foreground">
              법적 동의 완료
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">접근 로그</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccessLogs}</div>
            <p className="text-xs text-muted-foreground">
              관리자 접근 기록
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 mb-8">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          개요
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
        >
          사용자 관리
        </Button>
        <Button
          variant={activeTab === 'prompts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('prompts')}
        >
          프롬프트 관리
        </Button>
        <Button
          variant={activeTab === 'logs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('logs')}
        >
          접근 로그
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsAdvancedSearchModalOpen(true)}
          className="ml-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-none hover:from-purple-600 hover:to-indigo-600"
        >
          <Search className="h-4 w-4 mr-2" />
          고급 검색
        </Button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>시스템 개요</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">활성 사용자 현황</h3>
                  <p className="text-sm text-gray-600">
                    총 {users.filter(u => u.isActive).length}명의 활성 사용자가 있습니다.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">프롬프트 활동</h3>
                  <p className="text-sm text-gray-600">
                    전체 {stats.totalPrompts}개의 프롬프트가 생성되었습니다.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">법적 보호 상태</h3>
                  <p className="text-sm text-gray-600">
                    모든 사용자로부터 {stats.totalConsents}건의 동의를 받았습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>전체 사용자 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{user.name || '이름 없음'}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? '활성' : '비활성'}
                        </Badge>
                        <Badge variant="outline">{user.role}</Badge>
                        <span className="text-xs text-gray-500">
                          프롬프트 {user._count?.prompts || 0}개
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUserId(user.id)
                        setSelectedUserName(user.name || user.email || '사용자')
                        setIsUserDetailModalOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      상세 보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'prompts' && (
        <Card>
          <CardHeader>
            <CardTitle>전체 프롬프트 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prompts.slice(0, 20).map((prompt) => (
                <div key={prompt.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{prompt.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {prompt.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{prompt.category}</Badge>
                        <span className="text-xs text-gray-500">
                          작성자: {prompt.user?.name || prompt.user?.email || '알 수 없음'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: 프롬프트 상세 정보 모달 구현
                        showToast('프롬프트 상세 정보 기능 준비 중입니다.', 'info')
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      보기
                    </Button>
                  </div>
                </div>
              ))}
              {prompts.length > 20 && (
                <p className="text-center text-gray-500 text-sm">
                  {prompts.length - 20}개 더 있습니다. (페이지네이션 기능 준비 중)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>관리자 접근 로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accessLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  접근 로그가 없습니다.
                </p>
              ) : (
                accessLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{log.action}</h3>
                        <p className="text-sm text-gray-600">
                          관리자: {log.admin?.name || log.admin?.email || '알 수 없음'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {log.reason || '사유 없음'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 사용자 상세 모달 */}
      {selectedUserId && (
        <UserDetailModal
          isOpen={isUserDetailModalOpen}
          onClose={() => {
            setIsUserDetailModalOpen(false)
            setSelectedUserId(null)
            setSelectedUserName(null)
          }}
          userId={selectedUserId}
          userName={selectedUserName || undefined}
        />
      )}
      
      {/* 고급 검색 모달 */}
      <AdvancedSearchModal
        isOpen={isAdvancedSearchModalOpen}
        onClose={() => setIsAdvancedSearchModalOpen(false)}
      />
    </div>
  )
} 