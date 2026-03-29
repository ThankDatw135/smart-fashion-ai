import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator.js';
import { AUTH_FORBIDDEN } from '../../../common/constants/error-codes.js';
import type { JwtPayload } from '../strategies/jwt.strategy.js';

/**
 * Roles Guard — kiểm tra role của user từ JWT payload
 * Kết hợp với decorator @Roles('admin', 'super_admin')
 * Nếu endpoint không có @Roles() → cho phép tất cả (role-agnostic)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách roles yêu cầu từ metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Không khai báo @Roles() → cho phép mọi user đã đăng nhập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException(AUTH_FORBIDDEN);
    }

    // Kiểm tra role user có nằm trong danh sách cho phép
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(AUTH_FORBIDDEN);
    }

    return true;
  }
}
