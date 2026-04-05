import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SITE_NAME } from "@/lib/constants";

const FOOTER_LINKS = {
  "Về chúng tôi": [
    { label: "Giới thiệu", href: "/about" },
    { label: "Liên hệ", href: "/contact" },
    { label: "Blog", href: "/blog" },
  ],
  "Hỗ trợ": [
    { label: "Chính sách đổi trả", href: "/policies/doi-tra" },
    { label: "Chính sách vận chuyển", href: "/policies/van-chuyen" },
    { label: "Chính sách bảo mật", href: "/policies/bao-mat" },
    { label: "Điều khoản sử dụng", href: "/policies/dieu-khoan" },
  ],
  "Tài khoản": [
    { label: "Đăng nhập", href: "/login" },
    { label: "Đơn hàng của tôi", href: "/account/orders" },
    { label: "Danh sách yêu thích", href: "/account/wishlist" },
    { label: "Voucher của tôi", href: "/account/vouchers" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Thông tin thương hiệu */}
          <div>
            <Link href="/" className="text-xl font-bold font-heading text-primary">
              {SITE_NAME}
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Thời trang thông minh, được cá nhân hóa bởi trí tuệ nhân tạo.
              Tìm kiếm, gợi ý & mua sắm dễ dàng hơn bao giờ hết.
            </p>
            {/* M1 fix: Use proper links — update with real URLs when available */}
            <div className="flex gap-3 mt-4">
              <a href="https://facebook.com/smartfashionai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Facebook</a>
              <a href="https://instagram.com/smartfashionai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Instagram</a>
              <a href="https://tiktok.com/@smartfashionai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">TikTok</a>
            </div>
          </div>

          {/* Các nhóm link */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <p>Powered by AI 🤖</p>
        </div>
      </div>
    </footer>
  );
}
