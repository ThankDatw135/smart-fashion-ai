import { Metadata } from "next";
import { ProfileForm } from "@/components/account/ProfileForm";
import { AccountHeader } from "@/components/account/AccountHeader";
import { CreditCard, Package, Ticket } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tổng quan tài khoản | Antigravity Store",
  description: "Trang thông tin tài khoản cá nhân",
};

export default function AccountOverviewPage() {
  const stats = [
    { title: "Đơn hàng của bạn", value: "12 đơn", icon: Package, href: "/account/orders" },
    { title: "Tổng chi tiêu", value: formatPrice(12500000), icon: CreditCard, href: "/account/orders" },
    { title: "Voucher khả dụng", value: "3 mã", icon: Ticket, href: "/account/vouchers" },
  ];

  return (
    <div className="space-y-8">
      <AccountHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link key={idx} href={stat.href} className="flex items-center gap-4 p-6 rounded-2xl border bg-background hover:bg-muted/50 transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold mt-1">{stat.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <ProfileForm />
    </div>
  );
}
