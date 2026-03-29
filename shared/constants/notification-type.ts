// ========================================
// Smart Fashion AI — Hằng số biểu diễn Loại Thông báo
// ========================================

export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  VIP_UPGRADE = 'VIP_UPGRADE',
  VOUCHER_NEW = 'VOUCHER_NEW',
  VOUCHER_EXPIRING = 'VOUCHER_EXPIRING',
  WISHLIST_SALE = 'WISHLIST_SALE',
  LOW_STOCK = 'LOW_STOCK',
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  SYSTEM = 'SYSTEM',
}

/** Nhãn hiển thị tiếng Việt */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.ORDER_STATUS]: 'Cập nhật đơn hàng',
  [NotificationType.VIP_UPGRADE]: 'Nâng hạng VIP',
  [NotificationType.VOUCHER_NEW]: 'Voucher mới',
  [NotificationType.VOUCHER_EXPIRING]: 'Voucher sắp hết hạn',
  [NotificationType.WISHLIST_SALE]: 'Sản phẩm yêu thích giảm giá',
  [NotificationType.LOW_STOCK]: 'Sản phẩm sắp hết hàng',
  [NotificationType.REVIEW_APPROVED]: 'Đánh giá đã được duyệt',
  [NotificationType.SYSTEM]: 'Thông báo hệ thống',
};

/** Icon loại thông báo (Tên icon Lucide) */
export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  [NotificationType.ORDER_STATUS]: 'Package',
  [NotificationType.VIP_UPGRADE]: 'Crown',
  [NotificationType.VOUCHER_NEW]: 'Ticket',
  [NotificationType.VOUCHER_EXPIRING]: 'Clock',
  [NotificationType.WISHLIST_SALE]: 'Heart',
  [NotificationType.LOW_STOCK]: 'AlertTriangle',
  [NotificationType.REVIEW_APPROVED]: 'Star',
  [NotificationType.SYSTEM]: 'Bell',
};
