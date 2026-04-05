import { Metadata } from "next";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Đăng Nhập | Smart Fashion",
  description: "Đăng nhập vào tài khoản Smart Fashion của bạn để trải nghiệm tính năng mua sắm thông minh với AI.",
};

export default function LoginPage() {
  return (
    <>
      <LoginForm />
    </>
  );
}
