// ========================================
// Smart Fashion AI — Kiểu dữ liệu Người dùng (User)
// ========================================

import type { BaseEntity } from './common.types';
import type { UserRole } from '../constants/user-role';
import type { VipTier } from '../constants/vip-tier';

/** Địa chỉ lưu trữ của người dùng */
export interface Address extends BaseEntity {
  userId: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
  isDefault: boolean;
  label?: 'HOME' | 'OFFICE' | 'OTHER';
}

/** Dữ liệu Hồ sơ Người dùng (User Profile) */
export interface UserProfile extends BaseEntity {
  email: string;
  phone?: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  addresses?: Address[];
  vipTier: VipTier;
  totalSpent: number;
  rewardPoints: number;
  lastLoginAt?: string;
}

/** Cấu trúc tạo địa chỉ mới */
export interface CreateAddressRequest {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
  isDefault?: boolean;
  label?: 'HOME' | 'OFFICE' | 'OTHER';
}
