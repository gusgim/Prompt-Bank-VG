import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Prompt Bank of 덕스AI",
  description: "AI 프롬프트 관리 및 저장 시스템",
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://prompt-bank-vg-dun.vercel.app',
    title: 'Prompt Bank of 덕스AI',
    description: 'AI 프롬프트 관리 및 저장 시스템',
    siteName: 'Prompt Bank of 덕스AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Prompt Bank of 덕스AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Bank of 덕스AI',
    description: 'AI 프롬프트 관리 및 저장 시스템',
    images: ['/og-image.png'],
  },
}

export default async function HomePage() {
  const session = await auth()
  
  if (session) {
    redirect('/prompts')
  } else {
    redirect('/auth/signin')
  }
} 