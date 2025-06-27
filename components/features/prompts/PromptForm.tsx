'use client'

import { memo, useCallback, useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { PromptWithTags, PromptFormData } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useForm, SubmitHandler } from "react-hook-form"
import { Plus } from "lucide-react"
import { useToast } from '@/components/ui/Toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { createPrompt, updatePrompt } from '@/lib/actions'

interface PromptFormProps {
  prompt?: PromptWithTags
  categories?: string[]
}

type FormValues = {
  title: string
  content: string
  category: string
  subCategory: string
  tags: string
}

// Category input component
const CategoryInput = memo<{
  value: string
  onChange: (value: string) => void
  onAddNewCategory?: (category: string) => void
  categories: string[]
  isLoading?: boolean
  error?: string
}>(({ value, onChange, onAddNewCategory, categories, isLoading = false, error }) => {
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  const handleAddNewCategory = useCallback(() => {
    if (newCategory.trim()) {
      const trimmedCategory = newCategory.trim()
      console.log('🆕 새 카테고리 추가:', trimmedCategory)
      
      // 부모 컴포넌트의 핸들러 호출 (카테고리 목록 업데이트 + 선택)
      if (onAddNewCategory) {
        onAddNewCategory(trimmedCategory)
      } else {
        // 기존 방식 (fallback)
        onChange(trimmedCategory)
      }
      
      setNewCategory('')
      setShowNewCategoryInput(false)
      console.log('✅ 새 카테고리 추가 완료, 선택됨:', trimmedCategory)
    }
  }, [newCategory, onChange, onAddNewCategory])

  if (showNewCategoryInput) {
    return (
      <div className="space-y-2">
        <Input
          placeholder="새 카테고리명을 입력하세요"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddNewCategory()
            }
            if (e.key === 'Escape') {
              setShowNewCategoryInput(false)
              setNewCategory('')
            }
          }}
          autoFocus
        />
        <div className="flex gap-2">
          <Button 
            type="button" 
            size="sm" 
            onClick={handleAddNewCategory}
            disabled={!newCategory.trim()}
          >
            사용
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setShowNewCategoryInput(false)
              setNewCategory('')
            }}
          >
            취소
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="h-10 flex items-center px-3 text-sm text-muted-foreground rounded-md border">
          카테고리 로딩 중...
        </div>
      ) : error ? (
        <div className="h-10 flex items-center px-3 text-sm text-destructive rounded-md border border-destructive">
          {error}
        </div>
      ) : (
        <select 
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            {categories.length > 0 ? '카테고리를 선택하세요' : '사용 가능한 카테고리가 없습니다'}
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      )}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowNewCategoryInput(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        새 카테고리 입력
      </Button>
    </div>
  )
})
CategoryInput.displayName = 'CategoryInput'

export default memo(function PromptForm({ prompt, categories = [] }: PromptFormProps) {
  const router = useRouter()
  const isEditMode = !!prompt
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [hasUserSelectedCategory, setHasUserSelectedCategory] = useState(!!prompt)
  const [localCategories, setLocalCategories] = useState<string[]>(categories)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      title: prompt?.title || '',
      content: prompt?.content || '',
      category: prompt?.category || '',
      subCategory: prompt?.subCategory || '',
      tags: prompt?.tags?.map(t => t.name).join(', ') || ''
    }
  })

  const selectedCategory = watch('category')

  // 서버에서 받은 카테고리 목록이 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalCategories(categories)
  }, [categories])

  // Set default category when categories are available (only if user hasn't manually selected one)
  useEffect(() => {
    if (localCategories.length > 0 && !selectedCategory && !prompt && !hasUserSelectedCategory) {
      console.log('🎯 기본 카테고리 설정:', localCategories[0])
      setValue('category', localCategories[0])
    }
  }, [localCategories, selectedCategory, setValue, prompt, hasUserSelectedCategory])

  // 카테고리 변경 핸들러 (사용자가 직접 선택했음을 표시)
  const handleCategoryChange = useCallback((value: string) => {
    console.log('🎯 사용자가 카테고리 선택:', value)
    setHasUserSelectedCategory(true)
    setValue('category', value, { shouldValidate: true })
  }, [setValue])

  // 새 카테고리 추가 핸들러
  const handleAddNewCategory = useCallback((newCategory: string) => {
    console.log('🆕 새 카테고리 추가:', newCategory)
    
    // 중복 체크
    if (!localCategories.includes(newCategory)) {
      setLocalCategories(prev => [...prev, newCategory])
      console.log('📝 로컬 카테고리 목록에 추가:', newCategory)
    }
    
    // 새 카테고리를 선택된 상태로 설정
    setHasUserSelectedCategory(true)
    setValue('category', newCategory, { shouldValidate: true })
    console.log('✅ 새 카테고리 선택 완료:', newCategory)
  }, [localCategories, setValue])

  const onSubmit: SubmitHandler<FormValues> = useCallback((data) => {
    if (!data.category || data.category.trim() === '') {
      showToast('카테고리를 선택하거나 입력해주세요.', 'error')
      return
    }
    
    console.log('📝 폼 제출 데이터:', data)
    
    const formData: PromptFormData = {
      ...data,
      tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    startTransition(async () => {
      try {
        if (isEditMode && prompt) {
          await updatePrompt(prompt.id, formData)
          showToast('프롬프트가 성공적으로 수정되었습니다!', 'success')
          router.push(`/prompts/${prompt.id}`)
        } else {
          const result = await createPrompt(formData)
          showToast(`프롬프트 "${data.title}"가 "${data.category}" 카테고리에 성공적으로 생성되었습니다!`, 'success')
          // 메인 페이지로 이동 (API 문제 해결까지 임시 조치)
          router.push('/')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        showToast(`${isEditMode ? '수정' : '생성'} 실패: ${errorMessage}`, 'error')
      }
    })
  }, [isEditMode, prompt, router, showToast])

  const isLoading = isPending || isSubmitting

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isEditMode ? '프롬프트 수정' : '새 프롬프트 작성'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input 
                id="title" 
                {...register("title", { 
                  required: "제목은 필수입니다",
                  minLength: { value: 1, message: "제목은 1자 이상이어야 합니다" },
                  maxLength: { value: 255, message: "제목은 255자 이하여야 합니다" }
                })} 
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <Textarea 
                id="content" 
                {...register("content", { 
                  required: "내용은 필수입니다",
                  minLength: { value: 1, message: "내용은 1자 이상이어야 합니다" }
                })} 
                className="min-h-48" 
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                <CategoryInput
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  onAddNewCategory={handleAddNewCategory}
                  categories={localCategories}
                  isLoading={isLoading}
                />
                {errors.category && (
                  <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
                )}
                
                {/* 디버그 정보 (개발 환경에서만) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    🔍 현재 카테고리: "{selectedCategory}" | 사용자 선택됨: {hasUserSelectedCategory ? '✅' : '❌'}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subCategory">하위 카테고리</Label>
                <Input 
                  id="subCategory" 
                  {...register("subCategory")} 
                  placeholder="선택사항"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
              <Input 
                id="tags" 
                {...register("tags")} 
                placeholder="예: React, TypeScript, Next.js"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : (isEditMode ? "수정" : "저장")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
})
