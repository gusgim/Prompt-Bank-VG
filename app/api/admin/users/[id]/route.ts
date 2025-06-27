import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 사용자 상태 업데이트 (관리자만)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await req.json()
    const { action, expiresAt } = body

    // 자신의 계정은 비활성화할 수 없음
    if (id === session.user.id) {
      return NextResponse.json(
        { error: '자신의 계정은 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    let updateData: any = {}

    switch (action) {
      case 'activate':
        updateData = {
          isActive: true,
          deactivatedAt: null,
          deactivatedBy: null
        }
        break
        
      case 'deactivate':
        updateData = {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: session.user.id
        }
        break
        
      case 'setExpiration':
        if (!expiresAt) {
          return NextResponse.json(
            { error: '만료일을 입력해주세요.' },
            { status: 400 }
          )
        }
        updateData = {
          expiresAt: new Date(expiresAt)
        }
        break
        
      case 'removeExpiration':
        updateData = {
          expiresAt: null
        }
        break
        
      default:
        return NextResponse.json(
          { error: '유효하지 않은 액션입니다.' },
          { status: 400 }
        )
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        expiresAt: true,
        deactivatedAt: true,
        deactivatedBy: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: '사용자 상태가 업데이트되었습니다.',
      user: updatedUser
    })

  } catch (error) {
    console.error('사용자 상태 업데이트 오류:', error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: '사용자 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 삭제 (관리자만) - 완전 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { id } = params

    // 자신의 계정은 삭제할 수 없음
    if (id === session.user.id) {
      return NextResponse.json(
        { error: '자신의 계정은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 사용자 삭제 (Cascade로 관련 데이터도 함께 삭제됨)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      message: '사용자가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('사용자 삭제 오류:', error)
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: '사용자 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
} 