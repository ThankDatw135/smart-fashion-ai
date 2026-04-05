import { Metadata } from "next";
import { VerifyOtpForm } from "./_components/VerifyOtpForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Xác thực OTP | Smart Fashion",
  description: "Xác thực mã OTP gửi qua email.",
};

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Đang tải...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
