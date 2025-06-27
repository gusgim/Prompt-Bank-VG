import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';

// authConfig에서 auth 함수와 설정만 가져와서 미들웨어를 초기화합니다.
export default NextAuth(authConfig).auth;

export const config = {
  // 인증이 필요한 경로들을 보호합니다.
  // API 라우트, 정적 파일들은 자체적으로 처리하므로 제외합니다.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|golden-gate-bridge.jpg|uploads).*)',
  ],
}; 