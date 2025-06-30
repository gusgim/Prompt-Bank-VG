'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PromptFormData } from '@/lib/types'
import { Prisma, Role } from '@prisma/client'
import { PromptFilters, PromptWithTags, PaginatedResponse } from '@/lib/types'
import { 
  CONSENT_CONTENTS, 
  hasAllRequiredConsents, 
  recordUserConsent, 
  logAdminAccess,
  ConsentType 
} from '@/lib/legal-protection'

// prevState is not used, but required for useFormState.
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // signIn will throw an error on failure and redirect on success.
    // The redirect will automatically go to '/prompts' because of the logic in `app/page.tsx`.
    // To add the toast, we can redirect from here.
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: '/prompts',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      const customError = error.cause?.err?.message
      if (
        customError === 'account_deactivated' ||
        customError === 'account_expired'
      ) {
        return customError
      }

      switch (error.type) {
        case 'CredentialsSignin':
          return 'CredentialsSignin'
        default:
          return 'Something went wrong.'
      }
    }
    throw error // Re-throw non-AuthError errors
  }
}

export async function createPrompt(data: PromptFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {

    const prompt = await prisma.prompt.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        subCategory: data.subCategory || null,
        userId: session.user.id,
        tags: {
          connectOrCreate: data.tags.map(tagName => ({
            where: { 
              name_userId: {
                name: tagName,
                userId: session.user.id
              }
            },
            create: { 
              name: tagName,
              userId: session.user.id
            }
          }))
        }
      },
      include: {
        tags: true
      }
    })

    console.log('✅ 프롬프트 생성 성공:', prompt.id)
    
    revalidatePath('/')
    revalidatePath('/prompts')
    
    return { success: true, prompt }
  } catch (error) {
    console.error('💥 프롬프트 생성 에러:', error)
    throw new Error('프롬프트 생성 중 오류가 발생했습니다.')
  }
}

export async function updatePrompt(id: string, data: PromptFormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    // 기존 프롬프트 확인
    const existingPrompt = await prisma.prompt.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingPrompt) {
      throw new Error('프롬프트를 찾을 수 없습니다.')
    }

    // 기존 태그 연결 해제
    await prisma.prompt.update({
      where: { id },
      data: {
        tags: {
          set: []
        }
      }
    })

    // 프롬프트 업데이트
    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        subCategory: data.subCategory || null,
        tags: {
          connectOrCreate: data.tags.map(tagName => ({
            where: { 
              name_userId: {
                name: tagName,
                userId: session.user.id
              }
            },
            create: { 
              name: tagName,
              userId: session.user.id
            }
          }))
        }
      },
      include: {
        tags: true
      }
    })

    revalidatePath('/')
    revalidatePath('/prompts')
    revalidatePath(`/prompts/${id}`)
    
    return { success: true, prompt }
  } catch (error) {
    console.error('프롬프트 수정 에러:', error)
    throw new Error('프롬프트 수정 중 오류가 발생했습니다.')
  }
}

export async function getPromptsAction(filters: PromptFilters = {}) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('인증이 필요합니다.')
    }

    const { query, category, tags, page = 1 } = filters
    const limit = 9

    // 기본 검색 조건
    const where: Prisma.PromptWhereInput = {
      userId: session.user.id,
    }
    
    // 텍스트 검색
    if (query && query.length > 0) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ]
    }
    
    // 카테고리 필터
    if (category && category.length > 0) {
      where.category = { equals: category }
    }
    
    // 태그 필터
    if (tags && tags.length > 0) {
      where.tags = { 
        some: { 
          name: { in: tags },
          userId: session.user.id
        } 
      }
    }

    const [prompts, totalCount] = await prisma.$transaction([
      prisma.prompt.findMany({
        where,
        include: {
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prompt.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return {
      success: true,
      data: prompts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('프롬프트 조회 오류:', error)
    throw new Error('프롬프트 조회에 실패했습니다.')
  }
}

export async function getCategoriesAction() {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('인증이 필요합니다.')
    }

    // 기본 카테고리 목록
    const defaultCategories = ['general', 'coding', 'real_estate']
    
    // 현재 사용자가 실제 사용 중인 카테고리들을 조회
    const userCategories = await prisma.prompt.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    })
    
    const userCategoryNames = userCategories.map(c => c.category)
    const allCategories = Array.from(new Set([...defaultCategories, ...userCategoryNames]))
    
    return allCategories
  } catch (error) {
    console.error('카테고리 조회 오류:', error)
    throw new Error('카테고리 조회에 실패했습니다.')
  }
}

export async function getTagsAction() {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('인증이 필요합니다.')
    }

    const tags = await prisma.tag.findMany({
      where: {
        userId: session.user.id,
        prompts: {
          some: {},
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return tags
  } catch (error) {
    console.error('태그 조회 오류:', error)
    throw new Error('태그 조회에 실패했습니다.')
  }
}

export async function getPromptByIdAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('인증이 필요합니다.')
    }

    const prompt = await prisma.prompt.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        tags: true,
      },
    })

    if (!prompt) {
      throw new Error('프롬프트를 찾을 수 없습니다.')
    }

    return prompt
  } catch (error) {
    console.error('프롬프트 상세 조회 오류:', error)
    throw error
  }
}

export async function deletePromptAction(id: string): Promise<{ success: boolean }> {
  const session = await auth()
    
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
    }

  try {
    // 사용자의 프롬프트인지 확인
    const prompt = await prisma.prompt.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!prompt) {
      throw new Error('프롬프트를 찾을 수 없습니다.')
    }

    // 프롬프트 삭제
    await prisma.prompt.delete({
      where: { id }
    })

    revalidatePath('/')
    revalidatePath('/prompts')

    return { success: true }
  } catch (error) {
    console.error('프롬프트 삭제 에러:', error)
    throw new Error('프롬프트 삭제 중 오류가 발생했습니다.')
  }
}

// 🎯 대시보드 통계 서버 액션들

export async function getPromptStatsAction() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    // 총 프롬프트 수
    const totalPrompts = await prisma.prompt.count({
      where: { userId: session.user.id }
    })

    // 총 카테고리 수 (카테고리가 있는 것들만)
    const allPrompts = await prisma.prompt.findMany({
      where: { userId: session.user.id },
      select: { category: true }
    })

    const uniqueCategories = new Set<string>()
    allPrompts.forEach(p => {
      if (p.category) {
        uniqueCategories.add(p.category)
      }
    })
    const distinctCategories = Array.from(uniqueCategories)

    // 총 태그 수
    const totalTags = await prisma.tag.count({
      where: { userId: session.user.id }
    })

    // 이번 달 생성된 프롬프트 수
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const thisMonthPrompts = await prisma.prompt.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: thisMonth }
      }
    })

    return {
      totalPrompts,
      totalCategories: distinctCategories.length,
      totalTags,
      thisMonthPrompts
    }
  } catch (error) {
    console.error('프롬프트 통계 조회 에러:', error)
    throw new Error('통계 조회 중 오류가 발생했습니다.')
  }
}

export async function getCategoryStatsAction() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    // 카테고리별 프롬프트 수 계산
    const prompts = await prisma.prompt.findMany({
      where: { userId: session.user.id },
      select: { category: true }
    })

    // 카테고리별로 그룹화하여 개수 계산
    const categoryMap = new Map<string, number>()
    
    prompts.forEach(prompt => {
      const category = prompt.category || '미분류'
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })

    // 카운트 순으로 정렬
    const categoryStats = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)

    return categoryStats
  } catch (error) {
    console.error('카테고리 통계 조회 에러:', error)
    throw new Error('카테고리 통계 조회 중 오류가 발생했습니다.')
  }
}

export async function getMonthlyStatsAction() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    // 최근 6개월 데이터
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const prompts = await prisma.prompt.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: sixMonthsAgo }
      },
      select: { createdAt: true }
    })

    // 월별로 그룹화
    const monthlyData = prompts.reduce((acc, prompt) => {
      const month = prompt.createdAt.toISOString().slice(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 최근 6개월 배열 생성
    const result = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().slice(0, 7)
      const monthName = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })
      
      result.push({
        month: monthName,
        count: monthlyData[monthKey] || 0
      })
    }

    return result
  } catch (error) {
    console.error('월별 통계 조회 에러:', error)
    throw new Error('월별 통계 조회 중 오류가 발생했습니다.')
  }
}

export async function getTagStatsAction() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    const tagStats = await prisma.tag.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { prompts: true }
        }
      },
      orderBy: {
        prompts: { _count: 'desc' }
      },
      take: 20 // 상위 20개 태그
    })

    return tagStats.map(tag => ({
      name: tag.name,
      count: tag._count.prompts
    }))
  } catch (error) {
    console.error('태그 통계 조회 에러:', error)
    throw new Error('태그 통계 조회 중 오류가 발생했습니다.')
  }
}

// 🔗 프롬프트 공유 시스템 서버 액션들

export async function togglePromptShareAction(promptId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    // 프롬프트 소유권 확인
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        userId: session.user.id
      }
    })

    if (!prompt) {
      throw new Error('프롬프트를 찾을 수 없습니다.')
    }

    // 공유 상태 토글
    if (prompt.isPublic) {
      // 공유 해제
      const updatedPrompt = await prisma.prompt.update({
        where: { id: promptId },
        data: {
          isPublic: false,
          shareId: null,
          sharedAt: null
        }
      })
      
      revalidatePath('/')
      revalidatePath('/prompts')
      revalidatePath(`/prompts/${promptId}`)
      
      return { 
        success: true, 
        isPublic: false, 
        shareId: null,
        message: '프롬프트 공유가 해제되었습니다.' 
      }
    } else {
      // 공유 활성화
      const shareId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      
      const updatedPrompt = await prisma.prompt.update({
        where: { id: promptId },
        data: {
          isPublic: true,
          shareId: shareId,
          sharedAt: new Date()
        }
      })
      
      revalidatePath('/')
      revalidatePath('/prompts')
      revalidatePath(`/prompts/${promptId}`)
      
      return { 
        success: true, 
        isPublic: true, 
        shareId: shareId,
        shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/share/${shareId}`,
        message: '프롬프트가 공유되었습니다.' 
      }
    }
  } catch (error) {
    console.error('프롬프트 공유 토글 에러:', error)
    throw new Error('프롬프트 공유 설정 중 오류가 발생했습니다.')
  }
}

export async function getSharedPromptAction(shareId: string) {
  try {
    const prompt = await prisma.prompt.findFirst({
      where: {
        shareId: shareId,
        isPublic: true
      },
      include: {
        tags: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!prompt) {
      throw new Error('공유된 프롬프트를 찾을 수 없습니다.')
    }

    const authorName = prompt.user ? (prompt.user.name || prompt.user.email) : 'Anonymous';

    return {
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      subCategory: prompt.subCategory,
      tags: prompt.tags,
      author: authorName || 'Anonymous',
      sharedAt: prompt.sharedAt,
      createdAt: prompt.createdAt
    }
  } catch (error) {
    console.error('공유 프롬프트 조회 에러:', error)
    throw new Error('공유된 프롬프트를 불러오는 중 오류가 발생했습니다.')
  }
}

export async function getPublicPromptsAction() {
  try {
    const prompts = await prisma.prompt.findMany({
      where: {
        isPublic: true,
        shareId: { not: null }
      },
      include: {
        tags: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        sharedAt: 'desc'
      },
      take: 50 // 최근 50개
    })

    return prompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      content: prompt.content.substring(0, 200) + (prompt.content.length > 200 ? '...' : ''), // 미리보기용 요약
      category: prompt.category,
      tags: prompt.tags,
      author: prompt.user.name || prompt.user.email || 'Anonymous',
      shareId: prompt.shareId,
      sharedAt: prompt.sharedAt,
      createdAt: prompt.createdAt
    }))
  } catch (error) {
    console.error('공개 프롬프트 목록 조회 에러:', error)
    throw new Error('공개 프롬프트 목록을 불러오는 중 오류가 발생했습니다.')
  }
}

// 📊 프롬프트 분석 및 통계 서버 액션들

export async function trackPromptViewAction(promptId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    // 프롬프트 조회수 증가 (소유자 확인)
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        userId: session.user.id
      }
    })

    if (!prompt) {
      throw new Error('프롬프트를 찾을 수 없습니다.')
    }

    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        viewCount: { increment: 1 },
        lastViewed: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('프롬프트 조회 추적 에러:', error)
    throw new Error('조회 추적 중 오류가 발생했습니다.')
  }
}

export async function trackPromptCopyAction(promptId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    // 프롬프트 복사수 증가 (소유자 확인)
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        userId: session.user.id
      }
    })

    if (!prompt) {
      throw new Error('프롬프트를 찾을 수 없습니다.')
    }

    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        copyCount: { increment: 1 },
        lastCopied: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('프롬프트 복사 추적 에러:', error)
    throw new Error('복사 추적 중 오류가 발생했습니다.')
  }
}

export async function getPromptAnalyticsAction(promptId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        userId: session.user.id
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        copyCount: true,
        lastViewed: true,
        lastCopied: true,
        createdAt: true,
        isPublic: true,
        sharedAt: true
      }
    })

    if (!prompt) {
      throw new Error('프롬프트를 찾을 수 없습니다.')
    }

    return prompt
  } catch (error) {
    console.error('프롬프트 분석 데이터 조회 에러:', error)
    throw new Error('분석 데이터를 불러오는 중 오류가 발생했습니다.')
  }
}

export async function getTopPromptsAction(type: 'viewed' | 'copied' = 'viewed', limit: number = 10) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    const orderBy = type === 'viewed' 
      ? { viewCount: 'desc' as const }
      : { copyCount: 'desc' as const }

    const prompts = await prisma.prompt.findMany({
      where: {
        userId: session.user.id,
        [type === 'viewed' ? 'viewCount' : 'copyCount']: { gt: 0 }
      },
      include: {
        tags: true
      },
      orderBy: [
        orderBy,
        { createdAt: 'desc' as const }
      ],
      take: limit
    })

    return prompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      category: prompt.category,
      tags: prompt.tags,
      viewCount: prompt.viewCount,
      copyCount: prompt.copyCount,
      lastViewed: prompt.lastViewed,
      lastCopied: prompt.lastCopied,
      createdAt: prompt.createdAt
    }))
  } catch (error) {
    console.error('인기 프롬프트 조회 에러:', error)
    throw new Error('인기 프롬프트를 불러오는 중 오류가 발생했습니다.')
  }
}

export async function getUserAnalyticsAction() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('로그인이 필요합니다.')
  }

  try {
    // 병렬로 통계 데이터 조회
    const [
      totalStats,
      recentActivity,
      topViewedPrompts,
      topCopiedPrompts,
      categoryStats
    ] = await Promise.all([
      // 전체 통계
      prisma.prompt.aggregate({
        where: { userId: session.user.id },
        _sum: {
          viewCount: true,
          copyCount: true
        },
        _count: true
      }),
      
      // 최근 7일 활동
      prisma.prompt.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { lastViewed: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            { lastCopied: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
          ]
        },
        select: {
          id: true,
          title: true,
          lastViewed: true,
          lastCopied: true,
          viewCount: true,
          copyCount: true
        },
        orderBy: [
          { lastViewed: 'desc' },
          { lastCopied: 'desc' }
        ],
        take: 10
      }),
      
      // 상위 조회 프롬프트 (Top 5)
      getTopPromptsAction('viewed', 5),
      
      // 상위 복사 프롬프트 (Top 5)
      getTopPromptsAction('copied', 5),
      
      // 카테고리별 활동 통계
      prisma.prompt.groupBy({
        where: { userId: session.user.id },
        by: ['category'],
        _sum: {
          viewCount: true,
          copyCount: true
        },
        _count: true,
        orderBy: {
          _sum: {
            viewCount: 'desc'
          }
        }
      })
    ])

    return {
      totalStats: {
        totalPrompts: totalStats._count,
        totalViews: totalStats._sum.viewCount || 0,
        totalCopies: totalStats._sum.copyCount || 0
      },
      recentActivity,
      topViewed: topViewedPrompts,
      topCopied: topCopiedPrompts,
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        promptCount: stat._count,
        totalViews: stat._sum.viewCount || 0,
        totalCopies: stat._sum.copyCount || 0
      }))
    }
  } catch (error) {
    console.error('사용자 분석 데이터 조회 에러:', error)
    throw new Error('분석 데이터를 불러오는 중 오류가 발생했습니다.')
  }
}

// =====================================
// 법적 보호 시스템 서버 액션들
// =====================================

/**
 * 활성 동의서 목록 조회
 */
export async function getActiveConsentVersionsAction() {
  try {
    const consentVersions = await (prisma as any).consentVersion.findMany({
      where: { isActive: true },
      orderBy: { type: 'asc' }
    })
    
    return { success: true, data: consentVersions }
  } catch (error) {
    console.error('동의서 조회 에러:', error)
    return { success: false, error: '동의서 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 동의 현황 조회
 */
export async function getUserConsentsAction() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    const consents = await (prisma as any).userConsent.findMany({
      where: {
        userId: session.user.id,
        version: 'v1.0' // 현재 버전
      }
    })
    
    return { success: true, data: consents }
  } catch (error) {
    console.error('사용자 동의 조회 에러:', error)
    return { success: false, error: '동의 현황 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 동의 기록 (회원가입용)
 */
export async function recordConsentAction(
  consentType: ConsentType,
  agreed: boolean,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    // 회원가입 중에는 세션이 없으므로 임시 저장만 하고 성공 반환
    // 실제 동의 기록은 회원가입 완료 후 처리됩니다
    console.log(`📋 회원가입 중 동의 확인: ${consentType} - ${agreed}`)
    
    return { success: true }
  } catch (error) {
    console.error('동의 기록 에러:', error)
    return { success: false, error: '동의 기록 중 오류가 발생했습니다.' }
  }
}

/**
 * 로그인 사용자의 동의 기록
 */
export async function recordUserConsentAction(
  consentType: ConsentType,
  agreed: boolean,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    await recordUserConsent(
      session.user.id,
      consentType,
      agreed,
      ipAddress,
      userAgent
    )
    
    console.log(`✅ 사용자 동의 기록: ${session.user.id} - ${consentType} - ${agreed}`)
    
    return { success: true }
  } catch (error) {
    console.error('동의 기록 에러:', error)
    return { success: false, error: '동의 기록 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자의 모든 필수 동의 완료 여부 확인
 */
export async function checkAllRequiredConsentsAction(): Promise<{ success: boolean; hasAllConsents?: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    const hasAllConsents = await hasAllRequiredConsents(session.user.id)
    
    return { success: true, hasAllConsents }
  } catch (error) {
    console.error('동의 확인 에러:', error)
    return { success: false, error: '동의 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 슈퍼 관리자 권한 확인
 */
export async function isSuperAdminAction(): Promise<{ success: boolean; isSuperAdmin?: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== ('SUPER_ADMIN' as any)) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    const isSuperAdmin = session.user.role === ('SUPER_ADMIN' as any)
    
    return { success: true, isSuperAdmin }
  } catch (error) {
    console.error('권한 확인 에러:', error)
    return { success: false, error: '권한 확인 중 오류가 발생했습니다.' }
  }
}

/**
 * 슈퍼 관리자용 모든 사용자 프롬프트 조회
 */
export async function getAllUsersPromptsAction(
  targetUserId?: string,
  reason?: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== ('SUPER_ADMIN' as any)) {
      return { success: false, error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    // 관리자 접근 로그 기록
    await logAdminAccess({
      adminId: session.user.id,
      targetUserId: targetUserId || 'all',
      action: 'view_prompts',
      reason: reason || '교육 관리 목적'
    })

    const where = targetUserId ? { userId: targetUserId } : {}
    
    const prompts = await prisma.prompt.findMany({
      where,
      include: { 
        tags: true, 
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`✅ 슈퍼 관리자 프롬프트 조회: ${session.user.id} - ${prompts.length}개`)
    
    return { success: true, data: prompts }
  } catch (error) {
    console.error('슈퍼 관리자 프롬프트 조회 에러:', error)
    return { success: false, error: '프롬프트 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 슈퍼 관리자용 모든 사용자 목록 조회
 */
export async function getAllUsersAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== ('SUPER_ADMIN' as any)) {
      return { success: false, error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    // 관리자 접근 로그 기록
    await logAdminAccess({
      adminId: session.user.id,
      targetUserId: 'all',
      action: 'view_users',
      reason: '사용자 관리 목적'
    })

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            prompts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`✅ 슈퍼 관리자 사용자 조회: ${session.user.id} - ${users.length}명`)
    
    return { success: true, data: users }
  } catch (error) {
    console.error('슈퍼 관리자 사용자 조회 에러:', error)
    return { success: false, error: '사용자 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 특정 사용자의 프롬프트 상세 조회 (슈퍼 관리자 전용)
 */
export async function getUserDetailedPromptsAction(
  targetUserId: string,
  reason?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== ('SUPER_ADMIN' as any)) {
      return { success: false, error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    // 관리자 접근 로그 기록
    await logAdminAccess({
      adminId: session.user.id,
      targetUserId,
      action: 'view_user_detailed_prompts',
      reason: reason || '사용자별 프롬프트 상세 분석'
    })

    // 사용자 정보와 프롬프트를 병렬로 조회
    const [user, prompts, promptStats] = await Promise.all([
      // 사용자 기본 정보
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          expiresAt: true,
          _count: {
            select: {
              prompts: true,
              tags: true
            }
          }
        }
      }),
      
      // 사용자의 모든 프롬프트
      prisma.prompt.findMany({
        where: { userId: targetUserId },
        include: {
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // 프롬프트 통계
      prisma.prompt.aggregate({
        where: { userId: targetUserId },
        _count: true,
        _sum: {
          viewCount: true,
          copyCount: true
        }
      })
    ])

    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }

    // 카테고리별 분포 계산
    const categoryStats = prompts.reduce((acc, prompt) => {
      acc[prompt.category] = (acc[prompt.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 최근 활동 분석 (최근 30일)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentPrompts = prompts.filter(p => new Date(p.createdAt) >= thirtyDaysAgo)

    const userDetailData = {
      user,
      prompts,
      stats: {
        totalPrompts: promptStats._count,
        totalViews: promptStats._sum.viewCount || 0,
        totalCopies: promptStats._sum.copyCount || 0,
        categoriesUsed: Object.keys(categoryStats).length,
        tagsUsed: Array.from(new Set(prompts.flatMap(p => p.tags.map(t => t.name)))).length,
        recentActivity: recentPrompts.length
      },
      categoryDistribution: categoryStats,
      recentPrompts: recentPrompts.slice(0, 5) // 최근 5개
    }
    
    console.log(`✅ 사용자별 프롬프트 상세 조회: ${session.user.id} -> ${targetUserId}`)
    
    return { success: true, data: userDetailData }
  } catch (error) {
    console.error('사용자별 프롬프트 상세 조회 에러:', error)
    return { success: false, error: '사용자 데이터 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 특정 프롬프트 상세 조회 (슈퍼 관리자 전용)
 */
export async function getPromptDetailForAdminAction(
  promptId: string,
  reason?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
      return { success: false, error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        tags: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!prompt) {
      return { success: false, error: '프롬프트를 찾을 수 없습니다.' }
    }

    // 관리자 접근 로그 기록
    await logAdminAccess({
      adminId: session.user.id,
      targetUserId: prompt.userId,
      action: 'view_prompt_detail',
      reason: reason || '프롬프트 상세 분석'
    })

    console.log(`✅ 프롬프트 상세 조회: ${session.user.id} -> ${promptId}`)
    
    return { success: true, data: prompt }
  } catch (error) {
    console.error('프롬프트 상세 조회 에러:', error)
    return { success: false, error: '프롬프트 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 사용자 활동 상세 분석 (슈퍼 관리자 전용)
 */
export async function getUserActivityAnalysisAction(
  targetUserId: string,
  reason?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
      return { success: false, error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    // 관리자 접근 로그 기록
    await logAdminAccess({
      adminId: session.user.id,
      targetUserId,
      action: 'view_user_activity_analysis',
      reason: reason || '사용자 활동 상세 분석'
    })

    // 기본 사용자 정보
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        expiresAt: true
      }
    })

    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }

    // 날짜 계산 (최근 90일, 30일, 7일)
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // 병렬 데이터 조회
    const [
      allPrompts,
      recentPrompts7d,
      recentPrompts30d,
      recentPrompts90d,
      categoryStats,
      monthlyActivity,
      topPrompts
    ] = await Promise.all([
      // 전체 프롬프트
      prisma.prompt.findMany({
        where: { userId: targetUserId },
        include: { tags: true },
        orderBy: { createdAt: 'desc' }
      }),
      
      // 최근 7일 프롬프트
      prisma.prompt.findMany({
        where: { 
          userId: targetUserId,
          createdAt: { gte: last7Days }
        }
      }),
      
      // 최근 30일 프롬프트
      prisma.prompt.findMany({
        where: { 
          userId: targetUserId,
          createdAt: { gte: last30Days }
        }
      }),
      
      // 최근 90일 프롬프트
      prisma.prompt.findMany({
        where: { 
          userId: targetUserId,
          createdAt: { gte: last90Days }
        }
      }),
      
      // 카테고리별 통계
      prisma.prompt.groupBy({
        by: ['category'],
        where: { userId: targetUserId },
        _count: { category: true },
        _sum: { viewCount: true, copyCount: true }
      }),
      
      // 월별 활동 (최근 12개월)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count,
          SUM("viewCount") as totalViews,
          SUM("copyCount") as totalCopies
        FROM "Prompt" 
        WHERE "userId" = ${targetUserId}
          AND "createdAt" >= ${new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,
      
      // 인기 프롬프트 (조회수 + 복사수 기준)
      prisma.prompt.findMany({
        where: { userId: targetUserId },
        select: {
          id: true,
          title: true,
          category: true,
          viewCount: true,
          copyCount: true,
          createdAt: true
        },
        orderBy: [
          { viewCount: 'desc' },
          { copyCount: 'desc' }
        ],
        take: 10
      })
    ])

    // 활동 성과 계산
    const totalViews = allPrompts.reduce((sum, p) => sum + p.viewCount, 0)
    const totalCopies = allPrompts.reduce((sum, p) => sum + p.copyCount, 0)
    const avgViewsPerPrompt = allPrompts.length > 0 ? totalViews / allPrompts.length : 0
    const avgCopiesPerPrompt = allPrompts.length > 0 ? totalCopies / allPrompts.length : 0

    // 사용 태그 분석
    const allTags = allPrompts.flatMap(p => p.tags)
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag.name] = (acc[tag.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 활동 패턴 분석
    const activityPattern = {
      isActiveUser: recentPrompts30d.length > 0,
      consistencyScore: calculateConsistencyScore(allPrompts),
      growthTrend: calculateGrowthTrend(recentPrompts7d, recentPrompts30d, recentPrompts90d),
      engagementRate: totalViews > 0 ? (totalCopies / totalViews * 100) : 0
    }

    const analysisData = {
      user,
      summary: {
        totalPrompts: allPrompts.length,
        totalViews,
        totalCopies,
        avgViewsPerPrompt: Math.round(avgViewsPerPrompt * 100) / 100,
        avgCopiesPerPrompt: Math.round(avgCopiesPerPrompt * 100) / 100,
        categoriesUsed: new Set(allPrompts.map(p => p.category)).size,
        uniqueTags: Object.keys(tagFrequency).length
      },
      recentActivity: {
        last7Days: recentPrompts7d.length,
        last30Days: recentPrompts30d.length,
        last90Days: recentPrompts90d.length
      },
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.category,
        totalViews: stat._sum.viewCount || 0,
        totalCopies: stat._sum.copyCount || 0
      })),
      monthlyActivity,
      topPrompts,
      tagFrequency,
      activityPattern
    }
    
    console.log(`✅ 사용자 활동 분석: ${session.user.id} -> ${targetUserId}`)
    
    return { success: true, data: analysisData }
  } catch (error) {
    console.error('사용자 활동 분석 에러:', error)
    return { success: false, error: '활동 분석 중 오류가 발생했습니다.' }
  }
}

// 일관성 점수 계산 (최근 활동 패턴 기준)
function calculateConsistencyScore(prompts: any[]): number {
  if (prompts.length < 2) return 0
  
  const last30Days = prompts.filter(p => 
    new Date(p.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
  
  if (last30Days.length === 0) return 0
  
  // 30일 동안의 활동 분포를 계산
  const weeklyActivity = Array(4).fill(0)
  last30Days.forEach(p => {
    const daysAgo = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (24 * 60 * 60 * 1000))
    const weekIndex = Math.min(Math.floor(daysAgo / 7), 3)
    weeklyActivity[weekIndex]++
  })
  
  // 표준편차가 낮을수록 일관성이 높음
  const mean = weeklyActivity.reduce((a, b) => a + b, 0) / 4
  const variance = weeklyActivity.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 4
  const stdDev = Math.sqrt(variance)
  
  return Math.max(0, Math.min(100, 100 - (stdDev * 10)))
}

// 성장 트렌드 계산
function calculateGrowthTrend(recent7d: any[], recent30d: any[], recent90d: any[]): string {
  const avgWeekly7d = recent7d.length
  const avgWeekly30d = recent30d.length / 4.3 // 30일을 주 단위로 환산
  const avgWeekly90d = recent90d.length / 12.9 // 90일을 주 단위로 환산
  
  if (avgWeekly7d > avgWeekly30d * 1.2) return 'strong_growth'
  if (avgWeekly7d > avgWeekly30d) return 'growth'
  if (avgWeekly7d < avgWeekly90d * 0.8) return 'decline'
  return 'stable'
}

/**
 * 슈퍼 관리자용 고급 검색 및 필터링 (실시간)
 */
export async function advancedSearchAction(filters: {
  searchTerm?: string
  category?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'latest' | 'oldest' | 'most_viewed' | 'most_copied'
  limit?: number
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
      return { success: false, error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    // 관리자 접근 로그 기록
    await logAdminAccess({
      adminId: session.user.id,
      targetUserId: filters.userId || 'all',
      action: 'advanced_search',
      reason: `고급 검색: ${filters.searchTerm || '전체'}`
    })

    // 검색 조건 구성
    const whereCondition: any = {}
    
    // 텍스트 검색 (제목 + 내용)
    if (filters.searchTerm) {
      whereCondition.OR = [
        { title: { contains: filters.searchTerm, mode: 'insensitive' } },
        { content: { contains: filters.searchTerm, mode: 'insensitive' } }
      ]
    }
    
    // 카테고리 필터
    if (filters.category) {
      whereCondition.category = filters.category
    }
    
    // 사용자 필터
    if (filters.userId) {
      whereCondition.userId = filters.userId
    }
    
    // 날짜 범위 필터
    if (filters.dateFrom || filters.dateTo) {
      whereCondition.createdAt = {}
      if (filters.dateFrom) {
        whereCondition.createdAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        whereCondition.createdAt.lte = new Date(filters.dateTo)
      }
    }

    // 정렬 조건
    let orderBy: any = { createdAt: 'desc' } // 기본값
    switch (filters.sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'most_viewed':
        orderBy = { viewCount: 'desc' }
        break
      case 'most_copied':
        orderBy = { copyCount: 'desc' }
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // 병렬 검색 실행
    const [searchResults, totalCount, matchingUsers, categoryStats] = await Promise.all([
      // 프롬프트 검색 결과
      prisma.prompt.findMany({
        where: whereCondition,
        include: {
          tags: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy,
        take: filters.limit || 50
      }),
      
      // 총 검색 결과 수
      prisma.prompt.count({
        where: whereCondition
      }),
      
      // 매칭된 사용자들
      prisma.user.findMany({
        where: {
          prompts: {
            some: whereCondition
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: { select: { prompts: true } }
        },
        take: 20
      }),
      
      // 검색 결과의 카테고리 분포
      prisma.prompt.groupBy({
        by: ['category'],
        where: whereCondition,
        _count: { category: true },
        _sum: { viewCount: true, copyCount: true }
      })
    ])

    // 태그 빈도 분석
    const allTags = searchResults.flatMap(p => p.tags)
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag.name] = (acc[tag.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 검색 성과 요약
    const summary = {
      totalResults: totalCount,
      resultCount: searchResults.length,
      totalViews: searchResults.reduce((sum, p) => sum + p.viewCount, 0),
      totalCopies: searchResults.reduce((sum, p) => sum + p.copyCount, 0),
      uniqueUsers: new Set(searchResults.map(p => p.userId)).size,
      categoriesFound: categoryStats.length,
      tagsFound: Object.keys(tagFrequency).length
    }

    const searchData = {
      results: searchResults,
      summary,
      matchingUsers,
      categoryStats: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.category,
        totalViews: stat._sum.viewCount || 0,
        totalCopies: stat._sum.copyCount || 0
      })),
      tagFrequency,
      appliedFilters: filters
    }
    
    console.log(`✅ 고급 검색 완료: ${session.user.id} - ${totalCount}개 결과`)
    
    return { success: true, data: searchData }
  } catch (error) {
    console.error('고급 검색 에러:', error)
    return { success: false, error: '검색 중 오류가 발생했습니다.' }
  }
}

/**
 * 관리자 접근 로그 조회
 */
export async function getAdminAccessLogsAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
      return { success: false, error: '슈퍼 관리자 권한이 필요합니다.' }
    }

    const logs = await (prisma as any).adminAccessLog.findMany({
      include: {
        admin: {
          select: {
            name: true,
            email: true
          }
        },
        targetUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // 최근 100개만
    })
    
    return { success: true, data: logs }
  } catch (error) {
    console.error('접근 로그 조회 에러:', error)
    return { success: false, error: '접근 로그 조회 중 오류가 발생했습니다.' }
  }
}

// ========== 배너 관련 액션들 ==========

/**
 * 모든 활성 배너 조회 (사용자용)
 */
export async function getBannersAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        imageUrl: true,
        order: true,
        createdAt: true
      }
    })
    
    return { success: true, data: banners }
  } catch (error) {
    console.error('배너 조회 에러:', error)
    return { success: false, error: '배너 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 모든 배너 조회 (관리자용)
 */
export async function getAllBannersAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    if (session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    const banners = await prisma.banner.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return { success: true, data: banners }

  } catch (error) {
    console.error('배너 조회 에러:', error)
    return { success: false, error: `배너 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }
  }
}

/**
 * 배너 생성
 */
export async function createBannerAction(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const url = formData.get('url') as string
    const imageUrl = formData.get('imageUrl') as string
    const isActive = formData.get('isActive') === 'true'
    const order = parseInt(formData.get('order') as string) || 0

    console.log('📝 배너 생성 요청 데이터:', {
      title,
      description,
      url,
      imageUrl,
      isActive,
      order,
      userId: session.user.id
    })

    if (!title || !url) {
      return { success: false, error: '제목과 URL은 필수입니다.' }
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        description: description || null,
        url,
        imageUrl: imageUrl || null,
        isActive,
        order,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`✅ 배너 생성 성공: ${session.user.id} - ${title} (ID: ${banner.id})`)
    
    return { success: true, data: banner }
  } catch (error) {
    console.error('💥 배너 생성 에러:', error)
    console.error('💥 에러 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return { success: false, error: '배너 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 배너 수정
 */
export async function updateBannerAction(bannerId: string, formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const url = formData.get('url') as string
    const imageUrl = formData.get('imageUrl') as string
    const isActive = formData.get('isActive') === 'true'
    const order = parseInt(formData.get('order') as string) || 0

    if (!title || !url) {
      return { success: false, error: '제목과 URL은 필수입니다.' }
    }

    const banner = await prisma.banner.update({
      where: { id: bannerId },
      data: {
        title,
        description: description || null,
        url,
        imageUrl: imageUrl || null,
        isActive,
        order,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`✅ 배너 수정: ${session.user.id} - ${title}`)
    
    return { success: true, data: banner }
  } catch (error) {
    console.error('배너 수정 에러:', error)
    return { success: false, error: '배너 수정 중 오류가 발생했습니다.' }
  }
}

/**
 * 배너 삭제
 */
export async function deleteBannerAction(bannerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    await prisma.banner.delete({
      where: { id: bannerId }
    })
    
    console.log(`✅ 배너 삭제: ${session.user.id} - ${bannerId}`)
    
    return { success: true }
  } catch (error) {
    console.error('배너 삭제 에러:', error)
    return { success: false, error: '배너 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 배너 활성화/비활성화 토글
 */
export async function toggleBannerStatusAction(bannerId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    const currentBanner = await prisma.banner.findUnique({
      where: { id: bannerId }
    })

    if (!currentBanner) {
      return { success: false, error: '배너를 찾을 수 없습니다.' }
    }

    const updatedBanner = await prisma.banner.update({
      where: { id: bannerId },
      data: {
        isActive: !currentBanner.isActive,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`✅ 배너 상태 변경: ${session.user.id} - ${bannerId} - ${updatedBanner.isActive}`)
    
    return { success: true, data: updatedBanner }
  } catch (error) {
    console.error('배너 상태 변경 에러:', error)
    return { success: false, error: '배너 상태 변경 중 오류가 발생했습니다.' }
  }
}

// ========== 공지사항 관련 액션들 ==========

/**
 * 모든 활성 공지사항 조회 (사용자용)
 */
export async function getNoticesAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const notices = await prisma.notice.findMany({
      where: { isActive: true },
      orderBy: [
        { isImportant: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        isImportant: true,
        viewCount: true,
        order: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return { success: true, data: notices }
  } catch (error) {
    console.error('공지사항 조회 에러:', error)
    return { success: false, error: '공지사항 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 중요 공지사항만 조회 (메인 페이지 상단용)
 */
export async function getImportantNoticesAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const notices = await prisma.notice.findMany({
      where: { 
        isActive: true,
        isImportant: true 
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        createdAt: true
      }
    })
    
    return { success: true, data: notices }
  } catch (error) {
    console.error('중요 공지사항 조회 에러:', error)
    return { success: false, error: '중요 공지사항 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 최근 공지사항 조회 (헤더 드롭다운용)
 */
export async function getRecentNoticesAction(limit: number = 5): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const notices = await prisma.notice.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        isImportant: true,
        createdAt: true
      }
    })
    
    return { success: true, data: notices }
  } catch (error) {
    console.error('최근 공지사항 조회 에러:', error)
    return { success: false, error: '최근 공지사항 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 모든 공지사항 조회 (관리자용)
 */
export async function getAllNoticesAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    const notices = await prisma.notice.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { isImportant: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    return { success: true, data: notices }
  } catch (error) {
    console.error('공지사항 조회 에러:', error)
    return { success: false, error: '공지사항 조회 중 오류가 발생했습니다.' }
  }
}

/**
 * 공지사항 생성
 */
export async function createNoticeAction(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const category = formData.get('category') as string || 'general'
    const isImportant = formData.get('isImportant') === 'true'
    const isActive = formData.get('isActive') === 'true'
    const order = parseInt(formData.get('order') as string) || 0

    if (!title || !content) {
      return { success: false, error: '제목과 내용은 필수입니다.' }
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category,
        isImportant,
        isActive,
        order,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`✅ 공지사항 생성: ${session.user.id} - ${title}`)
    
    return { success: true, data: notice }
  } catch (error) {
    console.error('공지사항 생성 에러:', error)
    return { success: false, error: '공지사항 생성 중 오류가 발생했습니다.' }
  }
}

/**
 * 공지사항 수정
 */
export async function updateNoticeAction(noticeId: string, formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const category = formData.get('category') as string || 'general'
    const isImportant = formData.get('isImportant') === 'true'
    const isActive = formData.get('isActive') === 'true'
    const order = parseInt(formData.get('order') as string) || 0

    if (!title || !content) {
      return { success: false, error: '제목과 내용은 필수입니다.' }
    }

    const notice = await prisma.notice.update({
      where: { id: noticeId },
      data: {
        title,
        content,
        category,
        isImportant,
        isActive,
        order,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`✅ 공지사항 수정: ${session.user.id} - ${title}`)
    
    return { success: true, data: notice }
  } catch (error) {
    console.error('공지사항 수정 에러:', error)
    return { success: false, error: '공지사항 수정 중 오류가 발생했습니다.' }
  }
}

/**
 * 공지사항 삭제
 */
export async function deleteNoticeAction(noticeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    await prisma.notice.delete({
      where: { id: noticeId }
    })
    
    console.log(`✅ 공지사항 삭제: ${session.user.id} - ${noticeId}`)
    
    return { success: true }
  } catch (error) {
    console.error('공지사항 삭제 에러:', error)
    return { success: false, error: '공지사항 삭제 중 오류가 발생했습니다.' }
  }
}

/**
 * 공지사항 활성화/비활성화 토글
 */
export async function toggleNoticeStatusAction(noticeId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    const currentNotice = await prisma.notice.findUnique({
      where: { id: noticeId }
    })

    if (!currentNotice) {
      return { success: false, error: '공지사항을 찾을 수 없습니다.' }
    }

    const updatedNotice = await prisma.notice.update({
      where: { id: noticeId },
      data: {
        isActive: !currentNotice.isActive,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log(`✅ 공지사항 상태 변경: ${session.user.id} - ${noticeId} - ${updatedNotice.isActive}`)
    
    return { success: true, data: updatedNotice }
  } catch (error) {
    console.error('공지사항 상태 변경 에러:', error)
    return { success: false, error: '공지사항 상태 변경 중 오류가 발생했습니다.' }
  }
}

/**
 * 공지사항 조회수 증가
 */
export async function incrementNoticeViewAction(noticeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📊 공지사항 조회수 증가:', noticeId)
    
    const session = await auth()
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      throw new Error('관리자 권한이 필요합니다.')
    }

    await prisma.notice.update({
      where: { id: noticeId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    })

    console.log('✅ 공지사항 조회수 증가 성공')
    return { success: true }
  } catch (error) {
    console.error('💥 공지사항 조회수 증가 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }
  }
}

// 신규 사용자 알림 생성
export async function createNotificationAction(
  type: string,
  title: string,
  message: string,
  data?: any,
  targetAdminIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.notification.create({
      data: {
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : undefined,
        targetAdminIds: targetAdminIds || []
      }
    })
    
    console.log(`✅ 알림 생성 완료: ${type} - ${title}`)
    return { success: true }
  } catch (error) {
    console.error('💥 알림 생성 실패:', error)
    return { success: false, error: '알림 생성에 실패했습니다.' }
  }
}

// 관리자용 알림 조회
export async function getNotificationsAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log('🔔 알림 목록 조회')
    
    const session = await auth()
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      throw new Error('관리자 권한이 필요합니다.')
    }

    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // 최근 50개만 조회
    })

    console.log('✅ 알림 목록 조회 성공:', notifications.length, '개')
    return { success: true, data: notifications }
  } catch (error) {
    console.error('💥 알림 목록 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알림 조회에 실패했습니다.' 
    }
  }
}

export async function getUnreadNotificationCountAction(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    console.log('🔔 읽지 않은 알림 개수 조회')
    
    const session = await auth()
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      throw new Error('관리자 권한이 필요합니다.')
    }

    const count = await prisma.notification.count({
      where: {
        isRead: false
      }
    })

    console.log('✅ 읽지 않은 알림 개수 조회 성공:', count, '개')
    return { success: true, count }
  } catch (error) {
    console.error('💥 읽지 않은 알림 개수 조회 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알림 개수 조회에 실패했습니다.' 
    }
  }
}

export async function markNotificationAsReadAction(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔔 알림 읽음 처리:', notificationId)
    
    const session = await auth()
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      throw new Error('관리자 권한이 필요합니다.')
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true
      }
    })

    console.log('✅ 알림 읽음 처리 성공')
    return { success: true }
  } catch (error) {
    console.error('💥 알림 읽음 처리 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알림 읽음 처리에 실패했습니다.' 
    }
  }
}

// =====================================================
// 마이페이지/프로필 관련 액션들
// =====================================================

// 사용자 정보 조회 (본인만)
export async function getUserProfileAction(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        expiresAt: true,
        _count: {
          select: {
            prompts: true,
            tags: true
          }
        }
      }
    })

    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다.' }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error('사용자 프로필 조회 오류:', error)
    return { success: false, error: '사용자 정보를 불러오는 중 오류가 발생했습니다.' }
  }
}

// 비밀번호 변경
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 현재 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true
      }
    })

    if (!user || !user.password) {
      return { success: false, error: '사용자를 찾을 수 없거나 비밀번호가 설정되지 않았습니다.' }
    }

    // 현재 비밀번호 확인
    const bcryptjs = require('bcryptjs')
    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password)
    
    if (!isCurrentPasswordValid) {
      return { success: false, error: '현재 비밀번호가 올바르지 않습니다.' }
    }

    // 새 비밀번호 유효성 검사
    if (newPassword.length < 6) {
      return { success: false, error: '새 비밀번호는 6자 이상이어야 합니다.' }
    }

    // 새 비밀번호 해싱
    const hashedNewPassword = await bcryptjs.hash(newPassword, 12)

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword }
    })

    return { success: true }
  } catch (error) {
    console.error('비밀번호 변경 오류:', error)
    return { success: false, error: '비밀번호 변경 중 오류가 발생했습니다.' }
  }
} 