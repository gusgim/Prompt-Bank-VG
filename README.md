# Prompt Bank of AI SQUARE

개인 프롬프트 관리 시스템으로, 효율적인 프롬프트 저장, 검색, 관리 기능을 제공합니다.

## 🚀 주요 기능

- **프롬프트 CRUD**: 생성, 조회, 수정, 삭제
- **카테고리 관리**: 프롬프트를 카테고리별로 분류
- **태그 시스템**: 프롬프트에 태그를 추가하여 검색성 향상
- **검색 및 필터링**: 제목, 내용, 카테고리, 태그 기반 검색
- **반응형 디자인**: 모바일과 데스크톱에서 최적화된 UI
- **클립보드 복사**: 원클릭으로 프롬프트 내용 복사

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: Zustand, React Query
- **Database**: PostgreSQL, Prisma ORM
- **Form Handling**: React Hook Form
- **Icons**: Lucide React

## 📦 설치 및 실행

### 필수 요구사항

- Node.js 18+ 
- PostgreSQL 데이터베이스

### 설치

1. 저장소 클론
```bash
git clone <repository-url>
cd prompt-bank
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 파일에 다음 내용을 추가:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/prompt_bank"
```

4. 데이터베이스 설정
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

## 🏗️ 프로젝트 구조

```
prompt-bank/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── prompts/           # 프롬프트 관련 페이지
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   └── features/         # 기능별 컴포넌트
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 및 설정
├── stores/               # Zustand 스토어
├── prisma/               # 데이터베이스 스키마
└── public/               # 정적 파일
```

## 🔧 개발 가이드

### 코드 스타일

- TypeScript 엄격 모드 사용
- ESLint 및 Prettier 설정 준수
- 컴포넌트는 함수형 컴포넌트와 훅 사용
- 타입 안전성 우선

### API 구조

- RESTful API 설계
- 일관된 에러 처리
- 타입 안전한 응답 형식

### 상태 관리

- **Zustand**: 클라이언트 상태 (필터, UI 상태)
- **React Query**: 서버 상태 (API 데이터)

## 🧪 테스트

```bash
# 단위 테스트 실행
npm run test

# E2E 테스트 실행
npm run test:e2e
```

## 📦 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
npm start
```

### 환경 변수

프로덕션 환경에서는 다음 환경 변수를 설정하세요:

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `NEXTAUTH_SECRET`: 세션 암호화 키 (향후 인증 기능 추가 시)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🆘 문제 해결

### 일반적인 문제

1. **데이터베이스 연결 오류**
   - PostgreSQL 서비스가 실행 중인지 확인
   - DATABASE_URL 환경 변수 확인

2. **빌드 오류**
   - `npm run build` 실행 전 `npm install` 확인
   - TypeScript 타입 오류 해결

3. **개발 서버 시작 실패**
   - 포트 3000이 사용 중인지 확인
   - 환경 변수 설정 확인

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

© 2025 AI SQUARE. All rights reserved. 