import { Voucher, UserVoucher } from "@/types/voucher";

export const MOCK_VOUCHERS: Voucher[] = [
  {
    id: "vou_001",
    code: "WELCOME10",
    name: "Giảm 10% đơn đầu tiên",
    description: "Áp dụng cho khách hàng mới, giảm tối đa 50K",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscount: 50000,
    minOrderValue: 200000,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 1000,
    userUsageLimit: 1,
    isActive: true,
    isPublic: true,
  },
  {
    id: "vou_002",
    code: "FREESHIP30",
    name: "Miễn phí vận chuyển (Tối đa 30K)",
    description: "Áp dụng cho đơn hàng từ 300K",
    discountType: "FIXED_AMOUNT",
    discountValue: 30000,
    minOrderValue: 300000,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: 500,
    userUsageLimit: 2,
    isActive: true,
    isPublic: true,
  },
];

export const MOCK_USER_VOUCHERS: UserVoucher[] = [
  {
    id: "uv_001",
    userId: "usr_001",
    voucherId: "vou_002",
    voucher: MOCK_VOUCHERS[1],
    isUsed: false,
    collectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
