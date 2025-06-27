'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { BannerWithCreator } from '@/lib/types'
import { 
  getAllBannersAction, 
  createBannerAction, 
  updateBannerAction, 
  deleteBannerAction, 
  toggleBannerStatusAction 
} from '@/lib/actions'
import { getAutoThumbnail, isYouTubeUrl } from '@/lib/utils'

interface BannerFormData {
  title: string
  description: string
  url: string
  imageUrl: string
  isActive: boolean
  order: number
}

export function BannerManagement() {
  const [banners, setBanners] = useState<BannerWithCreator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerWithCreator | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bannerId: string | null }>({
    isOpen: false,
    bannerId: null
  })
  const [hasLoaded, setHasLoaded] = useState(false)
  
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    description: '',
    url: '',
    imageUrl: '',
    isActive: true,
    order: 0
  })

  // 이미지 업로드 관련 상태
  const [isUploading, setIsUploading] = useState(false)
  const [autoThumbnailPreview, setAutoThumbnailPreview] = useState<string | null>(null)

  const { showToast } = useToast()

  // 배너 목록 로딩
  const loadBanners = async (force = false) => {
    if (!force && hasLoaded) return // force가 true가 아니고 이미 로딩했으면 중복 방지
    
    try {
      setIsLoading(true)
      const result = await getAllBannersAction()
      
      if (result.success && result.data) {
        setBanners(result.data)
      } else {
        showToast(result.error || '배너 조회 실패', 'error')
      }
    } catch (error) {
      console.error('배너 조회 중 예외:', error)
      showToast('배너 조회 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [])

  // 폼 초기화
  // 파일 업로드 함수
  const uploadFile = async (file: File): Promise<string> => {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    
    const response = await fetch('/api/upload/banner-image', {
      method: 'POST',
      body: uploadFormData
    })
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || '파일 업로드에 실패했습니다.')
    }
    
    return result.imageUrl
  }

  // URL 변경 시 자동 썸네일 미리보기 업데이트
  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, url })
    
    // 자동 썸네일 미리보기 생성
    if (url && !formData.imageUrl) {
      if (isYouTubeUrl(url)) {
        const thumbnail = getAutoThumbnail(url)
        setAutoThumbnailPreview(thumbnail)
      } else {
        // 블로그 URL의 경우 실시간으로는 무거우므로 저장 시에만 처리
        setAutoThumbnailPreview(null)
      }
    } else {
      setAutoThumbnailPreview(null)
    }
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const imageUrl = await uploadFile(file)
      setFormData({ ...formData, imageUrl })
      showToast('이미지가 업로드되었습니다.', 'success')
    } catch (error) {
      showToast('이미지 업로드 실패', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      imageUrl: '',
      isActive: true,
      order: 0
    })
    setEditingBanner(null)
    setAutoThumbnailPreview(null)
    setIsFormOpen(false)
  }

  // 편집 모드로 전환
  const handleEdit = (banner: BannerWithCreator) => {
    setFormData({
      title: banner.title,
      description: banner.description || '',
      url: banner.url,
      imageUrl: banner.imageUrl || '',
      isActive: banner.isActive,
      order: banner.order
    })
    setEditingBanner(banner)
    setIsFormOpen(true)
  }

  // 배너 저장 (생성/수정)
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      showToast('제목과 URL은 필수입니다.', 'error')
      return
    }

    // YouTube가 아닌 URL의 경우 이미지 업로드 필수
    if (!isYouTubeUrl(formData.url) && !formData.imageUrl.trim()) {
      showToast('블로그나 일반 웹사이트는 썸네일 이미지를 업로드해주세요.', 'error')
      return
    }

    try {
      setIsUploading(true)

      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('url', formData.url)
      formDataToSend.append('imageUrl', formData.imageUrl)
      formDataToSend.append('isActive', formData.isActive.toString())
      formDataToSend.append('order', formData.order.toString())

      let result
      if (editingBanner) {
        result = await updateBannerAction(editingBanner.id, formDataToSend)
      } else {
        result = await createBannerAction(formDataToSend)
      }

      if (result.success) {
        showToast(
          editingBanner ? '배너가 수정되었습니다.' : '배너가 생성되었습니다.',
          'success'
        )
        resetForm()
        loadBanners(true) // 강제 새로고침
      } else {
        showToast(result.error || '저장 실패', 'error')
      }
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  // 배너 삭제
  const handleDelete = async () => {
    if (!deleteModal.bannerId) return

    try {
      const result = await deleteBannerAction(deleteModal.bannerId)
      
      if (result.success) {
        showToast('배너가 삭제되었습니다.', 'success')
        loadBanners(true) // 강제 새로고침
      } else {
        showToast(result.error || '삭제 실패', 'error')
      }
    } catch (error) {
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    } finally {
      setDeleteModal({ isOpen: false, bannerId: null })
    }
  }

  // 배너 상태 토글
  const handleToggleStatus = async (bannerId: string) => {
    try {
      const result = await toggleBannerStatusAction(bannerId)
      
      if (result.success) {
        showToast('배너 상태가 변경되었습니다.', 'success')
        loadBanners(true) // 강제 새로고침
      } else {
        showToast(result.error || '상태 변경 실패', 'error')
      }
    } catch (error) {
      showToast('상태 변경 중 오류가 발생했습니다.', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">배너 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">배너 관리</h2>
          <p className="text-gray-600 mt-1">메인 페이지 오른쪽 배너를 관리합니다.</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>새 배너 추가</span>
        </Button>
      </div>

      {/* 배너 목록 */}
      <div className="grid gap-4">
        {banners.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">등록된 배너가 없습니다.</p>
          </Card>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{banner.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      banner.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.isActive ? '활성' : '비활성'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      순서: {banner.order}
                    </span>
                  </div>
                  
                  {banner.description && (
                    <p className="text-gray-600 mb-2">{banner.description}</p>
                  )}
                  
                  <div className="space-y-1 text-sm text-gray-500">
                    <p><span className="font-medium">URL:</span> {banner.url}</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">썸네일:</span>
                      {banner.imageUrl ? (
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            업로드됨
                          </span>
                          <img 
                            src={banner.imageUrl} 
                            alt="썸네일" 
                            className="w-8 h-5 object-cover rounded border"
                          />
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                          {isYouTubeUrl(banner.url) ? '자동 생성' : '이미지 없음'}
                        </span>
                      )}
                    </div>
                    <p>
                      <span className="font-medium">생성자:</span> {banner.createdBy.name || banner.createdBy.email}
                    </p>
                    <p>
                      <span className="font-medium">생성일:</span> {new Date(banner.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(banner.id)}
                    className="flex items-center space-x-1"
                  >
                    {banner.isActive ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>비활성화</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>활성화</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                    className="flex items-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>편집</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, bannerId: banner.id })}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>삭제</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 배너 생성/편집 폼 모달 */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingBanner ? '배너 편집' : '새 배너 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="배너 제목을 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="배너 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com"
                />
                {autoThumbnailPreview && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">자동 썸네일 미리보기:</p>
                    <img 
                      src={autoThumbnailPreview} 
                      alt="썸네일 미리보기" 
                      className="w-32 h-18 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              {formData.url && (
                <div>
                  <Label htmlFor="thumbnail">
                    썸네일 이미지 {isYouTubeUrl(formData.url) ? '(선택사항)' : '*'}
                  </Label>
                  <div className="space-y-2">
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    {isYouTubeUrl(formData.url) ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>YouTube 링크:</strong> 자동으로 썸네일이 생성됩니다. 
                          원하시면 직접 이미지를 업로드하여 대체할 수 있습니다.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-sm text-orange-800">
                          <strong>블로그/웹사이트 링크:</strong> 썸네일 이미지를 직접 업로드해주세요. 
                          16:9 비율을 권장합니다.
                        </p>
                      </div>
                    )}
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">미리보기:</p>
                        <img
                          src={formData.imageUrl}
                          alt="미리보기"
                          className="w-32 h-20 object-cover rounded border shadow-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="mt-2 text-red-600 hover:text-red-800"
                        >
                          이미지 제거
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}



              <div>
                <Label htmlFor="order">정렬 순서</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">활성화</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={resetForm} disabled={isUploading}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={isUploading}>
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>저장 중...</span>
                  </div>
                ) : (
                  editingBanner ? '수정' : '생성'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, bannerId: null })}
        onConfirm={handleDelete}
        title="배너 삭제"
        message="이 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        type="danger"
      />
    </div>
  )
} 