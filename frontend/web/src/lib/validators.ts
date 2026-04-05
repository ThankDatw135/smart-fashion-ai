import { z } from "zod";

// Schema đăng nhập
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// Schema đăng ký
export const registerSchema = z
  .object({
    firstName: z.string().min(1, "Vui lòng nhập tên"),
    lastName: z.string().min(1, "Vui lòng nhập họ"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().regex(/^0\d{9}$/, "Số điện thoại VN không hợp lệ"),
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;

// Schema địa chỉ giao hàng
export const addressSchema = z.object({
  name: z.string().min(2, "Tên người nhận tối thiểu 2 ký tự"),
  phone: z.string().regex(/^0\d{9}$/, "Số điện thoại VN không hợp lệ"),
  provinceId: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),
  districtId: z.string().min(1, "Vui lòng chọn Quận/Huyện"),
  wardCode: z.string().min(1, "Vui lòng chọn Phường/Xã"),
  address: z.string().min(5, "Địa chỉ chi tiết tối thiểu 5 ký tự"),
  isDefault: z.boolean().optional(),
});
export type AddressFormData = z.infer<typeof addressSchema>;

// Schema đánh giá sản phẩm
export const reviewSchema = z.object({
  rating: z.number().min(1, "Vui lòng chọn số sao").max(5),
  content: z.string().min(10, "Nội dung đánh giá tối thiểu 10 ký tự").max(1000),
});
export type ReviewFormData = z.infer<typeof reviewSchema>;

// Schema liên hệ
export const contactSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  subject: z.string().min(5, "Tiêu đề tối thiểu 5 ký tự"),
  message: z.string().min(20, "Nội dung tối thiểu 20 ký tự"),
});
export type ContactFormData = z.infer<typeof contactSchema>;
