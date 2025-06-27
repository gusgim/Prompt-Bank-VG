/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || (
      process.env.NODE_ENV === 'production' 
        ? process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'https://your-domain.com'
        : 'http://localhost:3002'
    ),
  },
  experimental: {
    instrumentationHook: false
  },
  // 프로덕션에서 console.log 제거
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: false,
  },

};

export default nextConfig; 