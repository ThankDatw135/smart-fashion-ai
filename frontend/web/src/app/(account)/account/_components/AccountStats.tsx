"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, Package, Ticket, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { OrdersAPI } from "@/services/orders.api";
import { UsersAPI } from "@/services/users.api";
import { VouchersAPI } from "@/services/vouchers.api";

export function AccountStats() {
  const { data: ordersRes, isLoading: loadingOrders } = useQuery({
    queryKey: ["my-orders-stats"],
    queryFn: () => OrdersAPI.getMyOrders({ limit: 1 })
  });

  const { data: profileRes, isLoading: loadingProfile } = useQuery({
    queryKey: ["my-profile-stats"],
    queryFn: () => UsersAPI.getMyProfile()
  });

  const { data: vouchersRes, isLoading: loadingVouchers } = useQuery({
    queryKey: ["my-vouchers-stats"],
    queryFn: () => VouchersAPI.getMyVouchers()
  });

  const totalOrders = ordersRes?.meta?.total || 0;
  
  // Cast the User object to any to safely extract totalSpent
  const profileData = profileRes?.data as any;
  const totalSpent = profileData?.totalSpent || 0;
  
  const totalVouchers = vouchersRes?.data?.length || 0;

  const isLoading = loadingOrders || loadingProfile || loadingVouchers;

  const stats = [
    { title: "Đơn hàng của bạn", value: `${totalOrders} đơn`, icon: Package, href: "/account/orders" },
    { title: "Tổng chi tiêu", value: formatPrice(totalSpent), icon: CreditCard, href: "/account/orders" },
    { title: "Voucher khả dụng", value: `${totalVouchers} mã`, icon: Ticket, href: "/account/vouchers" },
  ];

  return (
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
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-1" />
              ) : (
                <p className="text-xl font-bold mt-1">{stat.value}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
