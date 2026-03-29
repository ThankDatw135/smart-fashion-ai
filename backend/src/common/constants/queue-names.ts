/**
 * BullMQ queue names — chuẩn hóa tên queue cho async tasks
 * Mỗi queue xử lý một loại job riêng biệt
 */
export const QUEUE_NAMES = {
  MAIL: 'mail',                 // Gửi email (OTP, welcome, order confirmation)
  NOTIFICATION: 'notification', // Tạo và gửi notification
  PRODUCT_INDEX: 'product-index', // Re-index sản phẩm sau khi tạo/sửa
  ORDER_PROCESS: 'order-process', // Xử lý đơn hàng (auto-complete, cancel)
  VOUCHER_EXPIRE: 'voucher-expire', // Auto-expire voucher hết hạn
  VIP_CALCULATE: 'vip-calculate', // Tính toán VIP tier hàng đêm
} as const;

/**
 * RabbitMQ exchange & routing keys — giao tiếp với AI Service
 */
export const RABBITMQ_EXCHANGES = {
  PRODUCT_EVENTS: 'sf.product.events',
  ORDER_EVENTS: 'sf.order.events',
  BEHAVIOR_EVENTS: 'sf.behavior.events',
} as const;

export const RABBITMQ_ROUTING_KEYS = {
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_CHANGED: 'order.status.changed',
  BEHAVIOR_TRACKED: 'user.behavior.tracked',
} as const;
