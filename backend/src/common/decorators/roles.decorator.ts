import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator @Roles('admin', 'super_admin') — đánh dấu endpoint yêu cầu role cụ thể
 * Kết hợp với RolesGuard để kiểm tra quyền truy cập
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
