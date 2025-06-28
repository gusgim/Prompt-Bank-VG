import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ToastProvider } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prompt Bank of 뱅가드AI경매",
  description: "AI × 부동산경매 전문가를 위한 프롬프트 아카이빙 시스템",
  keywords: ["프롬프트 뱅크", "AI", "부동산경매", "뱅가드AI경매", "프롬프트 관리"],
  authors: [{ name: "뱅가드AI경매" }],
  creator: "뱅가드AI경매",
  publisher: "뱅가드AI경매",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://prompt-bank-vg-dun.vercel.app'),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#FF4500' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://prompt-bank-vg-dun.vercel.app',
    title: 'Prompt Bank of 뱅가드AI경매',
    description: 'AI × 부동산경매 전문가를 위한 프롬프트 아카이빙 시스템',
    siteName: 'Prompt Bank of 뱅가드AI경매',
    images: [
      {
        url: 'https://prompt-bank-vg-dun.vercel.app/golden-gate-bridge.jpg',
        width: 1200,
        height: 630,
        alt: 'Prompt Bank of 뱅가드AI경매',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Bank of 뱅가드AI경매',
    description: 'AI × 부동산경매 전문가를 위한 프롬프트 아카이빙 시스템',
    images: ['https://prompt-bank-vg-dun.vercel.app/golden-gate-bridge.jpg'],
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
