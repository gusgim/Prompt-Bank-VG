const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    console.log('🛡️ 슈퍼 관리자 계정 생성 시작...')
    
    // 기존 슈퍼 관리자 확인
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })
    
    if (existingSuperAdmin) {
      console.log('✅ 이미 슈퍼 관리자 계정이 존재합니다:', existingSuperAdmin.email)
      return
    }
    
    // 슈퍼 관리자 계정 생성
    const hashedPassword = await bcrypt.hash('Passw0rdVG@!', 12)
    
    const superAdmin = await prisma.user.create({
      data: {
        name: '슈퍼 관리자',
        email: 'super-admin@promptbank.local',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        // 만료일 없음 (무제한)
      }
    })
    
    console.log('🎉 슈퍼 관리자 계정이 생성되었습니다!')
    console.log('📧 이메일:', superAdmin.email)
    console.log('🔑 비밀번호: Passw0rdVG@!')
    console.log('⚠️  보안을 위해 첫 로그인 후 비밀번호를 변경하세요.')
    
  } catch (error) {
    console.error('❌ 슈퍼 관리자 계정 생성 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin() 