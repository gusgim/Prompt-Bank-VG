# 프롬프트 뱅크 시스템 - 프로젝트 규칙

## 🎯 프로젝트 개요

**프로젝트명**: Prompt Bank of AI SQUARE  
**목적**: 개인용 프롬프트 저장, 관리, 검색 시스템  
**기술 스택**: Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth.js v5  
**아키텍처**: 서버 액션 기반 풀스택 애플리케이션  

## 🏗️ 시스템 아키텍처

### 인증 시스템
- **NextAuth.js v5** 기반 인증
- **역할 기반 접근 제어** (USER, ADMIN)
- **계정 만료 시스템** (관리자 제어)
- **초대 코드 시스템** (관리자 전용)

### 데이터베이스 스키마
```prisma
// 핵심 모델들
model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  role          Role      @default(USER)
  isActive      Boolean   @default(true)
  expiresAt     DateTime? // 계정 만료일
  prompts       Prompt[]
  tags          Tag[]
  createdInviteCodes InviteCode[] @relation("CreatedInviteCodes")
}

model Prompt {
  id          String   @id @default(uuid())
  title       String
  content     String
  category    String
  subCategory String?
  userId      String   // 사용자별 분리
  tags        Tag[]    @relation("PromptTags")
}

model Tag {
  id      String @id @default(uuid())
  name    String
  userId  String // 사용자별 분리
  prompts Prompt[] @relation("PromptTags")
  @@unique([name, userId]) // 복합 unique 키
}

model InviteCode {
  id          String   @id @default(uuid())
  code        String   @unique
  email       String?  // 특정 이메일 제한 (선택사항)
  isUsed      Boolean  @default(false)
  expiresAt   DateTime
  createdById String
  createdBy   User     @relation("CreatedInviteCodes")
}
```

## 🔧 개발 규칙

### 1. 서버 액션 우선 사용
```typescript
// ✅ 권장: 서버 액션 사용
'use server'

export async function createPrompt(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('인증 필요')
  
  // 비즈니스 로직 처리
  const result = await prisma.prompt.create({...})
  revalidatePath('/prompts')
  return result
}

// ❌ 지양: API 라우트 (관리자 기능 제외)
```

### 2. 타입 안전성 보장
```typescript
// 모든 데이터 타입 정의
interface CreatePromptInput {
  title: string
  content: string
  category: string
  subCategory?: string
  tagNames: string[]
}

// Zod 스키마 활용 (API 라우트)
const CreatePromptSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().min(1),
  // ...
})
```

### 3. 사용자별 데이터 분리 (멀티테넌트)
```typescript
// ✅ 모든 쿼리에 userId 포함
const prompts = await prisma.prompt.findMany({
  where: { userId: session.user.id },
  // ...
})

// ❌ 전역 데이터 접근 금지
const allPrompts = await prisma.prompt.findMany() // 위험!
```

### 4. 에러 처리 패턴
```typescript
// 서버 액션 에러 처리
export async function createPrompt(input: CreatePromptInput) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: '로그인이 필요합니다.' }
    }
    
    const result = await prisma.prompt.create({...})
    revalidatePath('/prompts')
    return { success: true, data: result }
    
  } catch (error) {
    console.error('프롬프트 생성 오류:', error)
    return { success: false, error: '프롬프트 생성에 실패했습니다.' }
  }
}
```

## 📁 파일 구조 규칙

### 디렉토리 구조
```
app/
├── (main)/                 # 메인 레이아웃 그룹
│   ├── prompts/            # 프롬프트 관련 페이지
│   └── admin/              # 관리자 페이지
├── api/                    # API 라우트 (관리자 기능만)
│   ├── admin/              # 관리자 전용 API
│   └── auth/               # 인증 관련 API
├── auth/                   # 인증 페이지
└── globals.css

components/
├── features/               # 기능별 컴포넌트
│   └── prompts/           # 프롬프트 관련 컴포넌트
├── layout/                # 레이아웃 컴포넌트
└── ui/                    # 재사용 가능한 UI 컴포넌트

lib/
├── actions.ts             # 서버 액션 모음
├── auth.ts               # NextAuth 설정
├── prisma.ts             # Prisma 클라이언트
└── types.ts              # 타입 정의
```

### 컴포넌트 명명 규칙
```typescript
// 기능별 컴포넌트
PromptCard.tsx
PromptForm.tsx
PromptList.tsx
FilterSidebar.tsx

// UI 컴포넌트
Button.tsx
Input.tsx
Modal.tsx
Toast.tsx
```

## 🎨 UI/UX 가이드라인

### 브랜드 컬러
```css
:root {
  --lush-lava: #FF4500;      /* 주요 액션 버튼 */
  --navy-blue: #000080;      /* 보조 버튼 */
  --lush-lava-hover: #E63E00;
  --navy-blue-hover: #000066;
}
```

### 컴포넌트 스타일 패턴
```typescript
// Lush Lava 태그 디자인
<span className="inline-block bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-shadow">
  {tag.name}
</span>

// 호버 애니메이션
<div className="hover-lift hover-glow">
  {/* 콘텐츠 */}
</div>
```

## 🔐 보안 규칙

### 1. 인증 확인
```typescript
// 모든 서버 액션에서 인증 확인
const session = await auth()
if (!session?.user) {
  throw new Error('로그인이 필요합니다.')
}
```

### 2. 관리자 권한 확인
```typescript
// 관리자 전용 기능
if (session.user.role !== 'ADMIN') {
  throw new Error('관리자 권한이 필요합니다.')
}
```

### 3. 데이터 접근 제어
```typescript
// 사용자별 데이터만 접근
const prompt = await prisma.prompt.findFirst({
  where: { 
    id: promptId, 
    userId: session.user.id // 필수!
  }
})
```

## 📊 성능 최적화 규칙

### 1. 데이터베이스 쿼리 최적화
```typescript
// 필요한 필드만 선택
const prompts = await prisma.prompt.findMany({
  select: {
    id: true,
    title: true,
    category: true,
    createdAt: true,
    tags: {
      select: { name: true }
    }
  }
})

// 페이지네이션 적용
const prompts = await prisma.prompt.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
})
```

### 2. 캐싱 전략
```typescript
// revalidatePath 활용
revalidatePath('/prompts')
revalidatePath(`/prompts/${promptId}`)

// 정적 데이터 캐싱
export const revalidate = 3600 // 1시간
```

## 🧪 테스트 규칙

### 1. 서버 액션 테스트
```typescript
// 성공 케이스
const result = await createPrompt(validInput)
expect(result.success).toBe(true)

// 인증 실패 케이스
const result = await createPrompt(inputWithoutAuth)
expect(result.success).toBe(false)
expect(result.error).toContain('로그인')
```

### 2. 컴포넌트 테스트
```typescript
// 프롬프트 카드 렌더링
render(<PromptCard prompt={mockPrompt} />)
expect(screen.getByText(mockPrompt.title)).toBeInTheDocument()

// 사용자 상호작용
await userEvent.click(screen.getByRole('button', { name: /복사/i }))
expect(mockCopyFunction).toHaveBeenCalled()
```

## 🚀 배포 규칙

### 1. 환경 변수 관리
```bash
# 필수 환경 변수
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

### 2. 프로덕션 최적화
```javascript
// next.config.mjs
const nextConfig = {
  // 프로덕션에서 console.log 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}
```

## 📚 코드 품질 규칙

### 1. ESLint & Prettier 준수
- 자동 포맷팅 적용
- TypeScript strict 모드 사용
- 미사용 import 제거

### 2. 커밋 메시지 규칙
```
feat(prompts): 프롬프트 검색 기능 추가
fix(auth): 세션 만료 처리 수정
docs(readme): 설치 가이드 업데이트
refactor(ui): 버튼 컴포넌트 통합
```

### 3. 주석 규칙
```typescript
/**
 * 프롬프트를 생성하고 데이터베이스에 저장합니다.
 * 
 * @param input - 프롬프트 생성 데이터
 * @returns 생성 결과 (성공/실패)
 */
export async function createPrompt(input: CreatePromptInput) {
  // 구현...
}
```

## 🔄 데이터 플로우 규칙

### 1. 클라이언트 → 서버 액션
```typescript
// 폼 제출
<form action={createPromptAction}>
  <input name="title" />
  <button type="submit">생성</button>
</form>
```

### 2. 상태 관리
```typescript
// Zustand 스토어 (필터링)
interface PromptFilterStore {
  filters: PromptFilters
  setFilters: (filters: PromptFilters) => void
  resetFilters: () => void
}
```

## 📖 문서화 규칙

### 1. README 구조
- 프로젝트 소개
- 기능 목록
- 설치 방법
- 사용법
- API 문서

### 2. 코드 문서화
- 복잡한 비즈니스 로직 주석
- 타입 정의 설명
- 사용 예제 제공

---

## 🎯 개발 우선순위

### 1단계 (완료) ✅
- [x] 기본 CRUD 시스템
- [x] 사용자 인증 시스템
- [x] 관리자 기능
- [x] 초대 코드 시스템

### 2단계 (향후 계획)
- [ ] 고급 검색 기능
- [ ] 프롬프트 통계
- [ ] 공유 기능
- [ ] 모바일 최적화

이 규칙들을 따라 일관성 있는 개발을 진행해주세요! 🚀 