// ========================================
// Smart Fashion AI — Lược đồ Validation cho Đơn hàng (Zod)
// ========================================

import { z } from 'zod';

/** Regex xác thực số điện thoại Việt Nam */
const phoneSchema = z
  .string()
  .regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ');

/** Xác thực định dạng địa chỉ Việt Nam */
const addressSchema = z.object({
  province: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố'),
  district: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  ward: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  street: z.string().min(5, 'Địa chỉ chi tiết phải có ít nhất 5 ký tự').max(200),
  fullAddress: z.string().optional(),
});

export const createCheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        cartItemId: z.string().uuid(),
      }),
    )
    .min(1, 'Giỏ hàng trống'),
});

export const setShippingAddressSchema = z.object({
  addressId: z.string().uuid().optional(),
  recipientName: z.string().min(2, 'Tên người nhận phải có ít nhất 2 ký tự').max(100),
  phone: phoneSchema,
  address: addressSchema,
});

export const setPaymentMethodSchema = z.object({
  method: z.enum(['COD', 'MOMO', 'BANK_TRANSFER'], {
    errorMap: () => ({ message: 'Phương thức thanh toán không hợp lệ' }),
  }),
});

export const applyVoucherSchema = z.object({
  code: z
    .string()
    .min(3, 'Mã voucher phải có ít nhất 3 ký tự')
    .max(20, 'Mã voucher tối đa 20 ký tự')
    .toUpperCase()
    .trim(),
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(10, 'Lý do hủy phải có ít nhất 10 ký tự')
    .max(500, 'Lý do hủy tối đa 500 ký tự'),
});

/** Trích xuất Type (Type inference exports) */
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type SetShippingAddressInput = z.infer<typeof setShippingAddressSchema>;
export type SetPaymentMethodInput = z.infer<typeof setPaymentMethodSchema>;
export type ApplyVoucherInput = z.infer<typeof applyVoucherSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
