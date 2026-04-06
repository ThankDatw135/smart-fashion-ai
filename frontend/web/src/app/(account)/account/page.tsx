import { Metadata } from "next";
import { ProfileForm } from "@/components/account/ProfileForm";
import { AccountHeader } from "@/components/account/AccountHeader";
import { AccountStats } from "./_components/AccountStats";

export const metadata: Metadata = {
  title: "Tổng quan tài khoản | Antigravity Store",
  description: "Trang thông tin tài khoản cá nhân",
};

export default function AccountOverviewPage() {
  return (
    <div className="space-y-8">
      <AccountHeader />
      <AccountStats />
      <ProfileForm />
    </div>
  );
}
