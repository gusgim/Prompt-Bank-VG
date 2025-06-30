import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createNotificationAction } from '@/lib/actions'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 테스트 알림 생성
    const result = await createNotificationAction(
      'test',
      '테스트 알림',
      '알림 시스템이 정상적으로 작동하고 있습니다.',
      {
        testData: '테스트 데이터',
        timestamp: new Date().toISOString()
      }
    )

    if (result.success) {
      return NextResponse.json({ message: '테스트 알림이 생성되었습니다.' })
    } else {
      return NextResponse.json(
        { error: result.error || '알림 생성에 실패했습니다.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('테스트 알림 생성 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 