import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 개발 환경에서만 console.log를 실행하는 유틸리티
export const devLog = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(...args)
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args)
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args)
    }
  }
}

// 프로덕션에서도 필요한 중요한 에러만 로깅
export const prodLog = {
  error: (...args: any[]) => {
    console.error(...args)
  },
  warn: (...args: any[]) => {
    console.warn(...args)
  }
}

/**
 * YouTube URL에서 비디오 ID를 추출합니다
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

/**
 * YouTube 비디오 ID로부터 썸네일 URL을 생성합니다
 */
export function getYouTubeThumbnail(videoId: string): string {
  // maxresdefault가 가장 높은 화질이지만, 없을 수 있으므로 hqdefault를 기본으로 사용
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

/**
 * URL이 YouTube URL인지 확인합니다
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url)
}

/**
 * 웹사이트의 Open Graph 이미지를 가져옵니다
 */
export async function getOpenGraphImage(url: string): Promise<string | null> {
  try {
    console.log('🔍 Open Graph 이미지 요청:', url)
    // 클라이언트 사이드에서는 CORS 문제로 직접 접근 불가
    // 서버 사이드 API를 통해 처리해야 함
    const response = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
    const data = await response.json()
    
    console.log('📥 Open Graph API 응답:', data)
    
    if (data.success && data.imageUrl) {
      console.log('✅ Open Graph 이미지 성공:', data.imageUrl)
      return data.imageUrl
    }
    
    console.log('❌ Open Graph 이미지 실패:', data.error || 'No image found')
    return null
  } catch (error) {
    console.error('❌ Open Graph 이미지 가져오기 실패:', error)
    return null
  }
}

/**
 * URL에서 자동으로 썸네일을 가져옵니다
 */
export function getAutoThumbnail(url: string): string | null {
  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeVideoId(url)
    if (videoId) {
      return getYouTubeThumbnail(videoId)
    }
  }
  
  return null
}
