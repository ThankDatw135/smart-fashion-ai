// ========================================
// Smart Fashion AI — Kiểu dữ liệu Đơn hàng (Order)
// ========================================

import type { BaseEntity } from './common.types';
import type { OrderStatus } from '../constants/order-status';
import type { PaymentMethod, PaymentStatus } from '../constants/payment-method';

/** Thông tin giao hàng (Shipping details) */
export interface ShippingDetails {
  fullName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  note?: string;
}

/** Chi tiết một sản phẩm trong đơn hàng */
export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  attributes?: Record<string, string>;
}

/** Thông tin lịch sử thay đổi trạng thái */
export interface OrderHistory {
  status: OrderStatus;
  note?: string;
  createdAt: string;
  createdBy: string;
}

/** Dữ liệu Đơn hàng (Order) */
export interface Order extends BaseEntity {
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  shippingDetails: ShippingDetails;
  items: OrderItem[];
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  voucherId?: string;
  history: OrderHistory[];
  expectedDeliveryDate?: string;
  note?: string;
}

/** Cấu trúc tạo đơn hàng (Checkout request) */
export interface CheckoutRequest {
  shippingDetails: ShippingDetails;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
  note?: string;
}
