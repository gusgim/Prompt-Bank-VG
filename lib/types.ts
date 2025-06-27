import { Prisma, Role } from "@prisma/client";

// Base types
export type Prompt = Prisma.PromptGetPayload<{}>;
export type Tag = Prisma.TagGetPayload<{}>;
export type UserRole = Role;

// Extended types with relations
export type PromptWithTags = Prisma.PromptGetPayload<{
  include: { tags: true }
}>;

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface PromptFormData {
  title: string;
  content: string;
  category: string;
  subCategory?: string;
  tags: string[];
}

// Filter types
export interface PromptFilters {
  query?: string;
  category?: string;
  tags?: string[];
  page?: number;
}

// Error types
export interface ApiError {
  error: string;
  status?: number;
}

// Dashboard types
export interface PromptStats {
  totalPrompts: number;
  totalCategories: number;
  totalTags: number;
  thisMonthPrompts: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface MonthlyStat {
  month: string;
  count: number;
}

export interface TagStat {
  name: string;
  count: number;
}

// Sharing types
export interface ShareToggleResult {
  success: boolean;
  isPublic: boolean;
  shareId: string | null;
  shareUrl?: string;
  message: string;
}

export interface SharedPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  subCategory: string | null;
  tags: Tag[];
  author: string;
  sharedAt: Date | null;
  createdAt: Date;
}

export interface PublicPrompt {
  id: string;
  title: string;
  content: string; // 요약된 내용
  category: string;
  tags: Tag[];
  author: string;
  shareId: string | null;
  sharedAt: Date | null;
  createdAt: Date;
}

// Analytics types
export interface PromptAnalytics {
  id: string;
  title: string;
  viewCount: number;
  copyCount: number;
  lastViewed: Date | null;
  lastCopied: Date | null;
  createdAt: Date;
  isPublic: boolean;
  sharedAt: Date | null;
}

export interface TopPrompt {
  id: string;
  title: string;
  category: string;
  tags: Tag[];
  viewCount: number;
  copyCount: number;
  lastViewed: Date | null;
  lastCopied: Date | null;
  createdAt: Date;
}

export interface UserAnalytics {
  totalStats: {
    totalPrompts: number;
    totalViews: number;
    totalCopies: number;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    lastViewed: Date | null;
    lastCopied: Date | null;
    viewCount: number;
    copyCount: number;
  }>;
  topViewed: TopPrompt[];
  topCopied: TopPrompt[];
  categoryStats: Array<{
    category: string;
    promptCount: number;
    totalViews: number;
    totalCopies: number;
  }>;
}

// Banner types
export interface Banner {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

export interface BannerFormData {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  isActive?: boolean;
  order?: number;
}

export interface BannerWithCreator extends Banner {
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

// Notice types
export interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  isImportant: boolean;
  isActive: boolean;
  viewCount: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

export interface NoticeFormData {
  title: string;
  content: string;
  category?: string;
  isImportant?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface NoticeWithCreator extends Notice {
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

// More types can be added here as the application grows. 