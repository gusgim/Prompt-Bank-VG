'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, SessionProviderProps } from 'next-auth/react'
import { useState } from 'react'

export default function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode,
  session: SessionProviderProps['session'] 
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        retry: 1,
      },
    },
  }))

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
} 