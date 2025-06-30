import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig = {
  // 로그인 페이지 경로를 지정합니다.
  // 미들웨어는 이 경로를 사용하여 사용자를 리디렉션합니다.
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    // 인증 로직을 중앙에서 처리합니다.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/prompts') || 
                           nextUrl.pathname.startsWith('/admin') ||
                           nextUrl.pathname.startsWith('/dashboard') ||
                           nextUrl.pathname.startsWith('/analytics') ||
                           nextUrl.pathname.startsWith('/profile');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // 로그인 페이지로 리디렉션
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/prompts', nextUrl));
      }
      return true;
    },
  },
  // providers는 여기에 둘 수도 있지만, 미들웨어에서는 필요 없으므로
  // 메인 auth.ts 파일에 유지하는 것이 더 깔끔합니다.
  providers: [], 
} satisfies NextAuthConfig; 