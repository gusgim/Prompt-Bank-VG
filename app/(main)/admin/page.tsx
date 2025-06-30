'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { BannerManagement } from '@/components/features/admin/BannerManagement'
import { NoticeManagement } from '@/components/features/admin/NoticeManagement'
// Debug logging removed for simplicity

interface InviteCode {
  id: string
  code: string
  email?: string
  isUsed: boolean
  usedBy?: string
  usedAt?: string
  expiresAt: string
  createdAt: string
  createdBy: {
    name?: string
    email?: string
  }
}

interface User {
  id: string
  name?: string
  email?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  expiresAt?: string
  deactivatedAt?: string
  deactivatedBy?: string
  createdAt: string
  _count: {
    prompts: number
    tags: number
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'invites' | 'users' | 'banners' | 'notices'>('invites')
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    expiresInDays: 30
  })
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // 관리자 권한 확인
  useEffect(() => {
    console.log('👤 관리자 페이지 접근 - 세션 상태:', { status, user: session?.user })
    
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      console.log('❌ 관리자 권한 없음, 메인 페이지로 이동')
      router.push('/')
      return
    }
    
    console.log('✅ 관리자 권한 확인됨, 데이터 로딩 시작')
    fetchInviteCodes()
    fetchUsers()
  }, [session, status, router])

  const fetchInviteCodes = async () => {
    try {
      console.log('📋 초대 코드 목록 요청 시작')
      const response = await fetch('/api/admin/invite-codes')
      
      console.log('📋 초대 코드 응답 상태:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 초대 코드 목록 로딩 성공:', data.inviteCodes?.length || 0, '개')
        setInviteCodes(data.inviteCodes || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: '응답 파싱 실패' }))
        console.error('❌ 초대 코드 목록 로딩 실패:', errorData)
        showToast(`초대 코드 목록을 불러오는데 실패했습니다: ${errorData.error || '알 수 없는 오류'}`, 'error')
      }
    } catch (error) {
      console.error('💥 초대 코드 목록 요청 중 예외:', error)
      showToast('초대 코드 목록을 불러오는데 실패했습니다.', 'error')
    }
  }

  const fetchUsers = async () => {
    try {
      console.log('👥 사용자 목록 요청 시작')
      const response = await fetch('/api/admin/users')
      
      console.log('👥 사용자 응답 상태:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 사용자 목록 로딩 성공:', data.users?.length || 0, '개')
        setUsers(data.users || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: '응답 파싱 실패' }))
        console.error('❌ 사용자 목록 로딩 실패:', errorData)
        showToast(`사용자 목록을 불러오는데 실패했습니다: ${errorData.error || '알 수 없는 오류'}`, 'error')
      }
    } catch (error) {
      console.error('💥 사용자 목록 요청 중 예외:', error)
      showToast('사용자 목록을 불러오는데 실패했습니다.', 'error')
    }
  }

  const handleCreateInviteCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('🎫 초대 코드 생성 요청:', formData)
      
      const response = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('🎫 초대 코드 생성 응답 상태:', response.status)
      const data = await response.json()
      console.log('🎫 초대 코드 생성 응답 데이터:', data)

      if (response.ok) {
        showToast('초대 코드가 생성되었습니다!', 'success')
        setFormData({ email: '', expiresInDays: 30 })
        fetchInviteCodes()
      } else {
        showToast(data.error || '초대 코드 생성에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('💥 초대 코드 생성 중 예외:', error)
      showToast('초대 코드 생성 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('클립보드에 복사되었습니다!', 'success')
    })
  }

  const handleUserAction = async (userId: string, action: string, expiresAt?: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, expiresAt }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast(data.message, 'success')
        fetchUsers()
      } else {
        showToast(data.error || '작업에 실패했습니다.', 'error')
      }
    } catch (error) {
      showToast('작업 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        showToast(data.message, 'success')
        fetchUsers()
      } else {
        showToast(data.error || '삭제에 실패했습니다.', 'error')
      }
    } catch (error) {
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    })
  }

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {}
    })
  }

  const isRecentUser = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  }

  // 테스트 알림 생성
  const handleCreateTestNotification = async () => {
    try {
      const response = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        showToast('테스트 알림이 생성되었습니다!', 'success')
      } else {
        showToast(data.error || '테스트 알림 생성에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('테스트 알림 생성 중 오류:', error)
      showToast('테스트 알림 생성 중 오류가 발생했습니다.', 'error')
    }
  }

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">관리자 페이지</h1>
        {(session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') && (
          <Button
            variant="outline"
            onClick={() => router.push('/admin/super-dashboard')}
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          >
            🛡️ 슈퍼 관리자 대시보드
          </Button>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-4 mb-6">
        <Button variant={activeTab === 'invites' ? 'default' : 'ghost'} onClick={() => setActiveTab('invites')}>초대 코드 관리</Button>
        <Button variant={activeTab === 'users' ? 'default' : 'ghost'} onClick={() => setActiveTab('users')}>사용자 관리</Button>
        <Button variant={activeTab === 'banners' ? 'default' : 'ghost'} onClick={() => setActiveTab('banners')}>배너 관리</Button>
        <Button variant={activeTab === 'notices' ? 'default' : 'ghost'} onClick={() => setActiveTab('notices')}>공지사항 관리</Button>
      </div>

      {/* 테스트 도구 */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">개발 테스트 도구</h3>
        <Button
          onClick={handleCreateTestNotification}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm"
          size="sm"
        >
          🔔 테스트 알림 생성
        </Button>
      </div>

      {/* 초대 코드 관리 탭 */}
      {activeTab === 'invites' && (
        <>
          {/* 초대 코드 생성 */}
          <Card className="mb-8">
        <CardHeader>
          <CardTitle>초대 코드 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInviteCode} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">특정 이메일 (선택사항)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="비워두면 누구나 사용 가능"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresInDays">만료일 (일)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) }))}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '생성 중...' : '초대 코드 생성'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 초대 코드 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>초대 코드 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inviteCodes.length === 0 ? (
              <p className="text-center text-muted-foreground">생성된 초대 코드가 없습니다.</p>
            ) : (
              inviteCodes.map((invite) => (
                <div key={invite.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-lg font-mono">
                        {invite.code}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(invite.code)}
                      >
                        복사
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      {invite.isUsed ? (
                        <Badge variant="secondary">사용됨</Badge>
                      ) : new Date(invite.expiresAt) < new Date() ? (
                        <Badge variant="destructive">만료됨</Badge>
                      ) : (
                        <Badge variant="default">활성</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    {invite.email && (
                      <p><strong>제한 이메일:</strong> {invite.email}</p>
                    )}
                    <p><strong>만료일:</strong> {new Date(invite.expiresAt).toLocaleDateString('ko-KR')}</p>
                    <p><strong>생성일:</strong> {new Date(invite.createdAt).toLocaleDateString('ko-KR')}</p>
                    {invite.isUsed && invite.usedBy && (
                      <p><strong>사용자:</strong> {invite.usedBy} ({new Date(invite.usedAt!).toLocaleDateString('ko-KR')})</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* 사용자 관리 탭 */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>사용자 관리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground">등록된 사용자가 없습니다.</p>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{user.name || '이름 없음'}</h3>
                        {isRecentUser(user.createdAt) && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 ml-1">최근</Badge>
                        )}
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? '활성' : '비활성'}
                        </Badge>
                        {user.expiresAt && new Date(user.expiresAt) <= new Date() && (
                          <Badge variant="destructive">만료됨</Badge>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {user.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openConfirmModal(
                              '계정 비활성화',
                              `${user.name}(${user.email}) 계정을 비활성화하시겠습니까?`,
                              () => handleUserAction(user.id, 'deactivate')
                            )}
                          >
                            비활성화
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'activate')}
                          >
                            활성화
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const expiresAt = prompt('만료일을 입력하세요 (YYYY-MM-DD):')
                            if (expiresAt) {
                              handleUserAction(user.id, 'setExpiration', expiresAt)
                            }
                          }}
                        >
                          만료일 설정
                        </Button>
                        
                        {user.expiresAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'removeExpiration')}
                          >
                            만료일 제거
                          </Button>
                        )}
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openConfirmModal(
                            '사용자 삭제',
                            `${user.name}(${user.email}) 계정을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
                            () => handleDeleteUser(user.id)
                          )}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>이메일:</strong> {user.email}</p>
                      <p><strong>가입일:</strong> {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
                      {user.expiresAt && (
                        <p><strong>만료일:</strong> {new Date(user.expiresAt).toLocaleDateString('ko-KR')}</p>
                      )}
                      {user.deactivatedAt && (
                        <p><strong>비활성화일:</strong> {new Date(user.deactivatedAt).toLocaleDateString('ko-KR')}</p>
                      )}
                      <p><strong>프롬프트:</strong> {user._count.prompts}개, <strong>태그:</strong> {user._count.tags}개</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 배너 관리 탭 */}
      {activeTab === 'banners' && (
        <BannerManagement />
      )}

      {/* 공지사항 관리 탭 */}
      {activeTab === 'notices' && (
        <NoticeManagement />
      )}

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={() => {
          confirmModal.onConfirm()
          closeConfirmModal()
        }}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  )
} 