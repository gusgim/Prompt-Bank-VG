import { ReactNode } from 'react'

interface BackgroundWrapperProps {
  children: ReactNode
  className?: string
}

export function BackgroundWrapper({ children, className = '' }: BackgroundWrapperProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-violet-100 via-pink-50 to-amber-50 relative overflow-hidden ${className}`}>
      {/* 동적 배경 패턴 */}
      <div className="absolute inset-0 opacity-[0.15]" style={{
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(139, 69, 19, 0.1) 2px, transparent 2px),
          linear-gradient(135deg, rgba(168, 85, 247, 0.05) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(236, 72, 153, 0.05) 25%, transparent 25%)
        `,
        backgroundSize: '40px 40px, 60px 60px, 80px 80px'
      }}></div>
      
      {/* 플로팅 도형들 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-violet-200/30 to-purple-300/30 rounded-full blur-xl"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-gradient-to-br from-pink-200/30 to-rose-300/30 rounded-full blur-lg"></div>
        <div className="absolute bottom-40 left-40 w-20 h-20 bg-gradient-to-br from-amber-200/30 to-orange-300/30 rounded-full blur-lg"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-emerald-200/30 to-teal-300/30 rounded-full blur-md"></div>
      </div>
      
      {/* 컨텐츠 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
} 