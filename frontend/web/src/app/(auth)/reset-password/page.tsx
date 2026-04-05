import { Metadata } from "next";
import { ResetPasswordForm } from "./_components/ResetPasswordForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Đặt Lại Mật Khẩu | Smart Fashion",
  description: "Thiết lập mật khẩu mới cho tài khoản Smart Fashion.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Đang tải biểu mẫu...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
