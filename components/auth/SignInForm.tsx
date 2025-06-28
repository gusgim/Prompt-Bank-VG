'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface SignInFormProps {
  className?: string
}

export function SignInForm({ className }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberEmail, setRememberEmail] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  // 컴포넌트 마운트 시 저장된 이메일 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberEmail(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'account_deactivated') {
          setError('계정이 비활성화되었습니다. 관리자에게 문의하세요.')
        } else if (result.error === 'account_expired') {
          setError('계정이 만료되었습니다. 관리자에게 문의하세요.')
        } else {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        }
      } else {
        // 로그인 성공 시 이메일 기억하기 처리
        if (rememberEmail) {
          localStorage.setItem('rememberedEmail', email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }

        // 로그인 성공 토스트 표시
        showToast('로그인에 성공했습니다! 환영합니다.', 'success')
        
        // 토스트가 보이도록 잠시 대기 후 페이지 이동
        setTimeout(() => {
          router.push('/prompts')
          router.refresh()
        }, 1000)
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-white">로그인</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white font-medium">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-white/90 border-white/50 text-black placeholder:text-gray-500 focus:bg-white focus:border-blue-500"
              placeholder="이메일을 입력하세요"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white font-medium">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-white/90 border-white/50 text-black placeholder:text-gray-500 focus:bg-white focus:border-blue-500"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {/* 내 ID 기억하기 체크박스 */}
          <div className="flex items-center space-x-2">
            <input
              id="remember-email"
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 text-[#000080] focus:ring-[#000080] border-gray-300 rounded"
            />
            <Label 
              htmlFor="remember-email" 
              className="text-sm text-white font-medium cursor-pointer"
            >
              내 ID 기억하기
            </Label>
          </div>

          {error && (
            <div className="text-red-300 text-sm text-center bg-red-900/50 p-2 rounded border border-red-500/50">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#000080] hover:bg-[#000080]/90 text-white font-medium"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="text-blue-300 hover:text-blue-200 hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 