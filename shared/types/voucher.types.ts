// ========================================
// Smart Fashion AI — Kiểu dữ liệu Khuyến mãi (Voucher)
// ========================================

import type { BaseEntity } from './common.types';
import type { VoucherType } from '../constants/voucher-type';

/** Dữ liệu Khuyến mãi / Voucher */
export interface Voucher extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
}
