// ========================================
// Smart Fashion AI — Lược đồ Validation cho Sản phẩm (Zod)
// ========================================

import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string()
    .min(3, 'Tên sản phẩm phải có ít nhất 3 ký tự')
    .max(200, 'Tên sản phẩm tối đa 200 ký tự')
    .trim(),
  description: z
    .string()
    .min(20, 'Mô tả phải có ít nhất 20 ký tự')
    .max(5000, 'Mô tả tối đa 5000 ký tự'),
  shortDescription: z.string().max(300).optional(),
  basePrice: z
    .number()
    .min(1000, 'Giá tối thiểu 1.000đ')
    .max(100_000_000, 'Giá tối đa 100.000.000đ'),
  salePrice: z
    .number()
    .min(1000, 'Giá sale tối thiểu 1.000đ')
    .optional()
    .nullable(),
  categoryId: z.string().uuid('Category ID không hợp lệ'),
  tagIds: z.array(z.string().uuid()).optional(),
  isFeatured: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        size: z.string().min(1, 'Vui lòng chọn size'),
        color: z.string().min(1, 'Vui lòng nhập màu'),
        colorHex: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/, 'Mã màu HEX không hợp lệ'),
        stock: z.number().int().min(0, 'Số lượng tồn kho không được âm'),
        additionalPrice: z.number().min(0).default(0),
        sku: z.string().optional(),
      }),
    )
    .min(1, 'Sản phẩm phải có ít nhất 1 biến thể'),
  seo: z
    .object({
      title: z.string().max(70).optional(),
      description: z.string().max(160).optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  categorySlug: z.string().optional(),
  search: z.string().max(200).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().max(100_000_000).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  inStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortBy: z
    .enum(['newest', 'best-seller', 'price_asc', 'price_desc', 'rating'])
    .default('newest'),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

/** Trích xuất Type (Type inference exports) */
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
