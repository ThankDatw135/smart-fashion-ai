import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';

/**
 * Google OAuth Guard — kích hoạt luồng Passport Google OAuth 2.0
 * Có tiêm CSRF state parameter chống giả mạo request (Stateless)
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // Nếu đang ở bước initiate (chưa có code từ Google)
    if (!req.query.code) {
      // 1. Tạo CSRF state parameter ngẫu nhiên
      const state = crypto.randomBytes(24).toString('hex');

      // 2. Set state vào HTTP-Only Cookie (thời hạn 10 phút)
      res.cookie('oauth_state', state, {
        httpOnly: true,
        secure: process.env.APP_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
        path: '/api/v1/auth/google',
      });

      this.logger.debug(`Generated OAuth state: ${state}`);
      // 3. Truyền state cho Passport để nhét vào query string gửi lên Google
      return { state, accessType: 'offline', prompt: 'consent' };
    }

    return {};
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    // Nếu đang ở bước callback (Google redirect về kèm code và state)
    if (req.query.code) {
      const stateFromGoogle = req.query.state as string;
      const stateFromCookie = req.cookies?.oauth_state as string;

      this.logger.debug(
        `Verifying OAuth state. Google: ${stateFromGoogle}, Cookie: ${stateFromCookie}`,
      );

      // Verify CSRF state
      if (
        !stateFromGoogle ||
        !stateFromCookie ||
        stateFromGoogle !== stateFromCookie
      ) {
        this.logger.error('CSRF Attack detected: OAuth state mismatch.');
        throw new UnauthorizedException(
          'Yêu cầu xác thực không hợp lệ. Vui lòng thử lại.',
        );
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
