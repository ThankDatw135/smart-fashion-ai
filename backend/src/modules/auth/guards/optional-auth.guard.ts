import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional Auth Guard — parse JWT nếu có, không bắt buộc
 * Dùng cho endpoint public nhưng muốn biết user đã đăng nhập hay chưa
 * VD: Trang sản phẩm — guest xem được, nhưng nếu có JWT thì hiện wishlist status
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = Record<string, unknown>>(
    _err: Error | null,
    user: TUser | false,
  ): TUser | null {
    // Không throw lỗi nếu không có token — trả về null thay vì 401
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    // Gọi super để parse token, nhưng cho phép tiếp tục nếu không có
    return super.canActivate(context);
  }
}
