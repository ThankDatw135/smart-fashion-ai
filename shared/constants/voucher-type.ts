// ========================================
// Smart Fashion AI — Hằng số biểu diễn Loại Khuyến mãi
// ========================================

export enum VoucherType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
  FREESHIP = 'FREESHIP',
}

/** Nhãn hiển thị tiếng Việt */
export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  [VoucherType.PERCENT]: 'Giảm theo %',
  [VoucherType.FIXED]: 'Giảm cố định',
  [VoucherType.FREESHIP]: 'Miễn phí vận chuyển',
};
