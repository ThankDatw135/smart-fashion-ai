// ========================================
// Smart Fashion AI — Hằng số biểu diễn Phương thức thanh toán
// ========================================

export enum PaymentMethod {
  COD = 'COD',
  MOMO = 'MOMO',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

/** Nhãn hiển thị tiếng Việt */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: 'Thanh toán khi nhận hàng',
  [PaymentMethod.MOMO]: 'Ví MoMo',
  [PaymentMethod.BANK_TRANSFER]: 'Chuyển khoản ngân hàng',
};

/** Icon phương thức thanh toán (Tên icon Lucide) */
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  [PaymentMethod.COD]: 'Banknote',
  [PaymentMethod.MOMO]: 'Wallet',
  [PaymentMethod.BANK_TRANSFER]: 'Building2',
};

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
