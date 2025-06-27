import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('📂 카테고리 목록 조회 요청')
    
    const session = await auth()
    console.log('👤 세션 정보:', session?.user?.email, session?.user?.id)
    
    if (!session?.user) {
      console.log('❌ 인증되지 않은 사용자')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 기본 카테고리 목록
    const defaultCategories = ['general', 'coding', 'real_estate']
    
    // 현재 사용자가 실제 사용 중인 카테고리들을 조회
    const userCategories = await prisma.prompt.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    })
    
    const userCategoryNames = userCategories.map(c => c.category)
    
    // 기본 카테고리와 사용자 카테고리를 합치고 중복 제거
    const allCategories = Array.from(new Set([...defaultCategories, ...userCategoryNames]))
    
    console.log('✅ 카테고리 조회 성공:', allCategories.length, '개 -', allCategories)
    
    return NextResponse.json(allCategories)
  } catch (error) {
    console.error('💥 카테고리 조회 오류:', error)
    return NextResponse.json({ error: '카테고리를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 