// ========================================
// Smart Fashion AI — Kiểu dữ liệu Giỏ hàng (Cart)
// ========================================

import type { BaseEntity } from './common.types';

/** Một sản phẩm trong giỏ hàng (Cart Item) */
export interface CartItem extends BaseEntity {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  imageUrl?: string;
  attributes?: Record<string, string>;
}

/** Dữ liệu Giỏ hàng (Cart) */
export interface Cart extends BaseEntity {
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totalItems: number;
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

/** Cấu trúc thêm sản phẩm vào giỏ */
export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

/** Cấu trúc cập nhật số lượng */
export interface UpdateCartItemRequest {
  quantity: number;
}
