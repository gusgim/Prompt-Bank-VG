import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Prompt Bank of 뱅가드AI경매",
  description: "AI × 부동산경매 전문가를 위한 프롬프트 아카이빙 시스템",
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://prompt-bank-vg-dun.vercel.app',
    title: 'Prompt Bank of 뱅가드AI경매',
    description: 'AI × 부동산경매 전문가를 위한 프롬프트 아카이빙 시스템',
    siteName: 'Prompt Bank of 뱅가드AI경매',
    images: [
      {
        url: 'https://prompt-bank-vg-dun.vercel.app/golden-gate-bridge.jpg',
        width: 1200,
        height: 630,
        alt: 'Prompt Bank of 뱅가드AI경매',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Bank of 뱅가드AI경매',
    description: 'AI × 부동산경매 전문가를 위한 프롬프트 아카이빙 시스템',
    images: ['https://prompt-bank-vg-dun.vercel.app/golden-gate-bridge.jpg'],
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