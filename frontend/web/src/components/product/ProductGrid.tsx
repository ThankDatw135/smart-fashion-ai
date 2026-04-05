import { ProductCard } from "./ProductCard";
import { Product } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  cols?: 2 | 3 | 4;
}

export function ProductGrid({ products, isLoading, cols = 4 }: ProductGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  }[cols];

  // Skeleton loading
  if (isLoading) {
    return (
      <div className={`grid ${gridCols} gap-4`}>
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[3/4] rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
