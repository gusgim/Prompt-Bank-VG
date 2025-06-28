import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * 배너 이미지 업로드 API
 * Vercel 서버리스 환경에서는 파일 시스템 쓰기가 제한되므로
 * 임시로 base64 데이터 URL을 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 배너 이미지 업로드 API 호출됨')
    
    // 관리자 권한 확인
    const session = await auth()
    console.log('👤 세션 확인:', { userId: session?.user?.id, role: session?.user?.role })
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      console.log('❌ 권한 없음')
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    
    console.log('📁 파일 정보:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    })

    if (!file) {
      console.log('❌ 파일 없음')
      return NextResponse.json(
        { success: false, error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ 파일 크기 초과:', file.size)
      return NextResponse.json(
        { success: false, error: '파일 크기는 5MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 파일 형식 확인 (이미지만 허용)
    if (!file.type.startsWith('image/')) {
      console.log('❌ 이미지 파일 아님:', file.type)
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    try {
      // 파일을 base64로 변환
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      console.log('✅ 파일을 base64로 변환 완료')
      
      // 고유한 파일명 생성 (로깅용)
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `banner_${timestamp}.${fileExtension}`
      
      console.log(`✅ 배너 이미지 업로드 성공: ${session.user.id} - ${fileName}`)
      console.log(`📊 데이터 URL 길이: ${dataUrl.length} 문자`)

      return NextResponse.json({
        success: true,
        imageUrl: dataUrl, // base64 데이터 URL 반환
        fileName
      })
      
    } catch (processError) {
      console.error('💥 파일 처리 에러:', processError)
      return NextResponse.json(
        { success: false, error: '파일 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 배너 이미지 업로드 에러:', error)
    console.error('💥 에러 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { success: false, error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 