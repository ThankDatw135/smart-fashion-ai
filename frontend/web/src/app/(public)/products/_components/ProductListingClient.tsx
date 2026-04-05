"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { FilterSidebar, SortBar } from "@/components/product/FilterSidebar";
import { Pagination } from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { toast } from "sonner";

/* ---------- Mock Data ---------- */
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Áo Khoác Minimalist White",
    slug: "ao-khoac-minimalist-white",
    price: 1250000,
    originalPrice: 1600000,
    thumbnail: "/images/products/blazer.jpg",
    rating: 5,
    reviewCount: 128,
    badge: "AI Pick",
    badgeColor: "bg-primary",
    saleBadge: "-20%",
  },
  {
    id: "2",
    name: "Sơ Mi Linen Beige Premium",
    slug: "so-mi-linen-beige",
    price: 850000,
    thumbnail: "/images/products/tshirt.jpg",
    rating: 4,
    reviewCount: 45,
    badge: "Best Match",
    badgeColor: "bg-secondary",
  },
  {
    id: "3",
    name: "Áo Da Biker Obsidian",
    slug: "ao-da-biker-obsidian",
    price: 2450000,
    thumbnail: "/images/products/jeans.jpg",
    rating: 5,
    reviewCount: 89,
    badge: "New Arrival",
    badgeColor: "bg-primary",
  },
  {
    id: "4",
    name: "T-Shirt Classic Black Organic",
    slug: "tshirt-classic-black",
    price: 450000,
    thumbnail: "/images/products/sneaker.jpg",
    rating: 4.5,
    reviewCount: 215,
    badge: "AI Pick",
    badgeColor: "bg-primary",
  },
  {
    id: "5",
    name: "Quần Jean Slim Fit Indigo",
    slug: "quan-jean-slim-fit",
    price: 780000,
    originalPrice: 950000,
    thumbnail: "/images/products/jeans.jpg",
    rating: 4,
    reviewCount: 67,
    badge: "Best Seller",
    badgeColor: "bg-secondary",
    saleBadge: "-18%",
  },
  {
    id: "6",
    name: "Giày Sneaker Canvas White",
    slug: "giay-sneaker-canvas",
    price: 1500000,
    thumbnail: "/images/products/sneaker.jpg",
    rating: 5,
    reviewCount: 302,
    badge: "Trending",
    badgeColor: "bg-primary",
  },
];

/* ---------- Product Card (Listing variant) ---------- */
function ListingProductCard({ product }: { product: (typeof MOCK_PRODUCTS)[0] }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: Math.random().toString(36).substring(7),
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.thumbnail,
      quantity: 1,
      attributes: {},
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
  };
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
            <span
              className={`${product.badgeColor} text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest shadow-lg`}
            >
              {product.badge}
            </span>
            {product.saleBadge && (
              <span className="bg-destructive text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-widest shadow-lg">
                {product.saleBadge}
              </span>
            )}
          </div>
          {/* Wishlist */}
          <button className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-destructive transition-all active:scale-90">
            <Heart className="h-4 w-4" />
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
              className={`h-3.5 w-3.5 ${
                i < Math.floor(product.rating) ? "fill-current" : "fill-none opacity-30"
              }`}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1 font-medium">
            ({product.reviewCount})
          </span>
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="font-heading font-semibold text-base lg:text-lg group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-lg lg:text-xl font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
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
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Sidebar */}
      <FilterSidebar />

      {/* Product Grid */}
      <div className="flex-1">
        <SortBar
          showingCount={MOCK_PRODUCTS.length}
          totalProducts={156}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {MOCK_PRODUCTS.map((product) => (
            <ListingProductCard key={product.id} product={product} />
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={8}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
