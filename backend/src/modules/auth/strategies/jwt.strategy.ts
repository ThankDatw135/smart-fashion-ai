import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../infrastructure/redis/redis.service.js';
import { CACHE_KEYS } from '../../../common/constants/cache-keys.js';
import {
  AUTH_INVALID_TOKEN,
  AUTH_USER_NOT_FOUND,
  AUTH_USER_INACTIVE,
} from '../../../common/constants/error-codes.js';

/**
 * JWT Payload — dữ liệu bên trong access token
 */
export interface JwtPayload {
  sub: string; // User ID (UUID)
  email: string;
  role: string; // UserRole enum
  jti: string; // JWT ID — dùng cho blacklist khi logout
  iat?: number;
  exp?: number;
}

/**
 * JWT Strategy — xác minh access token RS256
 * Kiểm tra thêm: token bị blacklist (Redis) + user vẫn active (DB)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    const publicKey = configService.get<string>('jwt.publicKey', '');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  /**
   * Validate — được gọi sau khi JWT giải mã thành công
   * Kiểm tra blacklist + user active trước khi cho phép truy cập
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // 1. Kiểm tra token bị blacklist (đã logout)
    const isBlacklisted = await this.redis.exists(
      CACHE_KEYS.TOKEN_BLACKLIST(payload.jti),
    );
    if (isBlacklisted) {
      this.logger.warn(`Token đã bị blacklist: jti=${payload.jti}`);
      throw new UnauthorizedException(AUTH_INVALID_TOKEN);
    }

    // 2. Kiểm tra user còn tồn tại và active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException(AUTH_USER_NOT_FOUND);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(AUTH_USER_INACTIVE);
    }

    // 3. Trả về payload — sẽ được gắn vào request.user
    return payload;
  }
}
