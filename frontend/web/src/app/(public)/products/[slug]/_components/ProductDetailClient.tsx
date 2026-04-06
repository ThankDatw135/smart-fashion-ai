"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Star, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/product/ImageGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductTabs } from "@/components/product/ProductTabs";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useWishlistStore } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductBySlug } from "@/hooks/useProducts";
import { useProductReviews } from "@/hooks/useReviews";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";

/* ---------- Size Chart Dialog ---------- */
function SizeChartDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Bảng Số Đo &amp; Hướng Dẫn Chọn Size</DialogTitle>
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
  );
}

/* ---------- Skeleton Loading ---------- */
function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-20 animate-pulse">
      <div className="aspect-square bg-muted rounded-2xl" />
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export function ProductDetailClient({ slug }: { slug: string }) {
  // ── Fetch sản phẩm thật từ API ──
  const { data: productRes, isLoading, error } = useProductBySlug(slug);
  const product = productRes?.data;

  // ── Fetch reviews ──
  const { data: reviewsRes } = useProductReviews(product?.id || "", { limit: 5 });
  const reviews = reviewsRes?.data || [];

  // ── Fetch sản phẩm related (cùng categoryId) ──
  const { data: relatedRes } = useProducts({ categoryId: product?.categoryId, limit: 4, exclude: product?.id });
  const relatedProducts = relatedRes?.data?.filter((p: Product) => p.id !== product?.id).slice(0, 4) || [];

  // ── Local state ──
  const addItem = useCartStore((state) => state.addItem);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore((state) => state.items);
  const toggle = useWishlistStore((state) => state.toggle);

  // Đợi client mount để tránh hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // Khi product load xong → set default variant
  useEffect(() => {
    if (product?.variants?.length) {
      // Lấy unique colors và sizes từ variants
      const firstVariant = product.variants[0];
      setSelectedColor(firstVariant.color || "");
      setSelectedSize(firstVariant.size || "");
    }
  }, [product]);

  // ── Computed values từ product.variants ──
  const colors = useMemo(() => {
    if (!product?.variants) return [];
    const seen = new Set<string>();
    return product.variants
      .filter(v => { const key = v.color; if (seen.has(key)) return false; seen.add(key); return true; })
      .map(v => ({ name: v.color, value: v.color }));
  }, [product]);

  const sizes = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map(v => v.size))];
  }, [product]);

  const unavailableSizes = useMemo(() => {
    if (!product?.variants) return [];
    return sizes.filter(size => {
      const variant = product.variants.find(v => v.size === size && v.color === selectedColor);
      return !variant || variant.stock === 0;
    });
  }, [product, sizes, selectedColor]);

  const productInWishlist = mounted && product ? items.includes(product.id) : false;

  // ── Handlers ──
  const handleToggleWishlist = (productId: string, productName?: string) => {
    const wasInWishlist = mounted && items.includes(productId);
    toggle(productId);
    toast.success(wasInWishlist ? "Đã xóa khỏi danh sách yêu thích" : `Đã thêm "${productName || "sản phẩm"}" vào yêu thích! ❤️`);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.error("Vui lòng chọn kích cỡ trước khi thêm vào giỏ hàng");
      return;
    }
    // Tìm variantId khớp với color + size đã chọn
    const matchedVariant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
    if (matchedVariant && matchedVariant.stock === 0) {
      toast.error("Sản phẩm tạm hết hàng với lựa chọn này");
      return;
    }
    addItem({
      id: `${product.id}-${selectedColor}-${selectedSize}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images?.[0] || product.thumbnail,
      quantity: 1,
      attributes: { color: selectedColor, size: selectedSize },
    });
    toast.success(`Đã thêm vào giỏ hàng! (Size ${selectedSize}, Màu ${selectedColor})`);
  };

  // ── Tabs content (từ product.description) ──
  const tabs = useMemo(() => [
    {
      title: "Mô tả sản phẩm",
      content: product?.description || "Đang tải mô tả...",
    },
    {
      title: "Chất liệu & Cách bảo quản",
      content: "• Giặt tay với nước lạnh, không vắt mạnh\n• Ủi mặt trái ở nhiệt độ thấp\n• Không sử dụng chất tẩy\n• Phơi trong bóng râm, tránh ánh nắng trực tiếp",
    },
    {
      title: "Giao hàng & Đổi trả",
      content: "• Miễn phí giao hàng cho đơn từ 500.000đ\n• Giao hàng tiêu chuẩn: 3-5 ngày làm việc\n• Giao hàng nhanh (nội thành): 1-2 ngày\n• Đổi trả miễn phí trong 30 ngày\n• Hoàn tiền 100% nếu sản phẩm lỗi",
    },
  ], [product]);

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">Không tìm thấy sản phẩm</p>
        <p className="text-muted-foreground text-sm">Sản phẩm không tồn tại hoặc đã bị xóa.</p>
        <Button asChild variant="outline"><Link href="/products">Xem sản phẩm khác</Link></Button>
      </div>
    );
  }

  // ── Loading state ──
  if (isLoading || !product) {
    return <ProductDetailSkeleton />;
  }

  // Chuẩn bị images array cho ImageGallery (API trả về string[], gallery cần {src, alt}[])
  const galleryImages = (product.images?.length ? product.images : [product.thumbnail]).map((src, i) => ({
    src,
    alt: `${product.name} — ảnh ${i + 1}`,
  }));

  return (
    <>
      <SizeChartDialog open={showSizeChart} onOpenChange={setShowSizeChart} />

      {/* Hero: Gallery + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-20 lg:mb-24">
        {/* Gallery */}
        <ImageGallery images={galleryImages} />

        {/* Details */}
        <div className="flex flex-col">
          {/* Title + Rating */}
          <div className="mb-5 lg:mb-6">
            <h1 className="text-3xl lg:text-4xl font-heading font-bold tracking-tight mb-3">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-primary gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-current" : "fill-none opacity-30"}`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold">{product.rating?.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground text-sm">({product.reviewCount} đánh giá)</span>
              {product.isNew && (
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">Mới</span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6 lg:mb-8">
            <span className="text-2xl lg:text-3xl font-heading font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded-full">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Variant Selector */}
          {(colors.length > 0 || sizes.length > 0) && (
            <VariantSelector
              colors={colors}
              sizes={sizes}
              unavailableSizes={unavailableSizes}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onColorChange={setSelectedColor}
              onSizeChange={setSelectedSize}
              onSizeChartOpen={() => setShowSizeChart(true)}
            />
          )}

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
                className={cn("flex-1 rounded-full py-6", productInWishlist && "border-red-500 bg-red-500/5 hover:bg-red-500/10")}
                onClick={() => handleToggleWishlist(product.id, product.name)}
              >
                <Heart className={cn("h-5 w-5 transition-colors", productInWishlist && "fill-red-500 text-red-500")} />
              </Button>
            </div>
            <Button
              variant="secondary"
              size="lg"
              className="w-full rounded-full py-6 text-base font-bold"
              onClick={handleAddToCart}
            >
              Mua ngay
            </Button>
          </div>

          {/* Product Tabs (Description, Care, Shipping) */}
          <ProductTabs items={tabs} />
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mb-20 lg:mb-24 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-1">
          <h2 className="text-2xl lg:text-3xl font-heading font-bold mb-6">Đánh giá khách hàng</h2>
          <div className="bg-muted p-6 lg:p-8 rounded-3xl text-center">
            <p className="text-5xl lg:text-6xl font-heading font-bold text-primary mb-2">{product.rating?.toFixed(1)}</p>
            <div className="flex justify-center text-primary mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="text-muted-foreground text-sm mb-6 lg:mb-8">Trên {product.reviewCount} lượt đánh giá</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8 lg:space-y-10">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="pb-8 lg:pb-10 border-b border-border/30">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {(review.user?.fullName || review.userName || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm">{review.user?.fullName || review.userName || "Khách hàng"}</p>
                      <div className="flex text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-current" : "opacity-30"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl lg:text-3xl font-heading font-bold mb-8 lg:mb-10">Sản phẩm tương tự</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {relatedProducts.map((item: Product) => (
              <Link key={item.id} href={`/products/${item.slug}`} className="group">
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-3 lg:mb-4 relative">
                  <Image
                    src={item.thumbnail}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, 25vw"
                    unoptimized
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleWishlist(item.id, item.name);
                    }}
                    className={cn(
                      "absolute top-3 right-3 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all",
                      (mounted && items.includes(item.id)) && "opacity-100"
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5 transition-colors", (mounted && items.includes(item.id)) && "fill-red-500 text-red-500")} />
                  </button>
                </div>
                <h3 className="font-heading font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {item.name}
                </h3>
                <p className="text-primary font-bold text-sm">{formatPrice(item.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
