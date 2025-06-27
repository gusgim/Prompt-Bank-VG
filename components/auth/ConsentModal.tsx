'use client'

import { useState } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ConsentModalProps {
  title: string
  content: string
  isOpen: boolean
  onClose: () => void
  onAgree: () => void
  onDisagree: () => void
  agreed?: boolean
}

export function ConsentModal({
  title,
  content,
  isOpen,
  onClose,
  onAgree,
  onDisagree,
  agreed = false
}: ConsentModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    setHasScrolledToBottom(isAtBottom)
  }

  if (!isOpen) return null

  // Markdown 형식을 HTML로 간단 변환 (text-sm 크기 적용)
  const formatContent = (text: string) => {
    return text
      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mb-3 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mb-2 mt-4 text-gray-800">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-sm font-medium mb-2 mt-3 text-gray-700">$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/^- (.*$)/gm, '<li class="ml-3 mb-1">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-3 mb-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              {agreed ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600 mr-2" />
              )}
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {!hasScrolledToBottom && !agreed && (
            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border">
              ⚠️ 동의하기 전에 전체 내용을 끝까지 읽어주세요.
            </p>
          )}
        </CardHeader>
        
        <CardContent className="flex-grow overflow-hidden flex flex-col">
          <div 
            className="flex-grow overflow-y-auto border rounded p-4 bg-gray-50"
            onScroll={handleScroll}
          >
            <div 
              className="prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={{ 
                __html: `<p class="mb-2">${formatContent(content)}</p>` 
              }}
            />
          </div>
          
          <div className="flex-shrink-0 pt-4 flex justify-end space-x-3">
            {agreed ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">동의 완료</span>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onDisagree}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  동의하지 않음
                </Button>
                <Button
                  onClick={onAgree}
                  disabled={!hasScrolledToBottom}
                  className="bg-[#FF4500] hover:bg-[#FF4500]/90 disabled:opacity-50"
                >
                  {hasScrolledToBottom ? '동의합니다' : '끝까지 읽어주세요'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 