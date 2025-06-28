'use client'

import Link from 'next/link'
import { ExternalLink, BookOpen, Users, Award } from 'lucide-react'

interface FooterProps {
  isDark?: boolean
}

export function Footer({ isDark = false }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        {/* 메인 콘텐츠 */}
        <div className="text-center space-y-4">
          {/* 강사 소개 */}
          <div className="space-y-2">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center justify-center gap-2`}>
              <Award className="h-5 w-5 text-[#FF4500]" />
              DUX.AI
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-600'} max-w-2xl mx-auto leading-relaxed`}>
              Drive. Understand. eXchange. Amplify Intelligence
            </p>
          </div>

          {/* 블로그 및 연락처 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <Link 
              href="https://blog.naver.com/auction_ai" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#FF4500] hover:text-[#FF4500]/80 font-medium transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              덕스AI 블로그
              <ExternalLink className="h-3 w-3" />
            </Link>
            <span className={`hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>|</span>
            <Link 
              href="mailto:contact@vanguard-ai-auction.com" 
              className="flex items-center gap-2 text-[#FF4500] hover:text-[#FF4500]/80 font-medium transition-colors"
            >
              <Users className="h-4 w-4" />
              강의 문의하기
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* 구분선 */}
          <div className={`border-t ${isDark ? 'border-gray-600' : 'border-gray-200'} pt-4`}>
            {/* 저작권 정보 */}
            <div className={`space-y-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              <p className="font-medium">
                © {currentYear} <span className="text-[#FF4500] font-bold">덕스AI</span> Prompt Bank System
              </p>
              <p>
                Developed with ❤️ for AI-powered Real Estate Auction Education
              </p>
              <p className={isDark ? 'text-gray-400' : 'text-gray-400'}>
                이 시스템의 모든 콘텐츠와 프롬프트는 교육 목적으로 제작되었습니다. 
                무단 복제 및 상업적 이용을 금지합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 