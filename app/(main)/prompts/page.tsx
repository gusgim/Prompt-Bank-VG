import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PromptListContainer } from '@/components/features/prompts/PromptListContainer'

export default async function PromptsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return <PromptListContainer />
} 