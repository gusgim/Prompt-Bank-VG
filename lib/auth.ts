import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import prisma from "./prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

// 역할 타입 정의
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth 프로바이더
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // 이메일/비밀번호 로그인
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string
          }
        })

        if (!user || !user.password) {
          return null
        }

        // 계정 상태 확인
        if (!user.isActive) {
          throw new Error("account_deactivated")
        }

        if (user.expiresAt && new Date(user.expiresAt) <= new Date()) {
          throw new Error("account_expired")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          isActive: user.isActive,
          expiresAt: user.expiresAt,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: process.env.SESSION_MAX_AGE 
      ? parseInt(process.env.SESSION_MAX_AGE)
      : process.env.NODE_ENV === 'development' 
        ? 24 * 60 * 60 // 개발 환경: 24시간
        : 60 * 60, // 프로덕션: 1시간
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // 초기 로그인
      if (user) {
        token.role = user.role
        token.isActive = user.isActive
        token.expiresAt = user.expiresAt
        // 명시적 만료 시간 설정
        token.absoluteExpiry = Date.now() + (process.env.SESSION_MAX_AGE 
          ? parseInt(process.env.SESSION_MAX_AGE) * 1000
          : process.env.NODE_ENV === 'development' 
            ? 24 * 60 * 60 * 1000 // 개발 환경: 24시간
            : 60 * 60 * 1000) // 프로덕션: 1시간
      }
      
      // 절대 만료 시간 체크
      if (token.absoluteExpiry && typeof token.absoluteExpiry === 'number' && Date.now() > token.absoluteExpiry) {
        // 토큰을 null로 반환하면 세션이 무효화됨
        return null
      }
      
      // 토큰 만료 시간이 임박한 경우 (30분 전)
      const now = Math.floor(Date.now() / 1000)
      const tokenExpires = typeof token.exp === 'number' ? token.exp : 0
      const shouldRefresh = tokenExpires - now < 30 * 60 // 30분
      
      if (shouldRefresh && account?.provider === 'google') {
        // Google OAuth는 자동으로 갱신됨
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.isActive = token.isActive as boolean
        session.user.expiresAt = token.expiresAt as Date | null
      }
      return session
    },
  },
})

// 타입 확장
declare module "next-auth" {
  interface User {
    role: UserRole
    isActive: boolean
    expiresAt?: Date | null
  }
  
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      role: UserRole
      isActive: boolean
      expiresAt?: Date | null
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole
    isActive: boolean
    expiresAt?: Date | null
    absoluteExpiry?: number
  }
} 