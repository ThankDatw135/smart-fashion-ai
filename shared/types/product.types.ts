// ========================================
// Smart Fashion AI — Kiểu dữ liệu Sản phẩm (Product)
// ========================================

import type { BaseEntity, ImageInfo, SeoMeta } from './common.types';

/** Biến thể sản phẩm (Size, Color...) */
export interface ProductVariant extends BaseEntity {
  productId: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  color?: string;
  size?: string;
  imageUrl?: string;
}

/** Thông tin tồn kho theo cửa hàng */
export interface ProductInventory {
  storeId: string;
  quantity: number;
}

/** Dữ liệu Sản phẩm */
export interface Product extends BaseEntity {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  category?: ProductCategory;
  images: ImageInfo[];
  variants: ProductVariant[];
  inventory: number;
  tags: string[];
  isFeatured: boolean;
  isArchived: boolean;
  seo?: SeoMeta;
  rating: number;
  reviewCount: number;
  salesCount: number;
}

/** Danh mục Sản phẩm */
export interface ProductCategory extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  children?: ProductCategory[];
  seo?: SeoMeta;
  isActive: boolean;
  sortOrder: number;
}
