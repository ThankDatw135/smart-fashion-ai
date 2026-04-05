"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  MapPin,
  Package,
  Heart,
  Ticket,
  Bell,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACCOUNT_LINKS = [
  { label: "Tài khoản", href: "/account", icon: User },
  { label: "Địa chỉ", href: "/account/addresses", icon: MapPin },
  { label: "Đơn hàng", href: "/account/orders", icon: Package },
  { label: "Yêu thích", href: "/account/wishlist", icon: Heart },
  { label: "Vouchers", href: "/account/vouchers", icon: Ticket },
  { label: "Thông báo", href: "/account/notifications", icon: Bell },
  { label: "VIP", href: "/account/vip", icon: Crown },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <nav className="sticky top-24 space-y-1">
          {ACCOUNT_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/account" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile — Tabs ngang cuộn */}
      <div className="lg:hidden overflow-x-auto border-b mb-4 -mx-4 px-4">
        <div className="flex gap-1 min-w-max pb-2">
          {ACCOUNT_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/account" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
