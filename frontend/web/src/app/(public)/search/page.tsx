"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Sparkles, Heart, Star, ShoppingBag, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Pagination } from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";

/* ---------- Mock Search Results ---------- */
const MOCK_RESULTS = [
  {
    id: "1",
    name: "Áo Khoác Minimalist White",
    slug: "ao-khoac-minimalist-white",
    price: 1250000,
    thumbnail: "/images/products/blazer.jpg",
    rating: 5,
    reviewCount: 128,
    aiRelevance: 98,
  },
  {
    id: "2",
    name: "Sơ Mi Linen Beige Premium",
    slug: "so-mi-linen-beige",
    price: 850000,
    thumbnail: "/images/products/tshirt.jpg",
    rating: 4,
    reviewCount: 45,
    aiRelevance: 92,
  },
  {
    id: "3",
    name: "Áo Da Biker Obsidian Edition",
    slug: "ao-da-biker-obsidian",
    price: 2450000,
    thumbnail: "/images/products/jeans.jpg",
    rating: 5,
    reviewCount: 89,
    aiRelevance: 87,
  },
  {
    id: "4",
    name: "T-Shirt Classic Black Organic",
    slug: "tshirt-classic-black",
    price: 450000,
    thumbnail: "/images/products/sneaker.jpg",
    rating: 4,
    reviewCount: 215,
    aiRelevance: 81,
  },
];

const AI_SUGGESTIONS = [
  "áo khoác mùa đông",
  "đầm dạ hội xanh",
  "outfit công sở nam",
  "phong cách streetwear",
  "váy đi biển",
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(!!initialQuery);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(true);
  };

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
        <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
          Tìm Kiếm Thông Minh
        </h1>
        <p className="text-muted-foreground mb-6 lg:mb-8">
          Mô tả phong cách bạn muốn — AI sẽ tìm sản phẩm phù hợp nhất
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-card border rounded-full px-4 lg:px-6 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-all">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="VD: áo khoác minimalist cho mùa thu..."
              className="flex-1 bg-transparent border-none focus:ring-0 py-4 px-3 text-sm lg:text-base"
            />
            <Button type="submit" className="rounded-full px-6 shrink-0">
              <Sparkles className="h-4 w-4 mr-2" />
              Tìm AI
            </Button>
          </div>
        </form>

        {/* AI suggestions */}
        {!submitted && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-xs text-muted-foreground">Gợi ý:</span>
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  setSubmitted(true);
                }}
                className="px-3 py-1 rounded-full border text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {submitted && (
        <div>
          {/* Result count + sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 bg-muted p-4 rounded-xl">
            <div>
              <span className="text-sm font-medium">
                Tìm thấy <span className="text-primary font-bold">{MOCK_RESULTS.length}</span> kết
                quả cho &ldquo;{query}&rdquo;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select className="bg-transparent border-none focus:ring-0 text-sm font-semibold cursor-pointer">
                <option>Phù hợp nhất</option>
                <option>Mới nhất</option>
                <option>Giá: Thấp → Cao</option>
                <option>Giá: Cao → Thấp</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {MOCK_RESULTS.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
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
                    {/* AI relevance badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-lg">
                        AI {product.aiRelevance}%
                      </span>
                    </div>
                    <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:text-destructive transition-all active:scale-90">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                </Link>
                <div className="p-4 lg:p-5 space-y-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`h-3 w-3 ${j < product.rating ? "fill-current" : "opacity-30"}`}
                      />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({product.reviewCount})
                    </span>
                  </div>
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-heading font-semibold text-sm lg:text-base group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-primary">{formatPrice(product.price)}</p>
                  <button className="w-full mt-2 py-2.5 bg-muted text-foreground font-medium text-sm rounded-full hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Thêm vào giỏ
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={3} onPageChange={setCurrentPage} />
        </div>
      )}
    </main>
  );
}
