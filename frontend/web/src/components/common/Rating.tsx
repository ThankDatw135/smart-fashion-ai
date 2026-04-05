import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
}

export function Rating({ value, count, size = "sm", showCount = true }: RatingProps) {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {/* Sao đầy */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={cn(starSize, "fill-yellow-400 text-yellow-400")} />
        ))}
        {/* Nửa sao */}
        {hasHalf && <StarHalf className={cn(starSize, "fill-yellow-400 text-yellow-400")} />}
        {/* Sao rỗng */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className={cn(starSize, "text-muted-foreground/30")} />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
