"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Sparkles, Heart, Star, ShoppingBag, SlidersHorizontal, Loader2, PackageX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Pagination } from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";
import { useSearch } from "@/hooks/useSearch";
import { useFilterStore } from "@/stores/filter.store";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product";

const AI_SUGGESTIONS = [
  "áo khoác mùa đông",
  "đầm dạ hội xanh",
  "outfit công sở nam",
  "phong cách streetwear",
  "váy đi biển",
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Phù hợp nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá: Thấp → Cao" },
  { value: "price_desc", label: "Giá: Cao → Thấp" },
  { value: "rating", label: "Đánh giá cao nhất" },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);

  const filters = useFilterStore();
  const addItem = useCartStore((s) => s.addItem);
  const wishlistItems = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  // Gọi SearchAPI thật với query và filters
  const { data, isLoading, isFetching } = useSearch(submittedQuery);

  const products = data?.data || [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages || 1;

  // Sync URL ↔ state
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setSubmittedQuery(q);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    setCurrentPage(1);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSubmittedQuery(suggestion);
    setCurrentPage(1);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
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

  const handleToggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    const inList = wishlistItems.includes(product.id);
    toast.success(inList ? "Đã xóa khỏi yêu thích" : `Đã thêm "${product.name}" vào yêu thích ❤️`);
  };

  const hasSubmitted = !!submittedQuery;
  const isSearching = isLoading || isFetching;

  return (
    <main className="pt-6 pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Tìm kiếm" },
        ]}
      />

      {/* Search Header */}
      <div className="max-w-3xl mx-auto text-center mb-10 lg:mb-14">
        <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-4">Tìm Kiếm Thông Minh</h1>
        <p className="text-muted-foreground mb-6 lg:mb-8">
          Mô tả phong cách bạn muốn — AI sẽ tìm sản phẩm phù hợp nhất
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-card border rounded-full px-4 lg:px-6 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-all">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              id="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="VD: áo khoác minimalist cho mùa thu..."
              className="flex-1 bg-transparent border-none focus:ring-0 py-4 px-3 text-sm lg:text-base outline-none"
              autoComplete="off"
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2 shrink-0" />}
            <Button type="submit" className="rounded-full px-6 shrink-0">
              <Sparkles className="h-4 w-4 mr-2" />
              Tìm AI
            </Button>
          </div>
        </form>

        {/* AI suggestions */}
        {!hasSubmitted && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-xs text-muted-foreground">Gợi ý:</span>
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1 rounded-full border text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasSubmitted && (
        <div>
          {/* Result count + sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 bg-muted p-4 rounded-xl">
            <div>
              <span className="text-sm font-medium">
                {isSearching ? (
                  "Đang tìm kiếm..."
                ) : (
                  <>
                    Tìm thấy <span className="text-primary font-bold">{meta?.total || products.length}</span> kết quả cho &ldquo;{submittedQuery}&rdquo;
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select
                value={filters.sort}
                onChange={(e) => filters.setSort(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-semibold cursor-pointer outline-none"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading skeleton */}
          {isSearching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <PackageX className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold">Không tìm thấy kết quả</p>
              <p className="text-muted-foreground text-sm">Thử từ khóa khác hoặc chọn gợi ý bên dưới</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {AI_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestionClick(s)}
                    className="px-3 py-1 rounded-full border text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Grid results
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {products.map((product: Product, i: number) => {
                const inWishlist = wishlistItems.includes(product.id);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-card rounded-xl overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all"
                  >
                    <Link href={`/products/${product.slug}`}>
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          unoptimized
                        />
                        {/* AI relevance badge — hiển thị nếu có score từ vector search */}
                        {(product as any).aiScore && (
                          <div className="absolute top-3 left-3">
                            <span className="bg-primary text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-lg">
                              AI {Math.round((product as any).aiScore * 100)}%
                            </span>
                          </div>
                        )}
                        <button
                          onClick={(e) => handleToggleWishlist(product, e)}
                          className={cn(
                            "absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90",
                            inWishlist ? "text-red-500" : "hover:text-destructive"
                          )}
                        >
                          <Heart className={cn("h-4 w-4", inWishlist && "fill-red-500")} />
                        </button>
                      </div>
                    </Link>
                    <div className="p-4 lg:p-5 space-y-2">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            className={`h-3 w-3 ${j < Math.floor(product.rating) ? "fill-current" : "opacity-30"}`}
                          />
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">({product.reviewCount})</span>
                      </div>
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-heading font-semibold text-sm lg:text-base group-hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-2">
                        <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="w-full mt-2 py-2.5 bg-muted text-foreground font-medium text-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Thêm vào giỏ
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isSearching && totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </div>
      )}
    </main>
  );
}
