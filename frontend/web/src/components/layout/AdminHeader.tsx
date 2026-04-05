"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";

// Tạo breadcrumb từ pathname
function generateBreadcrumb(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isCurrent: i === segments.length - 1,
  }));
}

export function AdminHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const breadcrumbs = generateBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 border-b bg-background/95 backdrop-blur">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {crumb.isCurrent ? (
              <span className="font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2" suppressHydrationWarning>
        {/* Search */}
        <div className="hidden md:block relative w-60" suppressHydrationWarning>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm..." className="pl-9 h-9 bg-muted/50" />
        </div>

        {/* Thông báo */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || "A"}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">
                {user?.name || "Admin"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link href="/">Về trang chủ</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account">Tài khoản</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
