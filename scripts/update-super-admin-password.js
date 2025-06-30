const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updateSuperAdminPassword() {
  try {
    console.log('🔑 슈퍼 관리자 비밀번호 업데이트 시작...')
    
    // 기존 슈퍼 관리자 계정 찾기
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })
    
    if (!superAdmin) {
      console.log('❌ 슈퍼 관리자 계정을 찾을 수 없습니다.')
      return
    }
    
    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('Passw0rdAI@!', 12)
    
    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { password: hashedPassword }
    })
    
    console.log('🎉 슈퍼 관리자 비밀번호가 업데이트되었습니다!')
    console.log('📧 이메일:', superAdmin.email)
    console.log('🔑 새 비밀번호: Passw0rdAI@!')
    console.log('⚠️  보안을 위해 첫 로그인 후 비밀번호를 변경하세요.')
    
  } catch (error) {
    console.error('❌ 비밀번호 업데이트 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateSuperAdminPassword() 