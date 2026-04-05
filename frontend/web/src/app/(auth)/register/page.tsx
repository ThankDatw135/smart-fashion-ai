import { Metadata } from "next";
import { RegisterForm } from "./_components/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng Ký | Smart Fashion",
  description: "Tạo tài khoản Smart Fashion để trải nghiệm tính năng mua sắm thông minh cá nhân hóa bằng AI.",
};

export default function RegisterPage() {
  return (
    <>
      <RegisterForm />
    </>
  );
}
