export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface Voucher {
  id: string;
  code: string; // e.g., WELCOME10, FREESHIP
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // e.g., 10 (%), or 50000 (VND)
  maxDiscount?: number; // Cap for percentage discount
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number; // Tổng số lần dùng
  userUsageLimit?: number; // Số lần dùng mỗi user
  isActive: boolean;
  isPublic: boolean; // Hiện trên trang chủ/vouchers
}

export interface UserVoucher {
  id: string;
  userId: string;
  voucherId: string;
  voucher: Voucher;
  isUsed: boolean;
  usedAt?: string;
  collectedAt: string;
}
