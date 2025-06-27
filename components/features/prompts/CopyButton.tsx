'use client'

import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

interface CopyButtonProps {
  content: string
}

export default function CopyButton({ content }: CopyButtonProps) {
  const { showToast } = useToast()
  const { copyToClipboard } = useCopyToClipboard()

  const handleCopy = () => {
    copyToClipboard(content)
    showToast('프롬프트가 클립보드에 복사되었습니다!', 'success')
  }

  return (
    <Button
      onClick={handleCopy}
      size="sm"
      variant="outline"
      className="hover:bg-[#FF4500] hover:text-white hover:border-[#FF4500] transition-colors"
    >
      <Copy className="h-4 w-4 mr-1" />
      복사
    </Button>
  )
} 