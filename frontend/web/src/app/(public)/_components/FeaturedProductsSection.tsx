"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { useWishlistStore } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TABS = ["Thịnh Hành", "Đường Phố", "Tối Giản", "Công Sở", "Unisex"];

// Mock sản phẩm nổi bật (đồng bộ với thiết kế Stitch)
const FEATURED_PRODUCTS = [
  {
    id: "fp1",
    name: "Áo Khoác Blazer Form Rộng Chất Liệu Len Cao Cấp",
    slug: "ao-khoac-blazer-form-rong",
    price: 1250000,
    image: "/images/products/blazer.jpg",
    badges: [
      { label: "Lựa Chọn Của AI", color: "bg-primary" },
      { label: "Hot", color: "bg-destructive" },
    ],
  },
  {
    id: "fp2",
    name: "Áo Thun Cotton Organic Premium - Minimalist Style",
    slug: "ao-thun-cotton-organic-premium",
    price: 450000,
    image: "/images/products/tshirt.jpg",
    badges: [{ label: "Mới", color: "bg-primary" }],
  },
  {
    id: "fp3",
    name: "Quần Jeans Denim Phom Suông Phong Cách Cổ Điển",
    slug: "quan-jeans-denim-phom-suong",
    price: 890000,
    image: "/images/products/jeans.jpg",
    badges: [{ label: "Lựa Chọn Của AI", color: "bg-primary" }],
  },
  {
    id: "fp4",
    name: "Giày Sneaker Da Bê Trắng Đế Cao Su Tự Nhiên",
    slug: "giay-sneaker-da-be-trang",
    price: 1500000,
    image: "/images/products/sneaker.jpg",
    badges: [{ label: "Bán Chạy", color: "bg-destructive" }],
  },
];

export function FeaturedProductsSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore((state) => state.items);
  const toggle = useWishlistStore((state) => state.toggle);
  const router = useRouter();

  // Tránh Hydration Mismatch: chỉ đọc wishlist state sau khi client mount xong
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="py-20 lg:py-24 bg-muted">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 lg:gap-8 mb-10 lg:mb-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">
              Sản Phẩm Nổi Bật
            </h2>
            {/* Tabs */}
            <div className="flex flex-wrap gap-3">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                    activeTab === i
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-muted-foreground hover:bg-primary/5 border border-transparent"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <Link
            href="/products"
            className="text-primary font-bold flex items-center gap-2 group whitespace-nowrap"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {FEATURED_PRODUCTS.map((product, i) => {
            // Tránh đọc localStorage trước khi mount xong (hydration mismatch)
            const inWishlist = mounted && items.includes(product.id);
            return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => router.push(`/products/${product.slug}`)}
              className="bg-card rounded-xl overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
            >
              {/* Image */}
              <div className="block relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.badges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`${badge.color} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>

                {/* Wishlist button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(product.id);
                    if (inWishlist) {
                      toast.success("Đã xóa khỏi danh sách yêu thích");
                    } else {
                      toast.success(`Đã thêm "${product.name}" vào yêu thích! ❤️`);
                    }
                  }}
                  className={cn(
                    "absolute top-3 right-3 w-9 h-9 rounded-full glass-card flex items-center justify-center hover:text-destructive transition-colors opacity-0 group-hover:opacity-100",
                    inWishlist && "opacity-100"
                  )}
                >
                  <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500 text-red-500")} />
                </button>

                {/* Quick view overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="w-full bg-card/90 backdrop-blur-md font-bold py-3 rounded-lg shadow-lg text-sm"
                  >
                    Xem Nhanh
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 lg:p-5 space-y-2">
                <h3 className="font-bold line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-primary font-bold text-lg">
                  {formatPrice(product.price)}
                </p>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
