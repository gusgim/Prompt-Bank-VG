import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// 동적 라우트로 설정하여 빌드 타임 정적 생성 방지
export const dynamic = 'force-dynamic'

// 사용자 목록 조회 (관리자만)
export async function GET(req: NextRequest) {
  try {
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
    const showInactive = searchParams.get('showInactive') === 'true'

    const skip = (page - 1) * limit

    // 현재 시간보다 expiresAt이 이전인 사용자들을 자동으로 비활성화
    await prisma.user.updateMany({
      where: {
        expiresAt: {
          lte: new Date()
        },
        isActive: true
      },
      data: {
        isActive: false,
        deactivatedAt: new Date()
      }
    })

    const where = showInactive ? {} : { isActive: true }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          expiresAt: true,
          deactivatedAt: true,
          deactivatedBy: true,
          createdAt: true,
          _count: {
            select: {
              prompts: true,
              tags: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
} 