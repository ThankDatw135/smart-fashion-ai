// ========================================
// Smart Fashion AI — Lược đồ Validation cho Auth (Zod)
// ========================================

import { z } from 'zod';

/** Quy tắc xác thực độ mạnh mật khẩu */
const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự')
  .regex(/[a-z]/, 'Phải có ít nhất 1 chữ thường')
  .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa')
  .regex(/[0-9]/, 'Phải có ít nhất 1 số')
  .regex(/[^a-zA-Z0-9]/, 'Phải có ít nhất 1 ký tự đặc biệt');

/** Regex xác thực số điện thoại Việt Nam */
const phoneSchema = z
  .string()
  .regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ')
  .optional();

export const registerSchema = z
  .object({
    email: z.string().email('Email không hợp lệ').max(255),
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z
      .string()
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(100, 'Họ tên tối đa 100 ký tự')
      .trim(),
    phone: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  otp: z
    .string()
    .length(6, 'OTP phải có 6 chữ số')
    .regex(/^\d+$/, 'OTP phải là số'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token không hợp lệ'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

/** Trích xuất Type (Type inference exports) */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
