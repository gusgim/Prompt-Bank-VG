import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET a single prompt
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const prompt = await prisma.prompt.findFirst({
      where: { 
        id: Number(params.id),
        userId: session.user.id // 현재 사용자의 프롬프트만 조회
      },
      include: { tags: true },
    })
    if (!prompt) {
      return NextResponse.json({ error: '프롬프트를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json(prompt)
  } catch (error) {
    console.error('Failed to fetch prompt:', error)
    return NextResponse.json({ error: '프롬프트를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

// UPDATE a prompt
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const session = await auth()
    
    if (!session?.user) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    try {
        const body = await request.json();
        const { title, content, category, subCategory, tags } = body;

        if (!title || !content || !category) {
            return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
        }

        const existingPrompt = await prisma.prompt.findFirst({ 
            where: {
                id: Number(params.id), // <- 여기도 숫자로 변환!
                userId: session.user.id,
              },
              include: { tags: true }
        });
        
        if (!existingPrompt) {
            return NextResponse.json({ error: '프롬프트를 찾을 수 없습니다.' }, { status: 404 });
        }

        let tagConnects: { id: string }[] = [];
        if (tags && tags.length > 0) {
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
            const createdOrFoundTags = await Promise.all(tagOperations);
            tagConnects = createdOrFoundTags.map(tag => ({ id: tag.id }));
        }

        const updatedPrompt = await prisma.prompt.update({
            where: { id: Number(params.id) }, // ✅ 숫자 변환 필요
            data: {
                title,
                content,
                category,
                subCategory,
                tags: {
                    set: tagConnects,
                },
            },
            include: {
                tags: true,
            }
        });

        return NextResponse.json(updatedPrompt);
    } catch (error) {
        console.error('Failed to update prompt:', error);
        return NextResponse.json({ error: '프롬프트 수정 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// DELETE a prompt
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await auth()
    
    if (!session?.user) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    try {
        const promptToDelete = await prisma.prompt.findFirst({
            where: { 
                id: Number(params.id), // ✅ 숫자 변환
                userId: session.user.id
            },
            include: { tags: true },
        });

        if (!promptToDelete) {
            return NextResponse.json({ error: '프롬프트를 찾을 수 없습니다.' }, { status: 404 });
        }

        const tagIds = promptToDelete.tags.map(tag => tag.id);

        // Use a transaction to ensure both operations succeed or fail together
        await prisma.$transaction(async (tx) => {
            // 1. Delete the prompt
            await tx.prompt.delete({
                where: { id: Number(params.id) } // ✅ 숫자 변환
            });

            // 2. Check and delete orphan tags (사용자별로)
            for (const tagId of tagIds) {
                const tag = await tx.tag.findUnique({
                    where: { id: tagId },
                    include: { _count: { select: { prompts: true } } },
                });

                // If the tag is no longer associated with any prompts, delete it
                if (tag && tag._count.prompts === 0) {
                    await tx.tag.delete({
                        where: { id: tagId },
                    });
                }
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Failed to delete prompt:', error);
        return NextResponse.json({ error: '프롬프트 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
} 