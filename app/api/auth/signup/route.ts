import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { recordUserConsent } from '@/lib/legal-protection'
import { createNotificationAction } from '@/lib/actions'

// 회원가입 데이터 검증
function validateSignupData(data: any) {
  const { name, email, password, inviteCode } = data
  
  if (!name || typeof name !== 'string' || name.length < 2) {
    throw new Error('이름은 2자 이상이어야 합니다.')
  }
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new Error('올바른 이메일을 입력해주세요.')
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('비밀번호는 6자 이상이어야 합니다.')
  }
  
  if (!inviteCode || typeof inviteCode !== 'string') {
    throw new Error('초대 코드를 입력해주세요.')
  }
  
  return { name, email, password, inviteCode }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, inviteCode } = validateSignupData(body)
    const { consents, userAgent } = body
    
    // IP 주소 추출
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || '127.0.0.1'

    // 이미 존재하는 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 가입된 이메일입니다.' },
        { status: 400 }
      )
    }

    // 초대 코드 검증
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode }
    })

    if (!invite) {
      return NextResponse.json(
        { error: '유효하지 않은 초대 코드입니다.' },
        { status: 400 }
      )
    }

    if (invite.isUsed) {
      return NextResponse.json(
        { error: '이미 사용된 초대 코드입니다.' },
        { status: 400 }
      )
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: '만료된 초대 코드입니다.' },
        { status: 400 }
      )
    }

    // 특정 이메일 제한이 있는 경우 확인
    if (invite.email && invite.email !== email) {
      return NextResponse.json(
        { error: '이 초대 코드는 다른 이메일 주소용입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12)

    // 기본 계정 만료일 설정 (30일 후)
    const defaultExpiresAt = new Date()
    defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 30)

    // 트랜잭션으로 사용자 생성 및 초대 코드 사용 처리
    const result = await prisma.$transaction(async (tx) => {
      // 사용자 생성
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'USER',
          expiresAt: defaultExpiresAt
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      })

      // 초대 코드 사용 처리
      await tx.inviteCode.update({
        where: { code: inviteCode },
        data: {
          isUsed: true,
          usedBy: email,
          usedAt: new Date()
        }
      })

      // 동의 정보 처리
      if (consents && typeof consents === 'object') {
        for (const [consentType, agreed] of Object.entries(consents)) {
          if (agreed === true) {
            try {
              await recordUserConsent(
                user.id,
                consentType as any,
                true,
                ip,
                userAgent
              )
              console.log(`✅ 동의 기록 완료: ${user.id} - ${consentType}`)
            } catch (consentError) {
              console.error(`동의 기록 에러 (${consentType}):`, consentError)
              // 동의 기록 실패는 회원가입을 막지 않음
            }
          }
        }
      }

      return user
    })

    // 관리자에게 신규 사용자 알림 생성 (비동기 처리)
    try {
      await createNotificationAction(
        'new_user',
        '신규 회원 가입',
        `새로운 회원이 가입했습니다.`,
        {
          userId: result.id,
          userName: result.name,
          userEmail: result.email,
          signupDate: result.createdAt,
          ipAddress: ip
        }
      )
    } catch (notificationError) {
      console.error('알림 생성 실패 (회원가입은 성공):', notificationError)
      // 알림 실패는 회원가입을 막지 않음
    }

    return NextResponse.json({
      message: '회원가입이 완료되었습니다.',
      user: result
    })

  } catch (error) {
    console.error('회원가입 오류:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 