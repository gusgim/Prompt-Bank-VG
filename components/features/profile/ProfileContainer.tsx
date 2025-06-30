'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { BackgroundWrapper } from '@/components/ui/BackgroundWrapper'
import { User, Lock, Calendar, Shield, FileText, Tag } from 'lucide-react'
import { getUserProfileAction, changePasswordAction } from '@/lib/actions'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  expiresAt: string | null
  _count: {
    prompts: number
    tags: number
  }
}

export function ProfileContainer() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutCountdown, setLogoutCountdown] = useState(0)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const { showToast } = useToast()
  const router = useRouter()

  // 사용자 프로필 로드
  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      const result = await getUserProfileAction()
      
      if (result.success && result.data) {
        setUserProfile(result.data)
      } else {
        showToast(result.error || '프로필 정보를 불러오는데 실패했습니다.', 'error')
      }
    } catch (error) {
      showToast('프로필 정보를 불러오는 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const performLogout = async () => {
    try {
      showToast('보안을 위해 자동 로그아웃됩니다...', 'info')
      await signOut({ callbackUrl: '/auth/signin' })
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // signOut 실패 시 강제로 로그인 페이지로 이동
      router.push('/auth/signin')
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 새 비밀번호 확인
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('새 비밀번호가 일치하지 않습니다.', 'error')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showToast('새 비밀번호는 6자 이상이어야 합니다.', 'error')
      return
    }

    try {
      setIsChangingPassword(true)
      const result = await changePasswordAction(
        passwordData.currentPassword,
        passwordData.newPassword
      )

      if (result.success) {
        showToast('🎉 비밀번호가 성공적으로 변경되었습니다!', 'success')
        
        // 폼 초기화
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // 로그아웃 프로세스 시작
        setIsLoggingOut(true)
        setLogoutCountdown(3)
        
        // 카운트다운 시작
        const countdownInterval = setInterval(() => {
          setLogoutCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              // 로그아웃 실행
              performLogout()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        showToast(result.error || '비밀번호 변경에 실패했습니다.', 'error')
      }
    } catch (error) {
      showToast('비밀번호 변경 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null
    
    const today = new Date()
    const expiryDate = new Date(expiresAt)
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  if (isLoading) {
    return (
      <BackgroundWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#FF4500] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">프로필 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    )
  }

  if (!userProfile) {
    return (
      <BackgroundWrapper>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-gray-600">프로필 정보를 찾을 수 없습니다.</p>
            </CardContent>
          </Card>
        </div>
      </BackgroundWrapper>
    )
  }

  const daysUntilExpiry = calculateDaysUntilExpiry(userProfile.expiresAt)

  // 로그아웃 진행 중일 때 오버레이 표시
  if (isLoggingOut) {
    return (
      <BackgroundWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md mx-auto backdrop-blur-md bg-white/95 border-white/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-[#FF4500] border-t-transparent rounded-full mb-6"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  비밀번호 변경 완료!
                </h3>
                <p className="text-gray-600 mb-4">
                  보안을 위해 자동으로 로그아웃됩니다.
                </p>
                <div className="text-2xl font-bold text-[#FF4500]">
                  {logoutCountdown}초
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  잠시 후 로그인 페이지로 이동합니다...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </BackgroundWrapper>
    )
  }

  return (
    <BackgroundWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 페이지 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
            <p className="text-gray-600">계정 정보 및 설정을 관리할 수 있습니다.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 계정 정보 */}
            <Card className="backdrop-blur-md bg-white/90 border-white/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-[#FF4500]" />
                  <span>계정 정보</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">이름</Label>
                  <p className="text-lg font-semibold">{userProfile.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">이메일</Label>
                  <p className="text-lg">{userProfile.email}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">계정 상태</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={userProfile.isActive ? "default" : "secondary"}>
                      {userProfile.isActive ? '활성' : '비활성'}
                    </Badge>
                    <Badge variant="outline">{userProfile.role}</Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{userProfile._count.prompts}개 프롬프트</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Tag className="h-4 w-4" />
                    <span>{userProfile._count.tags}개 태그</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 계정 날짜 정보 */}
            <Card className="backdrop-blur-md bg-white/90 border-white/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-[#FF4500]" />
                  <span>계정 일정</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">가입일</Label>
                  <p className="text-lg font-semibold">{formatDate(userProfile.createdAt)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">만료 예정일</Label>
                  {userProfile.expiresAt ? (
                    <div>
                      <p className="text-lg font-semibold">{formatDate(userProfile.expiresAt)}</p>
                      {daysUntilExpiry !== null && (
                        <Badge 
                          variant={daysUntilExpiry <= 7 ? "destructive" : daysUntilExpiry <= 30 ? "outline" : "default"}
                          className="mt-1"
                        >
                          {daysUntilExpiry > 0 
                            ? `${daysUntilExpiry}일 남음` 
                            : daysUntilExpiry === 0 
                              ? '오늘 만료' 
                              : '만료됨'
                          }
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-semibold">무제한</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 비밀번호 변경 */}
          <Card className="backdrop-blur-md bg-white/90 border-white/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-[#FF4500]" />
                <span>비밀번호 변경</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="currentPassword">현재 비밀번호 *</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="현재 비밀번호를 입력하세요"
                    required
                    disabled={isChangingPassword || isLoggingOut}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">새 비밀번호 *</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="새 비밀번호를 입력하세요 (6자 이상)"
                    required
                    disabled={isChangingPassword || isLoggingOut}
                    minLength={6}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">새 비밀번호 확인 *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    required
                    disabled={isChangingPassword || isLoggingOut}
                    minLength={6}
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword || isLoggingOut}
                  className="bg-[#000080] hover:bg-[#000080]/90 text-white"
                >
                  {isChangingPassword ? '변경 중...' : isLoggingOut ? '로그아웃 중...' : '비밀번호 변경'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </BackgroundWrapper>
  )
} 