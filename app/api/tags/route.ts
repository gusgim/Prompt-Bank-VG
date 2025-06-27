import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    // Fetch only tags that belong to the current user and are associated with at least one prompt
    const tags = await prisma.tag.findMany({
      where: {
        userId: session.user.id, // 현재 사용자의 태그만 조회
        prompts: {
          some: {}, // This ensures the tag is linked to at least one prompt
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return NextResponse.json({ error: '태그를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 