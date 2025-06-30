import { SignInForm } from '@/components/auth/SignInForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "로그인 - Prompt Bank of AI SQUARE",
  description: "AI 프롬프트 관리 시스템에 로그인하세요",
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://prompt-bank-vg-dun.vercel.app/auth/signin',
    title: '로그인 - Prompt Bank of AI SQUARE',
    description: 'AI 프롬프트 관리 시스템에 로그인하세요',
    siteName: 'Prompt Bank of AI SQUARE',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Prompt Bank of AI SQUARE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '로그인 - Prompt Bank of AI SQUARE',
    description: 'AI 프롬프트 관리 시스템에 로그인하세요',
    images: ['/og-image.png'],
  },
}

export default function SignInPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
      <main className="relative flex-1 flex items-center justify-end pr-8 md:pr-16 lg:pr-24">
      {/* Background Image */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('/golden-gate-bridge.jpg')",
        }}
      />

      {/* Content positioned on the right third - vertically centered */}
      <div className="relative z-20 flex flex-col items-center justify-center text-white w-full max-w-lg px-4 md:mr-8 lg:mr-16">
        <div className="text-center mb-8">
          {/* Title with text shadow and semi-transparent background */}
          <div className="inline-block px-6 py-3 bg-black/30 backdrop-blur-sm rounded-lg mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] whitespace-nowrap">
              Prompt Bank
            </h1>
          </div>
          
          {/* Subtitle with text shadow and semi-transparent background */}
          <div className="inline-block px-4 py-2 bg-black/25 backdrop-blur-sm rounded-lg">
            <p className="text-sm sm:text-base md:text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium whitespace-nowrap">
              당신의 지식 자산을 한 곳에서 관리하고 공유하세요.
            </p>
          </div>
        </div>

        <SignInForm className="w-full max-w-sm bg-black/50 backdrop-blur-sm border border-white/30 text-white shadow-2xl mb-8" />
      
        {/* Footer positioned below login form */}
        <div className="text-center">
          <div className="bg-black/30 backdrop-blur-sm border border-white/30 rounded-lg p-3 shadow-2xl">
            <p className="text-xs text-white font-medium mb-1 drop-shadow-md">
              © 2025 <span className="text-[#FF4500] font-bold">AI SQUARE</span> Prompt Bank System
            </p>
          </div>
        </div>
      </div>
      </main>
    </div>
  )
} 