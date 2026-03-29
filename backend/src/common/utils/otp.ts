import { randomInt } from 'crypto';

/**
 * Tạo mã OTP 6 chữ số — dùng crypto.randomInt cho bảo mật
 * Không dùng Math.random vì không đủ entropy
 */
export function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * TTL (time-to-live) mặc định cho OTP — 5 phút
 */
export const OTP_TTL_SECONDS = 300;

/**
 * Số lần thử OTP tối đa trước khi khóa — 3 lần
 */
export const OTP_MAX_ATTEMPTS = 3;

/**
 * Thời gian khóa khi vượt quá số lần thử — 15 phút
 */
export const OTP_LOCK_DURATION_SECONDS = 900;
