'use client'

import { useState } from 'react'
import { Share2, Copy, ExternalLink, X } from 'lucide-react'
import { togglePromptShareAction } from '@/lib/actions'
import { ShareToggleResult } from '@/lib/types'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

interface ShareButtonProps {
  promptId: string
  isPublic: boolean
  shareId: string | null
  title: string
}

export default function ShareButton({ promptId, isPublic, shareId, title }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareData, setShareData] = useState<ShareToggleResult | null>(null)
  const { showToast } = useToast()
  const { copyToClipboard } = useCopyToClipboard()

  const handleToggleShare = async () => {
    try {
      setLoading(true)
      const result = await togglePromptShareAction(promptId)
      setShareData(result)
      showToast(result.message, 'success')
      
      // 공유가 활성화된 경우 모달 열기
      if (result.isPublic) {
        setShowModal(true)
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '공유 설정 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (shareData?.shareUrl) {
      copyToClipboard(shareData.shareUrl)
      showToast('공유 링크가 복사되었습니다!', 'success')
    }
  }

  const currentShareUrl = shareData?.shareUrl || (shareId ? `${window.location.origin}/share/${shareId}` : null)

  return (
    <>
      {/* 공유 버튼 */}
      <Button
        onClick={isPublic ? () => setShowModal(true) : handleToggleShare}
        disabled={loading}
        size="sm"
        variant={isPublic ? "default" : "outline"}
        className={`${isPublic ? 'bg-[#FF4500] hover:bg-[#FF4500]/90 text-white' : ''}`}
      >
        <Share2 className="h-4 w-4 mr-1" />
        {loading ? '처리중...' : isPublic ? '공유중' : '공유'}
      </Button>

      {/* 공유 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                프롬프트 공유
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
                <p className="text-sm text-gray-600">
                  이 프롬프트가 공개적으로 공유되고 있습니다.
                </p>
              </div>

              {currentShareUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    공유 링크
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={currentShareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <Button
                      onClick={handleCopyLink}
                      size="sm"
                      className="rounded-l-none border-l-0"
                      variant="outline"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={handleToggleShare}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? '처리중...' : '공유 해제'}
                </Button>
                
                {currentShareUrl && (
                  <Button
                    onClick={() => window.open(currentShareUrl, '_blank')}
                    className="flex-1 bg-[#FF4500] hover:bg-[#FF4500]/90"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    보기
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 