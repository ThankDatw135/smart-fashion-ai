// ========================================
// Smart Fashion AI — Hằng số biểu diễn Trạng thái Đơn hàng
// ========================================

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** Nhãn hiển thị tiếng Việt for order statuses */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ xác nhận',
  [OrderStatus.CONFIRMED]: 'Đã xác nhận',
  [OrderStatus.PROCESSING]: 'Đang xử lý',
  [OrderStatus.SHIPPING]: 'Đang giao hàng',
  [OrderStatus.DELIVERED]: 'Đã giao hàng',
  [OrderStatus.COMPLETED]: 'Hoàn thành',
  [OrderStatus.CANCELLED]: 'Đã hủy',
};

/** Màu sắc trạng thái đơn hàng (cho UI) */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '#f59e0b',
  [OrderStatus.CONFIRMED]: '#3b82f6',
  [OrderStatus.PROCESSING]: '#8b5cf6',
  [OrderStatus.SHIPPING]: '#06b6d4',
  [OrderStatus.DELIVERED]: '#10b981',
  [OrderStatus.COMPLETED]: '#22c55e',
  [OrderStatus.CANCELLED]: '#ef4444',
};
