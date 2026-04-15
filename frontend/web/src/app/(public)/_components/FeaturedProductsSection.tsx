"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { useWishlistStore } from "@/hooks/useWishlist";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import { Loader2, PackageX } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TABS = ["Thịnh Hành", "Đường Phố", "Tối Giản", "Công Sở", "Unisex"];

// Các ID danh mục mẫu
const CATEGORY_MAP = [
  { label: "Thịnh Hành", id: "" },
  { label: "Đường Phố", id: "5a9d6-category-streetwear" },
  { label: "Tối Giản", id: "5a9d6-category-minimalist" },
  { label: "Công Sở", id: "5a9d6-category-office" },
  { label: "Unisex", id: "5a9d6-category-unisex" },
];

export function FeaturedProductsSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore((state) => state.items);
  const toggle = useWishlistStore((state) => state.toggle);
  const router = useRouter();

  // Fetch API products
  const selectedCategoryUrlId = CATEGORY_MAP[activeTab].id;
  const { data: res, isLoading, error } = useProducts({
    limit: 8,
    sort: "best_seller", // Sort bằng best_seller theo đúng schema backend
    ...(selectedCategoryUrlId && { category: selectedCategoryUrlId }), // Backend dùng filter `category` thay vì `categoryId`
  });

  const products = res?.data || [];

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

        {/* Loading state */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-xl mb-4" />
                <div className="h-4 bg-muted w-3/4 rounded mb-2" />
                <div className="h-4 bg-muted w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <PackageX className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Không thể lấy danh sách sản phẩm.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <PackageX className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Danh mục này hiện đang trống.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product: Product, i: number) => {
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
                  src={product.thumbnail}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  unoptimized
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.isNew && (
                    <span className="bg-primary text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest shadow-lg">
                      Mới
                    </span>
                  )}
                  {product.isFlashSale && (
                    <span className="bg-destructive text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest shadow-lg">
                      Hot
                    </span>
                  )}
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
        )}
      </div>
    </section>
  );
}
