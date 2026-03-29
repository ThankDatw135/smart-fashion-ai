// ========================================
// Smart Fashion AI — Hằng số biểu diễn Quyền người dùng
// ========================================

export enum UserRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/** Nhãn hiển thị tiếng Việt */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.MEMBER]: 'Thành viên',
  [UserRole.ADMIN]: 'Quản trị viên',
  [UserRole.SUPER_ADMIN]: 'Quản trị viên cấp cao',
};

/** Phân cấp quyền (Số cao = Nhiều quyền hơn) */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.MEMBER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
};
