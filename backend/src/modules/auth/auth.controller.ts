import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from './dto/index.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';
import { ConfigService } from '@nestjs/config';

/**
 * Auth Controller — xử lý tất cả endpoint xác thực
 * Prefix: /api/v1/auth
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ===========================================================================
  // ĐĂNG KÝ
  // ===========================================================================

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 lần/phút — chống spam đăng ký
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công, OTP đã gửi qua email',
  })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ===========================================================================
  // XÁC MINH EMAIL
  // ===========================================================================

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh email bằng OTP' })
  @ApiResponse({ status: 200, description: 'Email xác minh thành công' })
  @ApiResponse({ status: 400, description: 'OTP không hợp lệ hoặc hết hạn' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // ===========================================================================
  // ĐĂNG NHẬP
  // ===========================================================================

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập (email + password)' })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công — trả access token + set refresh cookie',
  })
  @ApiResponse({
    status: 401,
    description: 'Sai email/mật khẩu hoặc tài khoản bị khóa',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    // Set refresh token vào HTTP-Only Secure Cookie (7 ngày)
    this.setRefreshCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // ===========================================================================
  // REFRESH TOKEN
  // ===========================================================================

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token (đọc refresh token từ cookie)',
  })
  @ApiResponse({ status: 200, description: 'Token mới đã cấp' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Đọc refresh token từ cookie
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      return { message: 'Refresh token không tìm thấy trong cookie' };
    }

    const result = await this.authService.refreshToken(refreshToken);

    // Set refresh token mới vào cookie
    this.setRefreshCookie(res, result.refreshToken);

    return { accessToken: result.accessToken };
  }

  // ===========================================================================
  // ĐĂNG XUẤT
  // ===========================================================================

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Đăng xuất (blacklist access token)' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(user);

    // Xóa refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });

    return result;
  }

  // ===========================================================================
  // GOOGLE OAUTH
  // ===========================================================================

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Redirect tới Google OAuth consent screen' })
  async googleAuth() {
    // Passport tự động redirect → không cần logic ở đây
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — xử lý kết quả đăng nhập' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // Passport đã gắn googleUser vào req.user
    const googleUser = req.user as {
      googleId: string;
      email: string;
      fullName: string;
      avatarUrl: string | null;
    };

    const result = await this.authService.googleLogin(googleUser);

    // Set refresh token cookie
    this.setRefreshCookie(res, result.refreshToken);

    // Redirect về frontend với access token (query param)
    const frontendUrl = this.configService.get<string>(
      'app.frontendUrl',
      'http://localhost:3000',
    );
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  // ===========================================================================
  // QUÊN MẬT KHẨU
  // ===========================================================================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 3600000, limit: 3 } }) // 3 lần/giờ
  @ApiOperation({ summary: 'Gửi OTP quên mật khẩu' })
  @ApiResponse({ status: 200, description: 'OTP đã gửi (nếu email tồn tại)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác minh OTP quên mật khẩu → nhận reset token' })
  @ApiResponse({ status: 200, description: 'OTP hợp lệ, trả reset token' })
  @ApiResponse({ status: 400, description: 'OTP sai hoặc hết hạn' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng reset token' })
  @ApiResponse({ status: 200, description: 'Đặt lại mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Reset token không hợp lệ' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ===========================================================================
  // LẤY THÔNG TIN USER HIỆN TẠI
  // ===========================================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại từ JWT' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return { user };
  }

  // ===========================================================================
  // HELPER
  // ===========================================================================

  /**
   * Set refresh token vào HTTP-Only Secure Cookie
   * Path giới hạn ở /api/v1/auth — chỉ gửi khi gọi auth endpoints
   */
  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
  }
}
