// ========================================
// Smart Fashion AI — Kiểu dữ liệu Đánh giá (Review)
// ========================================

import type { BaseEntity } from './common.types';

/** Dữ liệu Đánh giá sản phẩm */
export interface Review extends BaseEntity {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  user: {
    fullName: string;
    avatarUrl?: string;
  };
  reply?: {
    content: string;
    createdAt: string;
    author: string;
  };
}

/** Thống kê tổng hợp đánh giá */
export interface ReviewSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
