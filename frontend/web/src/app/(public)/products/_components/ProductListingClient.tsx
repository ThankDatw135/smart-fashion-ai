"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, Loader2, PackageX } from "lucide-react";
import { FilterSidebar, SortBar } from "@/components/product/FilterSidebar";
import { Pagination } from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { useFilterStore } from "@/stores/filter.store";
import { useProducts } from "@/hooks/useProducts";
import { useWishlistStore } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

const ITEMS_PER_PAGE = 12;

/* ---------- Product Card (Listing variant) ---------- */
function ListingProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useWishlistStore((s) => s.items);
  const toggle = useWishlistStore((s) => s.toggle);
  const inWishlist = items.includes(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    // Lấy variant đầu tiên còn hàng
    const availableVariant = product.variants?.find(v => v.stock > 0);
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.thumbnail,
      quantity: 1,
      attributes: availableVariant ? { color: availableVariant.color, size: availableVariant.size } : {},
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    toast.success(inWishlist ? "Đã xóa khỏi yêu thích" : `Đã thêm "${product.name}" vào yêu thích ❤️`);
  };

  // Tính badge từ product data
  const badge = product.isNew ? "New Arrival" : product.isFlashSale ? "Flash Sale" : product.soldCount > 100 ? "Best Seller" : null;
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            unoptimized
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {badge && (
              <span className="bg-primary text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest shadow-lg">
                {badge}
              </span>
            )}
            {discountPct && (
              <span className="bg-destructive text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest shadow-lg">
                -{discountPct}%
              </span>
            )}
          </div>
          {/* Wishlist */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90",
              inWishlist ? "text-red-500" : "text-muted-foreground hover:text-destructive"
            )}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500")} />
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-5 lg:p-6 space-y-2.5">
        {/* Stars */}
        <div className="flex items-center gap-1 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-current" : "fill-none opacity-30"}`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1 font-medium">({product.reviewCount})</span>
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="font-heading font-semibold text-base lg:text-lg group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-lg lg:text-xl font-bold text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full mt-3 py-2.5 lg:py-3 bg-muted text-foreground font-medium text-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="h-4 w-4" />
          Thêm vào giỏ
        </button>
      </div>
    </motion.div>
  );
}

/* ---------- Main Client Component ---------- */
export function ProductListingClient() {
  const [currentPage, setCurrentPage] = useState(1);
  const filters = useFilterStore();

  // Build query params từ filter store
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    ...(filters.category && { categoryId: filters.category }),
    ...(filters.minPrice !== null && { minPrice: filters.minPrice }),
    ...(filters.maxPrice !== null && { maxPrice: filters.maxPrice }),
    ...(filters.sizes.length > 0 && { sizes: filters.sizes.join(",") }),
    ...(filters.colors.length > 0 && { colors: filters.colors.join(",") }),
    sort: filters.sort,
  }), [currentPage, filters]);

  const { data, isLoading, error } = useProducts(queryParams);

  const products = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <FilterSidebar />
        <div className="flex-1">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Đang tải sản phẩm...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <FilterSidebar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
          <PackageX className="h-12 w-12 text-destructive" />
          <p className="font-semibold text-destructive">Không thể tải danh sách sản phẩm</p>
          <p className="text-sm text-muted-foreground">Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Sidebar Filter */}
      <FilterSidebar />

      {/* Product Grid */}
      <div className="flex-1">
        <SortBar
          showingCount={products.length}
          totalProducts={meta?.total || 0}
          sortBy={filters.sort}
          onSortChange={(sort) => {
            filters.setSort(sort);
            setCurrentPage(1);
          }}
        />

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <PackageX className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Không có sản phẩm nào phù hợp với bộ lọc.</p>
            <button
              onClick={filters.clearFilters}
              className="text-primary text-sm underline underline-offset-2"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {products.map((product: Product) => (
              <ListingProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </div>
    </div>
  );
}
