"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/common/Rating";
import { formatPrice, calcDiscount } from "@/lib/utils";
import { Product } from "@/types/product";
import { useWishlistStore } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggle, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discount = hasDiscount ? calcDiscount(product.originalPrice!, product.price) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-card rounded-xl border overflow-hidden transition-shadow hover:shadow-lg"
    >
      {/* Ảnh sản phẩm */}
      <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px]">Mới</Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="text-[10px]">-{discount}%</Badge>
          )}
          {product.isFlashSale && (
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-[10px]">⚡ Flash Sale</Badge>
          )}
        </div>
      </Link>

      {/* Nút yêu thích */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all",
          inWishlist && "opacity-100"
        )}
        onClick={() => toggle(product.id)}
      >
        <Heart
          className={cn("h-4 w-4", inWishlist && "fill-red-500 text-red-500")}
        />
      </Button>

      {/* Thông tin sản phẩm */}
      <div className="p-3 space-y-1.5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <Rating value={product.rating} count={product.reviewCount} />

        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>

        {/* Đã bán */}
        {product.soldCount > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Đã bán {product.soldCount > 1000 ? `${(product.soldCount / 1000).toFixed(1)}K` : product.soldCount}
          </p>
        )}
      </div>
    </motion.div>
  );
}
