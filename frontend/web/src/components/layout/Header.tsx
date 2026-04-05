"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  User,
  Menu,
  Heart,
  LogOut,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";
import { MiniCart } from "@/components/cart/MiniCart";

const NAV_LINKS = [
  { label: "Trang Chủ", href: "/" },
  { label: "Nam", href: "/products?category=nam" },
  { label: "Nữ", href: "/products?category=nu" },
  { label: "Phụ Kiện", href: "/products?category=phu-kien" },
  { label: "Sale", href: "/products?sale=true" },
  { label: "Blog", href: "/blog" },
];

export function Header() {
  const t = useTranslations("Common");
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    // Xóa cookies để middleware biết
    if (typeof document !== "undefined") {
      document.cookie = "auth-token=; path=/; max-age=0";
      document.cookie = "user-role=; path=/; max-age=0";
    }
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Thanh thông báo trên cùng */}
      <div className="bg-primary text-primary-foreground text-center text-xs py-1.5 px-4" suppressHydrationWarning>
        🚚 Miễn phí vận chuyển cho đơn hàng từ 500K
      </div>

      <div className="container flex items-center justify-between h-16 gap-4" suppressHydrationWarning>
        {/* Logo + Mobile menu trigger */}
        <div className="flex items-center gap-3">
          {/* Nút mở menu mobile */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-6">
                <Link href="/" className="text-xl font-bold font-heading text-primary">
                  Smart Fashion AI
                </Link>
              </div>
              <nav className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-6 py-3 text-sm hover:bg-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="text-lg font-bold font-heading text-primary whitespace-nowrap">
            Smart Fashion AI
          </Link>
        </div>

        {/* Navigation — desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search bar — desktop */}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              className="pl-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Wishlist */}
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <Link href="/account/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>

          {/* Giỏ hàng */}
          <MiniCart />

          {/* Tài khoản */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account"><User className="mr-2 h-4 w-4" /> Tài khoản</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders"><Package className="mr-2 h-4 w-4" /> Đơn hàng</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/wishlist"><Heart className="mr-2 h-4 w-4" /> Yêu thích</Link>
                </DropdownMenuItem>
                {(user.role === "admin" || user.role === "super_admin") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="text-primary font-medium">
                        🛡️ Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{t("login")}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search bar mobile — mở ra khi bấm icon search */}
      {isSearchOpen && (
        <div className="md:hidden border-t p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("search")} className="pl-9" autoFocus />
          </div>
        </div>
      )}
    </header>
  );
}
