import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 마이그레이션 상태 확인 요청')
    
    const session = await auth()
    console.log('👤 세션 정보:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ 관리자 권한 필요')
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 현재 관리자의 프롬프트 개수 확인
    const adminPrompts = await prisma.prompt.count({ where: { userId: session.user.id } })
    console.log('📊 현재 관리자 프롬프트:', adminPrompts, '개')
    
    // 다른 사용자 ID를 가진 프롬프트들 찾기
    const orphanPrompts = await prisma.prompt.findMany({
      where: {
        NOT: {
          userId: session.user.id
        }
      },
      select: { id: true, title: true, userId: true }
    })
    
    console.log('🔍 마이그레이션 대상 프롬프트:', orphanPrompts.length, '개')
    
    return NextResponse.json({
      status: 'API 엔드포인트가 정상 작동합니다.',
      adminPrompts,
      orphanPrompts: orphanPrompts.length,
      canMigrate: orphanPrompts.length > 0,
      message: orphanPrompts.length > 0 
        ? `${orphanPrompts.length}개의 프롬프트를 마이그레이션할 수 있습니다.`
        : '마이그레이션할 프롬프트가 없습니다.'
    })
    
  } catch (error) {
    console.error('💥 마이그레이션 상태 확인 오류:', error)
    return NextResponse.json(
      { error: '마이그레이션 상태 확인 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 프롬프트 마이그레이션 요청')
    
    const session = await auth()
    console.log('👤 세션 정보:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ 관리자 권한 필요')
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 현재 관리자의 프롬프트 개수 확인
    const adminPrompts = await prisma.prompt.count({ where: { userId: session.user.id } })
    console.log('📊 현재 관리자 프롬프트:', adminPrompts, '개')
    
    // 다른 사용자 ID를 가진 프롬프트들 찾기
    const orphanPrompts = await prisma.prompt.findMany({
      where: {
        NOT: {
          userId: session.user.id
        }
      },
      select: { id: true, title: true, userId: true }
    })
    
    console.log('🔍 마이그레이션 대상 프롬프트:', orphanPrompts.length, '개')
    
    if (orphanPrompts.length === 0) {
      return NextResponse.json({ 
        message: '마이그레이션할 프롬프트가 없습니다.',
        adminPrompts,
        migratedPrompts: 0
      })
    }
    
    // 모든 orphan 프롬프트를 현재 관리자에게 할당
    const updateResult = await prisma.prompt.updateMany({
      where: {
        NOT: {
          userId: session.user.id
        }
      },
      data: {
        userId: session.user.id
      }
    })
    
    console.log('✅ 프롬프트 마이그레이션 완료:', updateResult.count, '개 이전됨')
    
    return NextResponse.json({
      message: `${updateResult.count}개의 프롬프트가 성공적으로 마이그레이션되었습니다.`,
      adminPrompts,
      migratedPrompts: updateResult.count
    })
    
  } catch (error) {
    console.error('💥 프롬프트 마이그레이션 오류:', error)
    return NextResponse.json(
      { error: '프롬프트 마이그레이션 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
} 