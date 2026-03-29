// ========================================
// Smart Fashion AI — Lược đồ Validation cho Đánh giá (Zod)
// ========================================

import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().uuid('Product ID không hợp lệ'),
  orderId: z.string().uuid('Order ID không hợp lệ'),
  rating: z
    .number()
    .int()
    .min(1, 'Đánh giá tối thiểu 1 sao')
    .max(5, 'Đánh giá tối đa 5 sao'),
  comment: z
    .string()
    .min(10, 'Nhận xét phải có ít nhất 10 ký tự')
    .max(1000, 'Nhận xét tối đa 1000 ký tự')
    .trim(),
});

/** Trích xuất Type (Type inference exports) */
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
