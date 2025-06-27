import { 
  Code, 
  Home, 
  BookOpen, 
  MessageSquare, 
  Lightbulb, 
  Settings, 
  Users, 
  FileText,
  Zap,
  Target,
  TrendingUp,
  Heart,
  Star,
  Globe,
  Briefcase,
  Palette,
  Music,
  Camera,
  Gamepad2,
  ShoppingCart
} from 'lucide-react'

export const categoryIcons: Record<string, React.ComponentType<any>> = {
  '바이브코딩': Code,
  '부동산경매': Home,
  '독서': BookOpen,
  '대화': MessageSquare,
  '아이디어': Lightbulb,
  '설정': Settings,
  '사람': Users,
  '문서': FileText,
  '에너지': Zap,
  '목표': Target,
  '성장': TrendingUp,
  '감정': Heart,
  '즐겨찾기': Star,
  '세계': Globe,
  '직업': Briefcase,
  '디자인': Palette,
  '음악': Music,
  '사진': Camera,
  '게임': Gamepad2,
  '쇼핑': ShoppingCart,
  // 기본 아이콘
  'default': FileText
}

export function getCategoryIcon(categoryName: string) {
  return categoryIcons[categoryName] || categoryIcons.default
} 