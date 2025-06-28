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

// Open Graph 기능 제거 - YouTube만 자동 썸네일 지원

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
