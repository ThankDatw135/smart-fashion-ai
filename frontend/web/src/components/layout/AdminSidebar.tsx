"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, Layers, ShoppingCart, RotateCcw,
  Users, Star, Warehouse, Ticket, FileText, Image, Mail,
  BarChart3, Bot, Settings, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SITE_NAME } from "@/lib/constants";

// Mapping tên icon → component
const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Package, Layers, ShoppingCart, RotateCcw,
  Users, Star, Warehouse, Ticket, FileText, Image, Mail,
  BarChart3, Bot, Settings,
};

const MENU_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Sản phẩm", href: "/admin/products", icon: "Package" },
  { label: "Danh mục", href: "/admin/categories", icon: "Layers" },
  { label: "Đơn hàng", href: "/admin/orders", icon: "ShoppingCart" },
  { label: "Đổi/Trả", href: "/admin/returns", icon: "RotateCcw" },
  { label: "Khách hàng", href: "/admin/users", icon: "Users" },
  { label: "Đánh giá", href: "/admin/reviews", icon: "Star" },
  { label: "Kho hàng", href: "/admin/inventory", icon: "Warehouse" },
  { label: "Vouchers", href: "/admin/vouchers", icon: "Ticket" },
  { label: "Blog", href: "/admin/blog", icon: "FileText" },
  { label: "Banners", href: "/admin/banners", icon: "Image" },
  { label: "Hộp thư", href: "/admin/inbox", icon: "Mail" },
  { label: "Thống kê", href: "/admin/analytics", icon: "BarChart3" },
  { label: "AI Chatbot", href: "/admin/ai/settings", icon: "Bot" },
  { label: "Cài đặt", href: "/admin/settings", icon: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b" suppressHydrationWarning>
        {!collapsed && (
          <Link href="/admin" className="text-lg font-bold font-heading text-primary truncate">
            {SITE_NAME}
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {MENU_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm transition-colors",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-2" suppressHydrationWarning>
        <Button
          variant="ghost"
          className={cn(
            "w-full text-destructive hover:text-destructive",
            collapsed ? "justify-center px-2" : "justify-start px-3"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3">Đăng xuất</span>}
        </Button>
      </div>
    </aside>
  );
}
