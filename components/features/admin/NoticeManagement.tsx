'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { NoticeWithCreator } from '@/lib/types'
import { 
  getAllNoticesAction, 
  createNoticeAction, 
  updateNoticeAction, 
  deleteNoticeAction, 
  toggleNoticeStatusAction 
} from '@/lib/actions'

interface NoticeFormData {
  title: string
  content: string
  category: string
  isImportant: boolean
  isActive: boolean
  order: number
}

const NOTICE_CATEGORIES = [
  { value: 'general', label: '일반' },
  { value: 'maintenance', label: '점검' },
  { value: 'update', label: '업데이트' },
  { value: 'urgent', label: '긴급' }
]

export function NoticeManagement() {
  const [notices, setNotices] = useState<NoticeWithCreator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<NoticeWithCreator | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; noticeId: string | null }>({
    isOpen: false,
    noticeId: null
  })
  
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    category: 'general',
    isImportant: false,
    isActive: true,
    order: 0
  })

  const { showToast } = useToast()

  // 공지사항 목록 로딩
  const loadNotices = async () => {
    try {
      setIsLoading(true)
      const result = await getAllNoticesAction()
      
      if (result.success && result.data) {
        setNotices(result.data)
      } else {
        showToast(result.error || '공지사항 조회 실패', 'error')
      }
    } catch (error) {
      showToast('공지사항 조회 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotices()
  }, [])

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      isImportant: false,
      isActive: true,
      order: 0
    })
    setEditingNotice(null)
    setIsFormOpen(false)
  }

  // 편집 모드로 전환
  const handleEdit = (notice: NoticeWithCreator) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      isImportant: notice.isImportant,
      isActive: notice.isActive,
      order: notice.order
    })
    setEditingNotice(notice)
    setIsFormOpen(true)
  }

  // 공지사항 저장 (생성/수정)
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('제목과 내용은 필수입니다.', 'error')
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('content', formData.content)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('isImportant', formData.isImportant.toString())
      formDataToSend.append('isActive', formData.isActive.toString())
      formDataToSend.append('order', formData.order.toString())

      let result
      if (editingNotice) {
        result = await updateNoticeAction(editingNotice.id, formDataToSend)
      } else {
        result = await createNoticeAction(formDataToSend)
      }

      if (result.success) {
        showToast(
          editingNotice ? '공지사항이 수정되었습니다.' : '공지사항이 생성되었습니다.',
          'success'
        )
        resetForm()
        loadNotices()
      } else {
        showToast(result.error || '저장 실패', 'error')
      }
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  // 공지사항 삭제
  const handleDelete = async () => {
    if (!deleteModal.noticeId) return

    try {
      const result = await deleteNoticeAction(deleteModal.noticeId)
      
      if (result.success) {
        showToast('공지사항이 삭제되었습니다.', 'success')
        loadNotices()
      } else {
        showToast(result.error || '삭제 실패', 'error')
      }
    } catch (error) {
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    } finally {
      setDeleteModal({ isOpen: false, noticeId: null })
    }
  }

  // 공지사항 상태 토글
  const handleToggleStatus = async (noticeId: string) => {
    try {
      const result = await toggleNoticeStatusAction(noticeId)
      
      if (result.success) {
        showToast('공지사항 상태가 변경되었습니다.', 'success')
        loadNotices()
      } else {
        showToast(result.error || '상태 변경 실패', 'error')
      }
    } catch (error) {
      showToast('상태 변경 중 오류가 발생했습니다.', 'error')
    }
  }

  // 카테고리 라벨 가져오기
  const getCategoryLabel = (category: string) => {
    const found = NOTICE_CATEGORIES.find(c => c.value === category)
    return found ? found.label : category
  }

  // 카테고리 색상 가져오기
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-orange-100 text-orange-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">공지사항을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">공지사항 관리</h2>
          <p className="text-gray-600 mt-1">사용자에게 표시될 공지사항을 관리합니다.</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>새 공지사항 추가</span>
        </Button>
      </div>

      {/* 공지사항 목록 */}
      <div className="grid gap-4">
        {notices.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
          </Card>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {notice.isImportant && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notice.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(notice.category)}`}>
                      {getCategoryLabel(notice.category)}
                    </span>
                    {!notice.isActive && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        비활성
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-2 line-clamp-2">
                    {notice.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>작성자: {notice.createdBy.name || notice.createdBy.email}</span>
                    <span>조회수: {notice.viewCount}</span>
                    <span>순서: {notice.order}</span>
                    <span>
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(notice.id)}
                    className="flex items-center space-x-1"
                  >
                    {notice.isActive ? (
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
                    onClick={() => handleEdit(notice)}
                    className="flex items-center space-x-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>편집</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteModal({ isOpen: true, noticeId: notice.id })}
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

      {/* 공지사항 생성/편집 폼 모달 */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingNotice ? '공지사항 편집' : '새 공지사항 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>

              <div>
                <Label htmlFor="content">내용 *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {NOTICE_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

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
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isImportant"
                    checked={formData.isImportant}
                    onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isImportant" className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>중요 공지 (메인 페이지 상단 표시)</span>
                  </Label>
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
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={resetForm}>
                취소
              </Button>
              <Button onClick={handleSave}>
                {editingNotice ? '수정' : '생성'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, noticeId: null })}
        onConfirm={handleDelete}
        title="공지사항 삭제"
        message="이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        type="danger"
      />
    </div>
  )
} 