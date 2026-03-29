// ========================================
// Smart Fashion AI — Kiểu dữ liệu Xác thực (Auth)
// ========================================

import type { UserProfile } from './user.types';

/** Cấu trúc yêu cầu đăng nhập (Login request) */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Cấu trúc yêu cầu đăng ký (Register request) */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
}

/** Cấu trúc phản hồi xác thực thành công */
export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: UserProfile;
}

/** Cấu trúc phản hồi gia hạn Token */
export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

/** Cấu trúc yêu cầu xác thực Email */
export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

/** Cấu trúc yêu cầu quên mật khẩu */
export interface ForgotPasswordRequest {
  email: string;
}

/** Cấu trúc yêu cầu xác thực OTP */
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

/** Cấu trúc yêu cầu đặt lại mật khẩu */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/** Tham số nhận về từ Google OAuth */
export interface GoogleOAuthCallback {
  code: string;
  state: string;
}

/** Nội dung Payload của JWT Token */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/** Hằng số xác thực (Auth constants) */
export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_TTL: 15 * 60,
  REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60,
  OTP_TTL: 5 * 60,
  OTP_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60,
  BCRYPT_ROUNDS: 12,
} as const;
