import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/auth'

/**
 * 배너 이미지 업로드 API
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 5MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 파일 형식 확인 (이미지만 허용)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 고유한 파일명 생성
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `banner_${timestamp}.${fileExtension}`
    
    // 업로드 디렉토리 경로
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'banners')
    const uploadPath = join(uploadDir, fileName)
    
    try {
      // 디렉토리가 없으면 생성
      await mkdir(uploadDir, { recursive: true })
      
      // 파일 저장
      await writeFile(uploadPath, buffer)
      
      console.log(`✅ 배너 이미지 업로드 성공: ${session.user.id} - ${fileName}`)
      console.log(`📁 저장 경로: ${uploadPath}`)
      
      // 웹에서 접근 가능한 URL 생성
      const imageUrl = `/uploads/banners/${fileName}`

      return NextResponse.json({
        success: true,
        imageUrl,
        fileName
      })
    } catch (writeError) {
      console.error('💥 파일 저장 에러:', writeError)
      return NextResponse.json(
        { success: false, error: '파일 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 배너 이미지 업로드 에러:', error)
    return NextResponse.json(
      { success: false, error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 