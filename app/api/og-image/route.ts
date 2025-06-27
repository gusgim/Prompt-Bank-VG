import { NextRequest, NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL이 필요합니다.' }, { status: 400 })
    }

    // URL 유효성 검사
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ success: false, error: '유효하지 않은 URL입니다.' }, { status: 400 })
    }

    // 웹사이트 HTML 가져오기 (타임아웃 처리)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10초 타임아웃
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ success: false, error: '웹사이트에 접근할 수 없습니다.' }, { status: 400 })
    }

    const html = await response.text()
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Open Graph 이미지 찾기
    let imageUrl = null

    // 1. og:image 메타 태그
    const ogImage = document.querySelector('meta[property="og:image"]')
    if (ogImage) {
      imageUrl = ogImage.getAttribute('content')
      console.log('✅ og:image 찾음:', imageUrl)
    }

    // 2. twitter:image 메타 태그 (fallback)
    if (!imageUrl) {
      const twitterImage = document.querySelector('meta[name="twitter:image"]')
      if (twitterImage) {
        imageUrl = twitterImage.getAttribute('content')
        console.log('✅ twitter:image 찾음:', imageUrl)
      }
    }

    // 3. 네이버 블로그 특화 - 썸네일 이미지 찾기
    if (!imageUrl && url.includes('blog.naver.com')) {
      // 네이버 블로그의 대표 이미지들 시도
      const naverSelectors = [
        'img.se-image-resource', // 스마트에디터 이미지
        '.se-component-content img', // 스마트에디터 컨텐츠 이미지
        '.post-view img', // 포스트 뷰 이미지
        '.entry-content img', // 엔트리 컨텐츠 이미지
        'img[src*="blogfiles.naver.net"]', // 네이버 블로그 파일 서버 이미지
        'img[src*="postfiles.naver.net"]' // 네이버 포스트 파일 서버 이미지
      ]
      
      for (let i = 0; i < naverSelectors.length; i++) {
        const naverImg = document.querySelector(naverSelectors[i])
        if (naverImg) {
          const src = naverImg.getAttribute('src')
          if (src && !src.includes('icon') && !src.includes('logo')) {
            imageUrl = src
            console.log('✅ 네이버 블로그 이미지 찾음:', imageUrl)
            break
          }
        }
      }
    }

    // 4. 첫 번째 의미있는 img 태그 (fallback)
    if (!imageUrl) {
      const images = document.querySelectorAll('img[src]')
      for (let i = 0; i < images.length; i++) {
        const img = images[i] as HTMLImageElement
        const src = img.getAttribute('src')
        if (src && 
            !src.includes('icon') && 
            !src.includes('logo') && 
            !src.includes('avatar') &&
            !src.includes('profile') &&
            img.width > 100 && img.height > 100) {
          imageUrl = src
          console.log('✅ 첫 번째 의미있는 이미지 찾음:', imageUrl)
          break
        }
      }
    }

    // 상대 URL을 절대 URL로 변환
    if (imageUrl && !imageUrl.startsWith('http')) {
      const baseUrl = new URL(url)
      if (imageUrl.startsWith('//')) {
        imageUrl = baseUrl.protocol + imageUrl
      } else if (imageUrl.startsWith('/')) {
        imageUrl = baseUrl.origin + imageUrl
      } else {
        imageUrl = new URL(imageUrl, url).href
      }
    }

    if (imageUrl) {
      return NextResponse.json({ success: true, imageUrl })
    } else {
      return NextResponse.json({ success: false, error: '이미지를 찾을 수 없습니다.' })
    }

  } catch (error) {
    console.error('Open Graph 이미지 가져오기 실패:', error)
    return NextResponse.json({ 
      success: false, 
      error: '이미지를 가져오는 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
} 