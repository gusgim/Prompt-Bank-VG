import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('📋 프롬프트 목록 조회 요청')
    
    const session = await auth()
    console.log('👤 세션 정보:', session?.user?.email, session?.user?.id)
    
    if (!session?.user) {
      console.log('❌ 인증되지 않은 사용자')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')?.trim()
    const category = searchParams.get('category')?.trim()
    const tags = searchParams.getAll('tags').filter(tag => tag.trim())
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 9

    console.log('🔍 검색 조건 상세:', { 
      query: query || '없음', 
      category: category || '없음', 
      tags: tags.length > 0 ? tags : '없음', 
      page, 
      userId: session.user.id 
    })

    // 기본 검색 조건 (현재 사용자의 프롬프트만)
    const where: Prisma.PromptWhereInput = {
      userId: session.user.id,
    }
    
    // 텍스트 검색 (제목 및 내용)
    if (query && query.length > 0) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ]
      console.log('🔍 텍스트 검색 적용:', query)
    }
    
    // 카테고리 필터
    if (category && category.length > 0) {
      where.category = { equals: category }
      console.log('📁 카테고리 필터 적용:', category)
    }
    
    // 태그 필터
    if (tags.length > 0) {
      where.tags = { 
        some: { 
          name: { in: tags },
          userId: session.user.id // 사용자의 태그만 필터링
        } 
      }
      console.log('🏷️ 태그 필터 적용:', tags)
    }

    console.log('📊 최종 검색 조건:', JSON.stringify(where, null, 2))

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

    console.log('✅ 프롬프트 조회 성공:', {
      조회된_개수: prompts.length,
      전체_개수: totalCount,
      현재_페이지: page,
      총_페이지: totalPages,
      검색_조건: {
        검색어: query || '없음',
        카테고리: category || '없음',
        태그: tags.length > 0 ? tags.join(', ') : '없음'
      }
    })

    // 검색 결과가 0개일 때 추가 정보 제공
    if (prompts.length === 0 && totalCount === 0) {
      const userTotalPrompts = await prisma.prompt.count({ 
        where: { userId: session.user.id } 
      })
      console.log('ℹ️ 사용자 전체 프롬프트 수:', userTotalPrompts)
      
      if (userTotalPrompts === 0) {
        console.log('💡 제안: 사용자에게 첫 프롬프트 작성을 권유')
      } else {
        console.log('💡 제안: 검색 조건을 완화하거나 다른 키워드 사용')
      }
    }

    return NextResponse.json({
      data: prompts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('💥 프롬프트 조회 오류:', error)
    return NextResponse.json(
      { error: '프롬프트를 불러오는 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('➕ 새 프롬프트 생성 요청')
    
    const session = await auth()
    console.log('👤 세션 정보:', session?.user?.email, session?.user?.id)
    
    if (!session?.user) {
      console.log('❌ 인증되지 않은 사용자')
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json();
    console.log('📝 요청 본문:', body)
    
    const { title, content, category, subCategory, tags } = body;

    if (!title || !content || !category || category.trim() === '') {
      console.log('❌ 필수 필드 누락')
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' }, 
        { status: 400 }
      );
    }

    // 사용자별 태그 처리
    const tagOperations = tags.map((tagName: string) => {
      return prisma.tag.upsert({
        where: { 
          name_userId: {
            name: tagName,
            userId: session.user.id
          }
        },
        update: {},
        create: { 
          name: tagName,
          userId: session.user.id
        },
      });
    });
    
    const createdOrFoundTags = await prisma.$transaction(tagOperations);
    const tagConnects = createdOrFoundTags.map(tag => ({ id: tag.id }));

    const newPrompt = await prisma.prompt.create({
      data: {
        title,
        content,
        category,
        subCategory,
        userId: session.user.id, // 현재 사용자와 연결
        tags: {
          connect: tagConnects,
        },
      },
      include: {
        tags: true,
      }
    });

    console.log('✅ 프롬프트 생성 성공:', newPrompt.id, newPrompt.title)
    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error('💥 프롬프트 생성 오류:', error);
    return NextResponse.json(
      { error: '프롬프트 생성 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
} 