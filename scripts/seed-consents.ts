import prisma from '../lib/prisma'
import { seedConsentVersions } from '../lib/legal-protection'

async function main() {
  console.log('🛡️ 법적 보호 시스템 초기화 중...')
  
  try {
    await seedConsentVersions()
    console.log('✅ 동의서 버전 시드 완료')
    
    // 추가된 동의서 확인
    const consentVersions = await (prisma as any).consentVersion.findMany({
      orderBy: { type: 'asc' }
    })
    
    console.log('📋 추가된 동의서 목록:')
    consentVersions.forEach((cv: any) => {
      console.log(`  - ${cv.type} v${cv.version}: ${cv.title}`)
    })
    
  } catch (error) {
    console.error('❌ 시드 실패:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 