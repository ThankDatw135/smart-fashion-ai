import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductSuggestionProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    slug: string;
  };
}

export function ProductSuggestion({ product }: ProductSuggestionProps) {
  return (
    <div className="flex gap-3 p-3 rounded-xl border bg-background mt-2 mb-1 group hover:border-primary/50 transition-colors w-[260px]">
      <Link href={`/product/${product.slug}`} className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
        <Image 
          src={product.image || "/images/placeholder.svg"} 
          alt={product.name} 
          fill 
          className="object-cover group-hover:scale-105 transition-transform" 
        />
      </Link>
      <div className="flex flex-col flex-1 justify-between py-0.5">
        <div>
          <Link href={`/product/${product.slug}`} className="font-medium text-sm line-clamp-2 hover:text-primary leading-tight">
            {product.name}
          </Link>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm font-bold text-primary">{product.price.toLocaleString("vi-VN")}đ</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {product.originalPrice.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>
        </div>
        <Button size="sm" className="h-7 text-xs w-full mt-2 gap-1" variant="secondary">
          <ShoppingCart className="w-3 h-3" /> Mua ngay
        </Button>
      </div>
    </div>
  );
}
