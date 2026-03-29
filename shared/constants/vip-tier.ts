// ========================================
// Smart Fashion AI — Hằng số biểu diễn Phân cấp VIP
// ========================================

export enum VipTier {
  NONE = 'NONE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  DIAMOND = 'DIAMOND',
}

/** Nhãn hiển thị tiếng Việt */
export const VIP_TIER_LABELS: Record<VipTier, string> = {
  [VipTier.NONE]: 'Thành viên',
  [VipTier.SILVER]: 'Bạc',
  [VipTier.GOLD]: 'Vàng',
  [VipTier.DIAMOND]: 'Kim Cương',
};

/** Ngưỡng chi tiêu (VND) */
export const VIP_TIER_THRESHOLDS: Record<VipTier, number> = {
  [VipTier.NONE]: 0,
  [VipTier.SILVER]: 2_000_000,
  [VipTier.GOLD]: 5_000_000,
  [VipTier.DIAMOND]: 15_000_000,
};

/** Quyền lợi VIP */
export const VIP_TIER_BENEFITS: Record<VipTier, string[]> = {
  [VipTier.NONE]: ['Tích lũy điểm thành viên'],
  [VipTier.SILVER]: [
    'Giảm 3% tổng đơn hàng',
    'Voucher sinh nhật 50K',
    'Ưu tiên xử lý đơn hàng',
  ],
  [VipTier.GOLD]: [
    'Giảm 5% tổng đơn hàng',
    'Miễn phí vận chuyển đơn từ 200K',
    'Voucher sinh nhật 100K',
    'Truy cập Flash Sale sớm 1 giờ',
  ],
  [VipTier.DIAMOND]: [
    'Giảm 10% tổng đơn hàng',
    'Miễn phí vận chuyển tất cả đơn',
    'Voucher sinh nhật 200K',
    'Tư vấn stylist riêng qua AI',
    'Đổi trả miễn phí không giới hạn',
  ],
};

/** Màu sắc cấp bậc VIP (cho UI) */
export const VIP_TIER_COLORS: Record<VipTier, string> = {
  [VipTier.NONE]: '#9ca3af',
  [VipTier.SILVER]: '#94a3b8',
  [VipTier.GOLD]: '#f59e0b',
  [VipTier.DIAMOND]: '#8b5cf6',
};
