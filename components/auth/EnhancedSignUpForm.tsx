'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertTriangle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { ConsentModal } from './ConsentModal'
import { getActiveConsentVersionsAction, recordConsentAction } from '@/lib/actions'
import { CONSENT_CONTENTS } from '@/lib/legal-protection'

export function EnhancedSignUpForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  })
  const [consentAgreed, setConsentAgreed] = useState(false)
  const [consentVersion, setConsentVersion] = useState<any>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConsent, setIsLoadingConsent] = useState(true)
  const router = useRouter()
  const { showToast } = useToast()

  // 통합 동의서 로드
  useEffect(() => {
    loadConsentVersion()
  }, [])

  const loadConsentVersion = async () => {
    try {
      const result = await getActiveConsentVersionsAction()
      if (result.success && result.data && result.data.length > 0) {
        // 통합 동의서 찾기
        const unifiedConsent = result.data.find((consent: any) => consent.type === 'unified_terms')
        setConsentVersion(unifiedConsent || result.data[0])
      }
    } catch (error) {
      console.error('동의서 로드 에러:', error)
    } finally {
      setIsLoadingConsent(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleConsentAgree = () => {
    setConsentAgreed(true)
    setActiveModal(null)
    showToast('동의가 완료되었습니다.', 'success')
  }

  const handleConsentDisagree = () => {
    setActiveModal(null)
    showToast('서비스 이용을 위해서는 이용약관에 동의해야 합니다.', 'error')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      showToast('비밀번호가 일치하지 않습니다.', 'error')
      setIsLoading(false)
      return
    }

    // 동의 확인
    if (!consentAgreed) {
      showToast('서비스 이용약관에 동의해야 회원가입이 가능합니다.', 'error')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          inviteCode: formData.inviteCode,
          consents: { [consentVersion?.type || 'unified_terms']: true },
          userAgent: navigator.userAgent
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast('🎉 회원가입이 완료되었습니다! 로그인해주세요.', 'success')
        router.push('/auth/signin')
      } else {
        showToast(data.error || '회원가입에 실패했습니다.', 'error')
      }
    } catch (error) {
      showToast('회원가입 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingConsent) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#FF4500] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">이용약관을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 1단계: 이용약관 동의 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-[#FF4500] text-white text-sm flex items-center justify-center font-bold">1</div>
              <h3 className="text-lg font-semibold">서비스 이용약관 동의 (필수)</h3>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">📋 이용약관 동의</p>
                  <p>서비스 이용을 위해서는 이용약관 및 개인정보 처리방침에 대한 동의가 필수입니다.</p>
                </div>
              </div>
            </div>

            {consentVersion && (
              <div 
                className={`border rounded-lg p-4 transition-all ${
                  consentAgreed 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-[#FF4500]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {consentAgreed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{consentVersion.title}</p>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant={consentAgreed ? "outline" : "default"}
                    size="sm"
                    onClick={() => setActiveModal(consentVersion.type)}
                    className={consentAgreed ? "border-green-300 text-green-700" : ""}
                  >
                    {consentAgreed ? '동의 완료' : '내용 확인'}
                  </Button>
                </div>
              </div>
            )}

            {consentAgreed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    ✅ 이용약관 동의가 완료되었습니다. 계정 정보를 입력해주세요.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2단계: 계정 정보 입력 */}
          {consentAgreed && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 rounded-full bg-[#FF4500] text-white text-sm flex items-center justify-center font-bold">2</div>
                <h3 className="text-lg font-semibold">계정 정보 입력</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteCode">초대 코드 *</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  placeholder="관리자로부터 제공받은 초대 코드를 입력하세요"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="이름을 입력하세요"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="유효한 이메일 주소를 입력하세요"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="6자 이상 입력하세요"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#FF4500] hover:bg-[#FF4500]/90"
                disabled={isLoading}
              >
                <Lock className="h-4 w-4 mr-2" />
                {isLoading ? '가입 중...' : '회원가입 완료'}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>이미 계정이 있으신가요?</p>
            <Button
              variant="link"
              onClick={() => router.push('/auth/signin')}
              className="p-0 h-auto text-[#FF4500]"
            >
              로그인하기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 동의서 모달 */}
      {consentVersion && (
        <ConsentModal
          title={consentVersion.title}
          content={CONSENT_CONTENTS[consentVersion.type as keyof typeof CONSENT_CONTENTS]?.content || consentVersion.content}
          isOpen={activeModal === consentVersion.type}
          onClose={() => setActiveModal(null)}
          onAgree={handleConsentAgree}
          onDisagree={handleConsentDisagree}
          agreed={consentAgreed}
        />
      )}
    </>
  )
} 