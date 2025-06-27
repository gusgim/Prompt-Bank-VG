'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Banner } from '@/lib/types'
import { getBannersAction } from '@/lib/actions'
import { getAutoThumbnail, getOpenGraphImage, isYouTubeUrl } from '@/lib/utils'
// import Image from 'next/image' // 일반 img 태그 사용

interface BannerWithThumbnail extends Banner {
  autoThumbnail?: string | null
}

export function BannerSection() {
  const [banners, setBanners] = useState<BannerWithThumbnail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hiddenBanners, setHiddenBanners] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBanners()
    // 로컬 스토리지에서 숨겨진 배너 목록 불러오기
    const hidden = localStorage.getItem('hiddenBanners')
    if (hidden) {
      setHiddenBanners(new Set(JSON.parse(hidden)))
    }
  }, [])

  const loadBanners = async () => {
    try {
      const result = await getBannersAction()
      
      if (result.success && result.data) {
        // 각 배너에 대해 자동 썸네일 생성
        const bannersWithThumbnails = await Promise.all(
          result.data.map(async (banner: Banner) => {
            let autoThumbnail = null
            
            // YouTube URL만 자동 썸네일 생성 지원
            if (banner.url && isYouTubeUrl(banner.url)) {
              // YouTube 썸네일만 자동 생성
              autoThumbnail = getAutoThumbnail(banner.url)
              console.log('✅ YouTube 썸네일 생성:', autoThumbnail)
            }
            // 블로그나 일반 웹사이트는 관리자가 직접 업로드한 이미지만 사용
            
            return {
              ...banner,
              autoThumbnail
            } as BannerWithThumbnail
          })
        )
        
        setBanners(bannersWithThumbnails)
      }
    } catch (error) {
      console.error('배너 로딩 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hideBanner = (bannerId: string) => {
    const newHidden = new Set(hiddenBanners)
    newHidden.add(bannerId)
    setHiddenBanners(newHidden)
    localStorage.setItem('hiddenBanners', JSON.stringify(Array.from(newHidden)))
  }

  const visibleBanners = banners.filter(banner => !hiddenBanners.has(banner.id))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (visibleBanners.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">추천 링크</h3>
      
      {visibleBanners.map((banner) => (
        <Card key={banner.id} className="group hover:shadow-lg transition-all duration-200">
          <div className="relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => hideBanner(banner.id)}
              className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
              title="배너 숨기기"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>

            <a
              href={banner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              {/* 유튜브 썸네일 스타일 레이아웃 */}
              <div className="space-y-3">
                {/* 썸네일 이미지 */}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                  {(() => {
                    // 이미지 우선순위: 1. 업로드된 이미지, 2. 자동 썸네일
                    const imageUrl = banner.imageUrl || banner.autoThumbnail
                    
                    if (imageUrl) {
                      return (
                        <img
                          src={imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            console.error('🚫 이미지 로딩 실패:', {
                              url: imageUrl,
                              originalUrl: banner.imageUrl,
                              autoThumbnail: banner.autoThumbnail,
                              isYouTube: isYouTubeUrl(banner.url),
                              bannerUrl: banner.url,
                              error: e
                            })
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              const fallback = document.createElement('div')
                              fallback.className = 'absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'
                              fallback.innerHTML = '<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>'
                              fallback.title = `이미지 로딩 실패: ${imageUrl}`
                              parent.appendChild(fallback)
                            }
                          }}
                          onLoad={() => {
                            console.log('✅ 이미지 로딩 성공:', {
                              url: imageUrl,
                              originalUrl: banner.imageUrl,
                              autoThumbnail: banner.autoThumbnail,
                              isYouTube: isYouTubeUrl(banner.url)
                            })
                          }}
                        />
                      )
                    } else {
                      return (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <ExternalLink className="h-8 w-8 text-white" />
                        </div>
                      )
                    }
                  })()}
                  
                  {/* 호버 오버레이 - YouTube는 플레이 버튼, 블로그는 링크 아이콘 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/20">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      {isYouTubeUrl(banner.url) ? (
                        <div className="w-0 h-0 border-l-[8px] border-l-gray-700 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                      ) : (
                        <ExternalLink className="h-6 w-6 text-gray-700" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 텍스트 정보 */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                    {banner.title}
                  </h4>
                  
                  <div className="flex items-center text-xs text-blue-600">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span>링크 열기</span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </Card>
      ))}
      
      <div className="text-xs text-gray-500 text-center mt-4">
        관리자가 추천하는 유용한 링크들입니다
      </div>
    </div>
  )
} 