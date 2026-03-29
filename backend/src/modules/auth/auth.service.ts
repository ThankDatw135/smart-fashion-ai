import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../infrastructure/redis/redis.service.js';
import { CACHE_KEYS } from '../../common/constants/cache-keys.js';
import { QUEUE_NAMES } from '../../common/constants/queue-names.js';
import * as ErrorCodes from '../../common/constants/error-codes.js';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/index.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

// Ghi chú: Hằng số cấu hình luồng auth
const BCRYPT_ROUNDS = 12;
const OTP_TTL_SECONDS = 300; // 5 phút
const OTP_MAX_ATTEMPTS = 3;
const OTP_LOCK_SECONDS = 900; // 15 phút khi nhập sai quá 3 lần
const RESET_TOKEN_TTL_SECONDS = 600; // 10 phút
const FORGOT_PASSWORD_RATE_LIMIT = 3; // 3 lần/giờ/email

/**
 * Auth Service — xử lý toàn bộ logic xác thực
 * Bao gồm: Register, Login, Logout, Refresh, Google OAuth, OTP, Forgot Password
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly accessExpiration: string;
  private readonly refreshExpiration: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    @InjectQueue(QUEUE_NAMES.MAIL) private readonly mailQueue: Queue,
  ) {
    this.privateKey = this.configService.get<string>('jwt.privateKey', '');
    this.publicKey = this.configService.get<string>('jwt.publicKey', '');
    this.accessExpiration = this.configService.get<string>(
      'jwt.accessExpiration',
      '15m',
    );
    this.refreshExpiration = this.configService.get<string>(
      'jwt.refreshExpiration',
      '7d',
    );
  }

  // ===========================================================================
  // ĐĂNG KÝ
  // ===========================================================================

  /**
   * Đăng ký tài khoản mới
   * Luồng: validate → check trùng email → hash password → tạo user → gửi OTP
   */
  async register(dto: RegisterDto) {
    // 1. Kiểm tra email đã tồn tại
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException(ErrorCodes.AUTH_EMAIL_ALREADY_EXISTS);
    }

    // 2. Hash mật khẩu (Bcrypt, 12 rounds)
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // 3. Tạo user (chưa xác minh email)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone || null,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // 4. Tạo & gửi OTP xác minh email qua BullMQ
    await this.sendOtp(user.email, 'verify-email');

    this.logger.log(`Đăng ký thành công: ${user.email}`);
    return {
      message:
        'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.',
      user,
    };
  }

  // ===========================================================================
  // XÁC MINH EMAIL
  // ===========================================================================

  /**
   * Xác minh email bằng OTP
   * Kiểm tra OTP đúng + chưa hết hạn → đánh dấu emailVerified = true
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase();

    // 1. Kiểm tra OTP lock (nhập sai quá nhiều)
    await this.checkOtpLock(email);

    // 2. Lấy OTP từ Redis
    const storedOtp = await this.redis.get(CACHE_KEYS.OTP(email));
    if (!storedOtp) {
      throw new BadRequestException(ErrorCodes.AUTH_OTP_EXPIRED);
    }

    // 3. So sánh OTP
    if (storedOtp !== dto.otp) {
      await this.incrementOtpAttempts(email);
      throw new BadRequestException(ErrorCodes.AUTH_INVALID_OTP);
    }

    // 4. Cập nhật user → emailVerified = true
    await this.prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    // 5. Xóa OTP + attempts khỏi Redis
    await this.redis.del(CACHE_KEYS.OTP(email));
    await this.redis.del(CACHE_KEYS.OTP_ATTEMPTS(email));

    // 6. Gửi email chào mừng qua BullMQ
    await this.mailQueue.add('send-welcome', { email });

    this.logger.log(`Email đã xác minh: ${email}`);
    return { message: 'Email đã được xác minh thành công.' };
  }

  // ===========================================================================
  // ĐĂNG NHẬP
  // ===========================================================================

  /**
   * Đăng nhập — validate credentials → issue JWT access + refresh token
   */
  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();

    // 1. Tìm user theo email
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatarUrl: true,
        vipTier: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }

    // 2. Kiểm tra tài khoản active
    if (!user.isActive) {
      throw new UnauthorizedException(ErrorCodes.AUTH_USER_INACTIVE);
    }

    // 3. Kiểm tra email đã xác minh
    if (!user.emailVerified) {
      // Gửi lại OTP nếu chưa xác minh
      await this.sendOtp(email, 'verify-email');
      throw new UnauthorizedException(ErrorCodes.AUTH_EMAIL_NOT_VERIFIED);
    }

    // 4. So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }

    // 5. Tạo JWT tokens
    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.logger.log(`Đăng nhập thành công: ${email}`);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        vipTier: user.vipTier,
      },
    };
  }

  // ===========================================================================
  // REFRESH TOKEN
  // ===========================================================================

  /**
   * Refresh token — token rotation: cấp mới + hủy cũ
   * Đọc refresh token từ cookie → verify → cấp cặp token mới
   */
  async refreshToken(currentRefreshToken: string) {
    // 1. Verify refresh token
    let payload: JwtPayload;
    try {
      payload = jwt.verify(currentRefreshToken, this.publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException(ErrorCodes.AUTH_REFRESH_TOKEN_INVALID);
    }

    // 2. Kiểm tra refresh token bị blacklist
    const isBlacklisted = await this.redis.exists(
      CACHE_KEYS.TOKEN_BLACKLIST(payload.jti),
    );
    if (isBlacklisted) {
      throw new UnauthorizedException(ErrorCodes.AUTH_REFRESH_TOKEN_INVALID);
    }

    // 3. Kiểm tra user vẫn active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(ErrorCodes.AUTH_USER_INACTIVE);
    }

    // 4. Blacklist refresh token cũ (TTL = thời gian còn lại)
    const remainingTtl = (payload.exp || 0) - Math.floor(Date.now() / 1000);
    if (remainingTtl > 0) {
      await this.redis.set(
        CACHE_KEYS.TOKEN_BLACKLIST(payload.jti),
        '1',
        remainingTtl,
      );
    }

    // 5. Cấp cặp token mới
    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.logger.log(`Token refreshed: ${user.email}`);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ===========================================================================
  // ĐĂNG XUẤT
  // ===========================================================================

  /**
   * Đăng xuất — blacklist access token (Redis, TTL = thời gian còn lại)
   */
  async logout(user: JwtPayload) {
    // Tính TTL còn lại của access token
    const remainingTtl = (user.exp || 0) - Math.floor(Date.now() / 1000);

    if (remainingTtl > 0) {
      await this.redis.set(
        CACHE_KEYS.TOKEN_BLACKLIST(user.jti),
        '1',
        remainingTtl,
      );
    }

    this.logger.log(`Đăng xuất: ${user.email}`);
    return { message: 'Đăng xuất thành công.' };
  }

  // ===========================================================================
  // GOOGLE OAUTH
  // ===========================================================================

  /**
   * Xử lý Google OAuth callback — upsert user + cấp tokens
   * Nếu user đã tồn tại (by email) → cập nhật googleId
   * Nếu chưa → tạo mới (emailVerified = true, không cần mật khẩu)
   */
  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  }) {
    const email = googleUser.email.toLowerCase();

    // Upsert — tạo mới hoặc cập nhật googleId
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl || undefined,
        emailVerified: true, // Google xác minh email sẵn
      },
      create: {
        email,
        fullName: googleUser.fullName,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
        emailVerified: true,
        // Không cần passwordHash — đăng nhập qua Google
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        vipTier: true,
      },
    });

    // Cấp JWT tokens
    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.logger.log(`Google login: ${email}`);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    };
  }

  // ===========================================================================
  // QUÊN MẬT KHẨU
  // ===========================================================================

  /**
   * Gửi OTP quên mật khẩu (rate limit 3/giờ/email)
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();

    // 1. Kiểm tra rate limit (3 lần/giờ)
    const rateLimitKey = `auth:forgot:ratelimit:${email}`;
    const count = await this.redis.incr(rateLimitKey, 3600);
    if (count > FORGOT_PASSWORD_RATE_LIMIT) {
      throw new ForbiddenException(ErrorCodes.AUTH_RATE_LIMITED);
    }

    // 2. Kiểm tra user tồn tại
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Ghi chú: Không tiết lộ email tồn tại hay không (bảo mật)
    if (!user) {
      return { message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP.' };
    }

    // 3. Gửi OTP
    await this.sendOtp(email, 'reset-password');

    return { message: 'Nếu email tồn tại, bạn sẽ nhận được mã OTP.' };
  }

  /**
   * Xác minh OTP quên mật khẩu → trả reset token
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase();

    // 1. Kiểm tra OTP lock
    await this.checkOtpLock(email);

    // 2. Lấy OTP
    const storedOtp = await this.redis.get(CACHE_KEYS.OTP(email));
    if (!storedOtp) {
      throw new BadRequestException(ErrorCodes.AUTH_OTP_EXPIRED);
    }

    // 3. So sánh
    if (storedOtp !== dto.otp) {
      await this.incrementOtpAttempts(email);
      throw new BadRequestException(ErrorCodes.AUTH_INVALID_OTP);
    }

    // 4. Xóa OTP + tạo reset token (lưu Redis, TTL 10 phút)
    await this.redis.del(CACHE_KEYS.OTP(email));
    await this.redis.del(CACHE_KEYS.OTP_ATTEMPTS(email));

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.redis.set(
      `auth:reset:${resetToken}`,
      email,
      RESET_TOKEN_TTL_SECONDS,
    );

    return { resetToken };
  }

  /**
   * Đặt lại mật khẩu bằng reset token
   */
  async resetPassword(dto: ResetPasswordDto) {
    // 1. Verify reset token
    const email = await this.redis.get(`auth:reset:${dto.resetToken}`);
    if (!email) {
      throw new BadRequestException(ErrorCodes.AUTH_INVALID_TOKEN);
    }

    // 2. Hash mật khẩu mới
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    // 3. Cập nhật DB
    await this.prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // 4. Xóa reset token
    await this.redis.del(`auth:reset:${dto.resetToken}`);

    this.logger.log(`Password reset: ${email}`);
    return { message: 'Đặt lại mật khẩu thành công.' };
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Tạo cặp access token + refresh token (RS256)
   */
  private generateTokens(payload: {
    sub: string;
    email: string;
    role: string;
  }) {
    const jti = uuidv4();
    const refreshJti = uuidv4();

    const signOptions: jwt.SignOptions = {
      algorithm: 'RS256' as jwt.Algorithm,
    };

    const accessToken = jwt.sign({ ...payload, jti }, this.privateKey, {
      ...signOptions,
      expiresIn: this.accessExpiration as string & jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(
      { sub: payload.sub, jti: refreshJti, type: 'refresh' },
      this.privateKey,
      {
        ...signOptions,
        expiresIn: this.refreshExpiration as string &
          jwt.SignOptions['expiresIn'],
      },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Tạo & gửi OTP — lưu Redis + thêm job mail queue
   */
  private async sendOtp(
    email: string,
    type: 'verify-email' | 'reset-password',
  ) {
    // Tạo OTP 6 chữ số
    const otp = crypto.randomInt(100000, 999999).toString();

    // Lưu vào Redis với TTL 5 phút
    await this.redis.set(CACHE_KEYS.OTP(email), otp, OTP_TTL_SECONDS);

    // Đẩy job gửi email vào BullMQ
    await this.mailQueue.add(`send-otp-${type}`, {
      email,
      otp,
      type,
    });

    this.logger.log(`OTP sent: ${email} (${type})`);
  }

  /**
   * Kiểm tra OTP lock — 3 lần nhập sai → khóa 15 phút
   */
  private async checkOtpLock(email: string) {
    const attempts = await this.redis.get(CACHE_KEYS.OTP_ATTEMPTS(email));
    if (attempts && parseInt(attempts, 10) >= OTP_MAX_ATTEMPTS) {
      throw new ForbiddenException(ErrorCodes.AUTH_OTP_LOCKED);
    }
  }

  /**
   * Tăng số lần nhập OTP sai — tự động lock sau 3 lần
   */
  private async incrementOtpAttempts(email: string) {
    const count = await this.redis.incr(
      CACHE_KEYS.OTP_ATTEMPTS(email),
      OTP_LOCK_SECONDS,
    );
    if (count >= OTP_MAX_ATTEMPTS) {
      this.logger.warn(
        `OTP locked: ${email} (quá ${OTP_MAX_ATTEMPTS} lần sai)`,
      );
    }
  }
}
