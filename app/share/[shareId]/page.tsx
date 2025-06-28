import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Calendar, User, Tags, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getSharedPromptAction } from '@/lib/actions'
import { getCategoryIcon } from '@/lib/category-icons'
import CopyButton from '@/components/features/prompts/CopyButton'

interface PageProps {
  params: {
    shareId: string
  }
}

// SEO 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const prompt = await getSharedPromptAction(params.shareId)
    
    return {
      title: `${prompt.title} - Prompt Bank`,
      description: prompt.content.substring(0, 160) + (prompt.content.length > 160 ? '...' : ''),
      keywords: `프롬프트, AI, ${prompt.category}, ${prompt.tags.map((tag: any) => tag.name).join(', ')}`,
      authors: [{ name: prompt.author }],
      openGraph: {
        title: prompt.title,
        description: prompt.content.substring(0, 200) + (prompt.content.length > 200 ? '...' : ''),
        type: 'article',
        authors: [prompt.author],
        images: [
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: `${prompt.title} - Prompt Bank of 덕스AI`,
          },
        ],
        siteName: 'Prompt Bank of 덕스AI',
      },
      twitter: {
        card: 'summary_large_image',
        title: prompt.title,
        description: prompt.content.substring(0, 200) + (prompt.content.length > 200 ? '...' : ''),
        images: ['https://prompt-bank-vg-dun.vercel.app/golden-gate-bridge.jpg'],
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  } catch (error) {
    return {
      title: '프롬프트를 찾을 수 없습니다 - Prompt Bank',
      description: '요청하신 프롬프트를 찾을 수 없습니다.',
      openGraph: {
        title: '프롬프트를 찾을 수 없습니다 - Prompt Bank',
        description: '요청하신 프롬프트를 찾을 수 없습니다.',
        images: [
          {
            url: 'https://prompt-bank-vg-dun.vercel.app/golden-gate-bridge.jpg',
            width: 1200,
            height: 630,
            alt: 'Prompt Bank of 덕스AI',
          },
        ],
      },
    }
  }
}

export default async function SharedPromptPage({ params }: PageProps) {
  let prompt
  
  try {
    prompt = await getSharedPromptAction(params.shareId)
  } catch (error) {
    notFound()
  }

  const CategoryIcon = getCategoryIcon(prompt.category)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            공유된 프롬프트
          </h1>
          <p className="text-gray-600">
            누군가가 당신과 공유한 프롬프트입니다
          </p>
        </div>

        {/* 프롬프트 카드 */}
        <Card className="bg-white/90 backdrop-blur-md border-white/40 shadow-xl shadow-blue-200/20">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3 mb-4">
              <CategoryIcon className="h-6 w-6 text-[#000080]" />
              <h2 className="text-2xl font-bold text-gray-900 flex-1">
                {prompt.title}
              </h2>
            </div>
            
            {/* 메타 정보 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>작성자: {prompt.author}</span>
              </div>
              
              {prompt.sharedAt && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    공유: {new Date(prompt.sharedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 카테고리 */}
            <div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {prompt.category}
                {prompt.subCategory && ` > ${prompt.subCategory}`}
              </Badge>
            </div>

            {/* 프롬프트 내용 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  프롬프트 내용
                </h3>
                <CopyButton content={prompt.content} />
              </div>
              
              <div className="prose prose-gray max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
                  {prompt.content}
                </pre>
              </div>
            </div>

            {/* 태그 */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Tags className="h-4 w-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">태그</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag: any) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline" 
                      className="text-sm px-3 py-1 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 text-orange-700 font-medium"
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <p className="text-blue-800 font-medium mb-2">
                  📚 프롬프트 뱅크에서 더 많은 프롬프트를 만나보세요!
                </p>
                <p className="text-blue-600 text-sm mb-3">
                  나만의 프롬프트를 저장하고 관리할 수 있습니다.
                </p>
                <Button 
                  onClick={() => window.open('/', '_blank')}
                  className="bg-[#FF4500] hover:bg-[#FF4500]/90 text-white"
                >
                  프롬프트 뱅크 방문하기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 스키마 마크업 (SEO) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: prompt.title,
              author: {
                "@type": "Person",
                name: prompt.author,
              },
              datePublished: prompt.sharedAt,
              dateCreated: prompt.createdAt,
              description: prompt.content.substring(0, 200) + (prompt.content.length > 200 ? '...' : ''),
                             keywords: prompt.tags.map((tag: any) => tag.name).join(', '),
              category: prompt.category,
            }),
          }}
        />
      </div>
    </div>
  )
} 