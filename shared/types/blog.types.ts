// ========================================
// Smart Fashion AI — Kiểu dữ liệu Bài viết (Blog)
// ========================================

import type { BaseEntity, ImageInfo, SeoMeta } from './common.types';

/** Trạng thái bài viết Blog */
export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';

/** Dữ liệu Bài viết Blog */
export interface BlogPost extends BaseEntity {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: ImageInfo;
  categoryId?: string;
  category?: BlogCategory;
  authorId: string;
  author: {
    fullName: string;
    avatarUrl?: string;
  };
  status: BlogPostStatus;
  publishedAt?: string;
  viewCount: number;
  seo?: SeoMeta;
  tags?: string[];
}

/** Danh mục Bài viết Blog */
export interface BlogCategory extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

/** Dữ liệu Banner (Trang chủ) */
export interface Banner extends BaseEntity {
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlt: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}
