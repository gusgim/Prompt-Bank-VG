import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 입력 검증 함수
function validateCreateInviteCode(data: any) {
  const { email, expiresInDays = 30 } = data
  
  if (email && typeof email !== 'string') {
    throw new Error('이메일은 문자열이어야 합니다.')
  }
  
  if (email && !email.includes('@')) {
    throw new Error('올바른 이메일 형식이 아닙니다.')
  }
  
  if (typeof expiresInDays !== 'number' || expiresInDays < 1 || expiresInDays > 365) {
    throw new Error('만료일은 1-365일 사이여야 합니다.')
  }
  
  return { email, expiresInDays }
}

// 초대 코드 생성 (관리자만)
export async function POST(req: NextRequest) {
  try {
    console.log('🔐 초대 코드 생성 요청 시작')
    
    const session = await auth()
    console.log('👤 세션 정보:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ 권한 없음')
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    console.log('📝 요청 본문:', body)
    
    const { email, expiresInDays } = validateCreateInviteCode(body)
    console.log('✅ 검증 완료:', { email, expiresInDays })

    // 8자리 랜덤 코드 생성
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    console.log('🎲 생성된 코드:', code)
    
    // 만료일 계산
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    console.log('📅 만료일:', expiresAt)

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        email,
        expiresAt,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    console.log('✅ 초대 코드 생성 성공:', inviteCode.code)
    return NextResponse.json(inviteCode)
  } catch (error) {
    console.error('💥 초대 코드 생성 오류:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '초대 코드 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 초대 코드 목록 조회 (관리자만)
export async function GET(req: NextRequest) {
  try {
    console.log('📋 초대 코드 목록 조회 요청')
    
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const showExpired = searchParams.get('showExpired') === 'true'

    const skip = (page - 1) * limit

    const where = showExpired ? {} : {
      OR: [
        { expiresAt: { gt: new Date() } },
        { isUsed: false }
      ]
    }

    const [inviteCodes, total] = await Promise.all([
      prisma.inviteCode.findMany({
        where,
        include: {
          createdBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.inviteCode.count({ where })
    ])

    console.log('✅ 초대 코드 목록 조회 성공:', total, '개')
    return NextResponse.json({
      inviteCodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('💥 초대 코드 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '초대 코드 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
} 