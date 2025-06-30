import { Metadata } from 'next'
import { ProfileContainer } from '@/components/features/profile/ProfileContainer'

export const metadata: Metadata = {
  title: '마이페이지 - Prompt Bank By AI SQUARE',
  description: '계정 정보 확인 및 비밀번호 변경',
}

export default function ProfilePage() {
  return <ProfileContainer />
} 