const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateSuperAdminEmail() {
  try {
    console.log('📧 슈퍼 관리자 이메일 업데이트 시작...')
    
    // 기존 슈퍼 관리자 계정 찾기
    const superAdmin = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'super-admin@prompt-bank.local' },
          { role: 'SUPER_ADMIN' }
        ]
      }
    })
    
    if (!superAdmin) {
      console.log('❌ 슈퍼 관리자 계정을 찾을 수 없습니다.')
      return
    }
    
    console.log('🔍 기존 이메일:', superAdmin.email)
    
    // 이메일 업데이트
    const updatedSuperAdmin = await prisma.user.update({
      where: { id: superAdmin.id },
      data: { email: 'super-admin@promptbank.local' }
    })
    
    console.log('🎉 슈퍼 관리자 이메일이 업데이트되었습니다!')
    console.log('📧 새 이메일:', updatedSuperAdmin.email)
    console.log('🔑 비밀번호: Passw0rdVG@!')
    console.log('✅ 로그인 정보가 업데이트되었습니다.')
    
  } catch (error) {
    console.error('❌ 이메일 업데이트 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateSuperAdminEmail() 