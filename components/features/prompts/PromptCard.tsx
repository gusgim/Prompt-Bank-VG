'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Copy, Edit, Trash2, ExternalLink, Eye, Copy as CopyIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { getCategoryIcon } from '@/lib/category-icons'
import { deletePromptAction, trackPromptCopyAction } from '@/lib/actions'
import { PromptWithTags } from '@/lib/types'
import { cn } from '@/lib/utils'
import ShareButton from './ShareButton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PromptCardProps {
  prompt: PromptWithTags
  onDelete?: () => void
}

export function PromptCard({ prompt, onDelete }: PromptCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showToast } = useToast()

  const CategoryIcon = getCategoryIcon(prompt.category)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt.content)
      
      // 복사 횟수 추적
      try {
        await trackPromptCopyAction(prompt.id)
      } catch (trackError) {
        console.warn('복사 추적 실패:', trackError)
        // 추적 실패해도 복사 기능은 정상 동작
      }
      
      showToast('프롬프트가 클립보드에 복사되었습니다!', 'success')
    } catch (error) {
      showToast('복사에 실패했습니다.', 'error')
    }
  }, [prompt.content, prompt.id, showToast])

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    try {
      console.log('🗑️ 프롬프트 삭제 시작:', prompt.id)
      setIsDeleting(true)
      setShowDeleteModal(false)

      await deletePromptAction(prompt.id)
      
      console.log('✅ 프롬프트 삭제 성공')
      showToast('프롬프트가 삭제되었습니다.', 'success')
      onDelete?.()
    } catch (error) {
      console.error('💥 프롬프트 삭제 실패:', error)
      showToast(`삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error')
    } finally {
      setIsDeleting(false)
    }
  }, [prompt.id, showToast, onDelete])

  return (
    <>
      <Card className="group bg-white/85 backdrop-blur-md border-white/40 shadow-lg shadow-blue-200/40 hover:shadow-xl hover:shadow-[#FF4500]/30 hover:border-[#FF4500]/40 transition-all duration-300 hover:bg-white/90">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <CategoryIcon className="h-5 w-5 text-[#000080]" />
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 flex-1">
              {prompt.title}
            </h3>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center flex-wrap gap-2">
            <Badge variant="default" className="text-xs bg-[#000080] text-white hover:bg-[#000080]/90">
              {prompt.category}
            </Badge>
            {prompt.subCategory && (
              <Badge variant="outline" className="text-xs bg-white text-gray-700">
                {prompt.subCategory}
              </Badge>
            )}
          </div>
          
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-gray-600 text-sm line-clamp-3 cursor-help">
                  {prompt.content}
                </p>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="max-w-[400px] whitespace-pre-wrap bg-gray-800 text-white p-3 rounded-md shadow-lg z-50"
              >
                {prompt.content}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prompt.tags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="outline" 
                  className="text-xs px-2 py-1 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-700 hover:from-orange-100 hover:to-red-100 hover:border-orange-300 transition-all duration-200 font-medium shadow-sm"
                >
                  #{tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* 통계 정보 */}
          {((prompt as any).viewCount > 0 || (prompt as any).copyCount > 0) && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {(prompt as any).viewCount > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{(prompt as any).viewCount}</span>
                </div>
              )}
              {(prompt as any).copyCount > 0 && (
                <div className="flex items-center gap-1">
                  <CopyIcon className="h-3 w-3" />
                  <span>{(prompt as any).copyCount}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="hover:bg-[#FF4500] hover:text-white hover:border-[#FF4500] transition-colors"
              >
                <Copy className="h-4 w-4 mr-1" />
                복사
              </Button>
              
              <ShareButton
                promptId={prompt.id}
                isPublic={(prompt as any).isPublic || false}
                shareId={(prompt as any).shareId || null}
                title={prompt.title}
              />
              
              <Link href={`/prompts/${prompt.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:bg-[#000080] hover:text-white hover:border-[#000080] transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  보기
                </Button>
              </Link>
            </div>

            <div className="flex items-center space-x-1">
              <Link href={`/prompts/${prompt.id}/edit`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 hover:text-[#000080] hover:bg-[#000080]/10"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="프롬프트 삭제"
        message="정말로 이 프롬프트를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        type="danger"
      />
    </>
  )
} 