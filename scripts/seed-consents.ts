import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 약관 내용을 직접 정의
const CONSENT_DATA = {
  type: 'unified_terms',
  version: 'v2.1',
  title: '프롬프트 뱅크 서비스 이용약관 및 개인정보 처리 동의 (필수)',
  content: `
# 프롬프트 뱅크 서비스 이용약관 및 개인정보 처리 동의서

## 📋 동의서 개요 및 기본사항

본 동의서는 프롬프트 뱅크 서비스 이용에 관한 포괄적인 약관으로, 서비스의 성격, 관리자 권한, 개인정보 처리, 면책사항 등 서비스 이용과 관련된 모든 중요사항을 통합하여 규정하고 있습니다.

본 서비스는 사용자가 프롬프트를 체계적으로 관리하고 활용할 수 있도록 돕는 웹 애플리케이션으로, 서비스의 안정적인 운영과 품질 향상을 위해 관리자는 시스템 내 모든 데이터에 접근할 수 있는 권한을 보유하고 있습니다.

**본 서비스를 이용하기 위해서는 아래 모든 내용에 대한 동의가 필수이며, 부분적 동의는 불가능합니다.**

## 제1조 (서비스의 성격 및 목적)

**1.1 서비스 정의**
- 본 서비스는 프롬프트 관리를 위한 웹 애플리케이션 서비스입니다.
- 사용자는 프롬프트를 생성, 저장, 분류, 검색할 수 있습니다.

**1.2 서비스 운영 방침**
- 서비스는 제공자의 판단에 따라 언제든지 변경되거나 중단될 수 있습니다.
- 서비스 이용 목적은 제한하지 않으며, 사용자가 자유롭게 활용할 수 있습니다.
- 단, 불법적이거나 부적절한 용도로의 사용은 금지됩니다.

## 제2조 (관리자 권한 및 데이터 접근)

**서비스의 안정적 운영과 품질 향상을 위해 관리자는 다음과 같은 포괄적 권한을 가지며, 사용자는 이에 대해 사전 동의해야 합니다:**

**2.1 데이터 접근 권한**
관리자는 사용자의 동의 없이 언제든지 다음 데이터에 접근할 수 있습니다:
- **프롬프트 콘텐츠**: 제목, 본문, 카테고리, 태그를 포함한 모든 프롬프트 데이터
- **사용 통계**: 접속 시간, 사용 빈도, 선호 카테고리, 활동 패턴 등
- **개인 기록**: 계정 생성, 프롬프트 생성/수정/삭제, 로그인 기록 등
- **개인정보**: 이름, 이메일, 접속 IP, 사용 기기 정보 등

**⚠️ 중요: 이 서비스를 사용하기 위해서는 위 모든 내용에 대한 전체 동의가 필수이며, 부분적 동의나 조건부 동의는 불가능합니다.**
  `,
  isActive: true
}

async function main() {
  console.log('약관 시딩을 시작합니다...')
  
  try {
    // ConsentVersion 테이블에 데이터 삽입
    const result = await prisma.consentVersion.upsert({
      where: {
        type_version: {
          type: CONSENT_DATA.type,
          version: CONSENT_DATA.version
        }
      },
      update: {
        title: CONSENT_DATA.title,
        content: CONSENT_DATA.content,
        isActive: CONSENT_DATA.isActive,
        activatedAt: new Date()
      },
      create: {
        type: CONSENT_DATA.type,
        version: CONSENT_DATA.version,
        title: CONSENT_DATA.title,
        content: CONSENT_DATA.content,
        isActive: CONSENT_DATA.isActive,
        activatedAt: new Date()
      }
    })
    
    console.log('✅ 약관 시딩이 완료되었습니다.')
    console.log('📋 삽입된 약관:', result.title)
  } catch (error) {
    console.error('❌ 약관 시딩 실패:', error)
    throw error
  }
}

main() 
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 