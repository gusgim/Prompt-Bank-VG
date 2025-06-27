import PromptForm from '@/components/features/prompts/PromptForm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

export default async function NewPromptPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // 서버 사이드에서 카테고리 로드
  const prompts = await prisma.prompt.findMany({
    where: { userId: session.user.id },
    select: { category: true },
    distinct: ['category']
  })
  
  const categories = prompts.map((p: { category: string }) => p.category).filter(Boolean).sort()
  
  console.log('🎯 새 프롬프트 페이지 - 카테고리:', categories)

  return <PromptForm categories={categories} />
} 