export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  isActive: boolean;
  order: number;
}

export const MOCK_BANNERS: Banner[] = [
  {
    id: "banner_1",
    title: "Bộ Sưu Tập Hè 2025",
    subtitle: "Giảm đến 50% — Miễn phí vận chuyển toàn quốc",
    image: "/images/banners/summer-2025.jpg",
    link: "/products?tag=summer",
    isActive: true,
    order: 1,
  },
  {
    id: "banner_2",
    title: "Flash Sale Cuối Tuần",
    subtitle: "Chỉ còn 48 giờ — Mua ngay kẻo lỡ!",
    image: "/images/banners/flash-sale.jpg",
    link: "/products?sale=true",
    isActive: true,
    order: 2,
  },
  {
    id: "banner_3",
    title: "Đăng ký VIP — Nhận Voucher 100K",
    subtitle: "Trở thành thành viên để tận hưởng ưu đãi độc quyền",
    image: "/images/banners/vip-member.jpg",
    link: "/account/vip",
    isActive: true,
    order: 3,
  },
];
