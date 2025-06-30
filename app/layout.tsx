import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ToastProvider } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

// 동적 URL 생성
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://prompt-bank-vg-dun.vercel.app'
  }
  return 'http://localhost:3002'
}

const baseUrl = getBaseUrl()

export const metadata: Metadata = {
  title: "Prompt Bank of AI SQUARE",
  description: "AI 프롬프트 관리 및 저장 시스템",
  keywords: ["프롬프트 뱅크", "AI", "부동산경매", "AI SQUARE", "프롬프트 관리"],
  authors: [{ name: "AI SQUARE" }],
  creator: "AI SQUARE",
  publisher: "AI SQUARE",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    title: 'Prompt Bank of AI SQUARE',
    description: 'AI 프롬프트 관리 및 저장 시스템',
    siteName: 'Prompt Bank of AI SQUARE',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Prompt Bank of AI SQUARE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Bank of AI SQUARE',
    description: 'AI 프롬프트 관리 및 저장 시스템',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <Providers session={session}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
