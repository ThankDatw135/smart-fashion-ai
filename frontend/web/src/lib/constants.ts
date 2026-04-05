// ========== Thông tin Website ==========
export const SITE_NAME = "Smart Fashion AI";
export const SITE_DESCRIPTION = "Website bán quần áo tích hợp AI — Tìm kiếm thông minh, Chatbot tư vấn, Gợi ý cá nhân hóa.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

// ========== Phí vận chuyển (3 vùng cố định) ==========
export const SHIPPING_FEES = {
  INNER_CITY: 25000,   // Nội thành (HCM, Hà Nội)
  SUBURBAN: 35000,      // Ngoại thành / Tỉnh lân cận
  REMOTE: 50000,        // Vùng xa
} as const;
export const FREE_SHIPPING_THRESHOLD = 500000; // Miễn ship cho đơn từ 500K

// ========== VIP Tiers ==========
export const VIP_TIERS = {
  MEMBER: { label: "Thành viên", minSpent: 0, color: "#6B7280" },
  SILVER: { label: "Bạc", minSpent: 1000000, color: "#9CA3AF" },
  GOLD: { label: "Vàng", minSpent: 5000000, color: "#F59E0B" },
  DIAMOND: { label: "Kim Cương", minSpent: 20000000, color: "#8B5CF6" },
} as const;

// ========== Trạng thái đơn hàng ==========
export const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
  SHIPPING: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
  RETURN_REQUESTED: { label: "Yêu cầu trả", color: "bg-orange-100 text-orange-800" },
  RETURNED: { label: "Đã trả hàng", color: "bg-gray-100 text-gray-800" },
};

// ========== Pagination ==========
export const DEFAULT_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;

// ========== Upload ==========
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ========== Admin Sidebar Menu ==========
export const ADMIN_MENU_ITEMS = [
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
] as const;
