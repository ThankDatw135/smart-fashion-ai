import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard — bảo vệ endpoint yêu cầu đăng nhập
 * Tự động trích xuất Bearer token từ header Authorization
 * Nếu token hợp lệ → gắn user vào request.user
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
