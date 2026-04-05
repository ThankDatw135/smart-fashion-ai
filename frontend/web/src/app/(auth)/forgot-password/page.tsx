import { Metadata } from "next";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên Mật Khẩu | Smart Fashion",
  description: "Khôi phục mật khẩu tài khoản Smart Fashion của bạn.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordForm />
    </>
  );
}
