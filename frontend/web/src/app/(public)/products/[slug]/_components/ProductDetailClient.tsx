"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/product/ImageGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductTabs } from "@/components/product/ProductTabs";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------- Mock Product ---------- */
const MOCK_PRODUCT = {
  name: "Đầm Dạ Hội Xanh Cổ Điển Satin",
  price: 850000,
  originalPrice: 1000000,
  discountPercent: 15,
  rating: 4.8,
  reviewCount: 120,
  images: [
    { src: "/images/products/blazer.jpg", alt: "Đầm Dạ Hội Xanh - Mặt trước" },
    { src: "/images/products/tshirt.jpg", alt: "Đầm Dạ Hội Xanh - Mặt sau" },
    { src: "/images/products/jeans.jpg", alt: "Đầm Dạ Hội Xanh - Chi tiết" },
    { src: "/images/products/sneaker.jpg", alt: "Đầm Dạ Hội Xanh - Phối đồ" },
  ],
  colors: [
    { name: "Đen", value: "#0f172a" },
    { name: "Xanh Navy", value: "#1e3a5f" },
    { name: "Kem", value: "#fefce8", border: true },
  ],
  sizes: ["S", "M", "L", "XL"],
  unavailableSizes: ["L"],
  tabs: [
    {
      title: "Mô tả sản phẩm",
      content:
        "Đầm dạ hội chất liệu satin cao cấp, thiết kế cổ điển thanh lịch. Phom dáng ôm nhẹ tôn đường cong cơ thể, phù hợp cho các sự kiện trang trọng như tiệc cưới, gala, dạ hội.\n\n• Chất liệu: 100% Satin Silk\n• Phom dáng: A-line, ôm nhẹ phần thân trên\n• Độ dài: Chạm sàn (Floor-length)\n• Xuất xứ: Việt Nam",
    },
    {
      title: "Chất liệu & Cách bảo quản",
      content:
        "• Giặt tay với nước lạnh, không vắt mạnh\n• Ủi mặt trái ở nhiệt độ thấp\n• Không sử dụng chất tẩy\n• Phơi trong bóng râm, tránh ánh nắng trực tiếp\n• Bảo quản trên móc áo, tránh gấp nếp",
    },
    {
      title: "Giao hàng & Đổi trả",
      content:
        "• Miễn phí giao hàng cho đơn từ 500.000đ\n• Giao hàng tiêu chuẩn: 3-5 ngày làm việc\n• Giao hàng nhanh (nội thành): 1-2 ngày\n• Đổi trả miễn phí trong 30 ngày\n• Hoàn tiền 100% nếu sản phẩm lỗi",
    },
  ],
};

const RELATED_PRODUCTS = [
  { name: "Đầm Nhung Xanh Ngọc", price: 920000, slug: "dam-nhung-xanh-ngoc", image: "/images/products/blazer.jpg" },
  { name: "Váy Lụa Đen Tối Giản", price: 750000, slug: "vay-lua-den", image: "/images/products/tshirt.jpg" },
  { name: "Đầm Đính Kết Dạ Hội", price: 1550000, slug: "dam-dinh-ket", image: "/images/products/jeans.jpg" },
  { name: "Váy Xòe Lụa Hồng Phấn", price: 820000, slug: "vay-xoe-lua", image: "/images/products/sneaker.jpg" },
];

const COMPLETE_LOOK = [
  { name: "Áo khoác Blazer Trắng Ngà", price: 1250000, image: "/images/products/blazer.jpg" },
  { name: "Ví Cầm Tay Ánh Bạc Luxury", price: 650000, image: "/images/products/tshirt.jpg" },
  { name: "Giày Cao Gót Quai Mảnh", price: 890000, image: "/images/products/sneaker.jpg" },
];

/* ---------- Component ---------- */
export function ProductDetailClient({ slug: _slug }: { slug: string }) {
  const p = MOCK_PRODUCT;
  const addItem = useCartStore((state) => state.addItem);
  const [selectedColor, setSelectedColor] = useState(p.colors[0]?.name || "");
  const [selectedSize, setSelectedSize] = useState(p.sizes[0] || "");
  const [showSizeChart, setShowSizeChart] = useState(false);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Vui lòng chọn kích cỡ trước khi thêm vào giỏ hàng");
      return;
    }
    addItem({
      id: `${"prod_1"}-${selectedColor}-${selectedSize}-${Date.now()}`,
      productId: "prod_1",
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.images[0].src,
      quantity: 1,
      attributes: {
        color: selectedColor,
        size: selectedSize,
      },
    });
    toast.success(`Đã thêm vào giỏ hàng! (Size ${selectedSize}, Màu ${selectedColor})`);
  };

  return (
    <>
      {/* Bảng số đo Dialog */}
      <Dialog open={showSizeChart} onOpenChange={setShowSizeChart}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Bảng Số Đo & Hướng Dẫn Chọn Size</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-4 py-2 text-left font-bold">Size</th>
                  <th className="border border-border px-4 py-2 text-center">Ngực (cm)</th>
                  <th className="border border-border px-4 py-2 text-center">Eo (cm)</th>
                  <th className="border border-border px-4 py-2 text-center">Hông (cm)</th>
                  <th className="border border-border px-4 py-2 text-center">Chiều cao</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: "XS", chest: "76–80", waist: "60–64", hip: "84–88", height: "150–155cm" },
                  { size: "S",  chest: "80–84", waist: "64–68", hip: "88–92", height: "155–160cm" },
                  { size: "M",  chest: "84–88", waist: "68–72", hip: "92–96", height: "160–165cm" },
                  { size: "L",  chest: "88–92", waist: "72–76", hip: "96–100",height: "165–170cm" },
                  { size: "XL", chest: "92–96", waist: "76–80", hip: "100–104",height: "170–175cm" },
                ].map((row, i) => (
                  <tr key={row.size} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="border border-border px-4 py-2 font-bold text-primary">{row.size}</td>
                    <td className="border border-border px-4 py-2 text-center">{row.chest}</td>
                    <td className="border border-border px-4 py-2 text-center">{row.waist}</td>
                    <td className="border border-border px-4 py-2 text-center">{row.hip}</td>
                    <td className="border border-border px-4 py-2 text-center">{row.height}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            💡 <strong>Mẹo:</strong> Nếu số đo của bạn nằm giữa 2 size, hãy chọn size lớn hơn để thoải mái hơn.
          </p>
        </DialogContent>
      </Dialog>

      {/* Hero: Gallery + Details */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-20 lg:mb-24">
        {/* Gallery */}
        <ImageGallery images={p.images} />

        {/* Details */}
        <div className="flex flex-col">
          {/* Title + Rating */}
          <div className="mb-5 lg:mb-6">
            <h1 className="text-3xl lg:text-4xl font-heading font-bold tracking-tight mb-3">
              {p.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-primary gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(p.rating) ? "fill-current" : "fill-none opacity-30"}`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold">{p.rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">({p.reviewCount} đánh giá)</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6 lg:mb-8">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-primary">
              {formatPrice(p.price)}
            </span>
            {p.originalPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(p.originalPrice)}
                </span>
                <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded-full">
                  -{p.discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Variant Selector */}
          <VariantSelector
            colors={p.colors}
            sizes={p.sizes}
            unavailableSizes={p.unavailableSizes}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            onColorChange={setSelectedColor}
            onSizeChange={setSelectedSize}
            onSizeChartOpen={() => setShowSizeChart(true)}
          />

          {/* CTAs */}
          <div className="flex flex-col gap-3 mt-8 lg:mt-10 mb-8 lg:mb-10">
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-[3] rounded-full py-6 text-base font-bold bg-gradient-to-r from-primary to-blue-700 hover:shadow-xl hover:shadow-primary/30 transition-all"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Thêm vào giỏ hàng
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 rounded-full py-6"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
            <Button
              variant="secondary"
              size="lg"
              className="w-full rounded-full py-6 text-base font-bold"
            >
              Mua ngay
            </Button>
          </div>

          {/* Accordion Tabs */}
          <ProductTabs items={p.tabs} />
        </div>
      </div>

      {/* Complete The Look */}
      <section className="mb-20 lg:mb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 lg:mb-10">
          <div>
            <h2 className="text-2xl lg:text-3xl font-heading font-bold mb-1">
              Hoàn thiện Bộ phối
            </h2>
            <p className="text-muted-foreground text-sm">
              Gợi ý phối đồ cá nhân hóa bởi AI Stylist
            </p>
          </div>
          <Button variant="secondary" className="rounded-full font-bold">
            Thêm cả Set vào giỏ
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          {COMPLETE_LOOK.map((item) => (
            <div key={item.name} className="group cursor-pointer">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-3 lg:mb-4 bg-muted relative">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, 33vw"
                  unoptimized
                />
              </div>
              <p className="font-heading font-bold">{item.name}</p>
              <p className="text-primary font-bold">{formatPrice(item.price)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Summary */}
      <section className="mb-20 lg:mb-24 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-1">
          <h2 className="text-2xl lg:text-3xl font-heading font-bold mb-6">
            Đánh giá khách hàng
          </h2>
          <div className="bg-muted p-6 lg:p-8 rounded-3xl text-center">
            <p className="text-5xl lg:text-6xl font-heading font-bold text-primary mb-2">
              {p.rating}
            </p>
            <div className="flex justify-center text-primary mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="text-muted-foreground text-sm mb-6 lg:mb-8">
              Trên {p.reviewCount} lượt đánh giá
            </p>
            {/* Rating bars */}
            {[
              { star: 5, pct: 85 },
              { star: 4, pct: 10 },
              { star: 3, pct: 3 },
              { star: 2, pct: 1 },
              { star: 1, pct: 1 },
            ].map((r) => (
              <div key={r.star} className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold w-3">{r.star}</span>
                <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8 lg:space-y-10">
          {/* Review 1 */}
          <div className="pb-8 lg:pb-10 border-b border-border/30">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                  MH
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">Minh Hạnh</p>
                  <div className="flex text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">2 ngày trước</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Chất liệu satin cực kỳ sang, mặc lên tôn dáng lắm luôn. AI gợi ý
              size M rất chuẩn với số đo của mình. Rất hài lòng!
            </p>
          </div>

          {/* Review 2 */}
          <div className="pb-8 lg:pb-10 border-b border-border/30">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-sm">
                  AT
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">Anh Thư</p>
                  <div className="flex text-primary">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                    <Star className="h-3 w-3 opacity-30" />
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">1 tuần trước</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Váy đẹp, màu sắc y hình. Tuy nhiên hơi dài so với mình một chút,
              phải đi cắt bớt gấu.
            </p>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="mb-12">
        <h2 className="text-2xl lg:text-3xl font-heading font-bold mb-8 lg:mb-10">
          Sản phẩm tương tự
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {RELATED_PRODUCTS.map((item) => (
            <Link key={item.slug} href={`/products/${item.slug}`} className="group">
              <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-3 lg:mb-4 relative">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 25vw"
                  unoptimized
                />
                <button className="absolute top-3 right-3 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="h-3.5 w-3.5" />
                </button>
              </div>
              <h3 className="font-heading font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              <p className="text-primary font-bold text-sm">{formatPrice(item.price)}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
