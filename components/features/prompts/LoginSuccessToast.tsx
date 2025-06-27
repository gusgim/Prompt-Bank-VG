'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export function LoginSuccessToast({ loginSuccess }: { loginSuccess: boolean }) {
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    if (loginSuccess) {
      showToast('로그인 성공! 메인 화면으로 진입합니다.', 'success')
      // Clean the URL to remove the login_success query parameter
      router.replace('/prompts', { scroll: false })
    }
  }, [loginSuccess, router, showToast])

  return null
} 