"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, CartItem as ICartItem } from "@/stores/cart.store";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/utils";

interface CartItemProps {
  item: ICartItem;
  variant?: "compact" | "full";
}

export function CartItem({ item, variant = "full" }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const toggleSelection = useCartStore((s) => s.toggleSelection);

  const isCompact = variant === "compact";

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeItem(item.id);
    }
  };

  const handleIncrease = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div className={`flex gap-4 py-4 ${isCompact ? "border-b pb-4 items-center" : "border-b sm:gap-6 items-center"}`}>
      {/* Select Box */}
      <div className="flex-shrink-0">
        <Checkbox 
          checked={item.selected !== false} 
          onCheckedChange={() => toggleSelection(item.id)}
          aria-label={`Chọn ${item.name}`}
        />
      </div>

      {/* Thumbnail */}
      <Link href={`/products/${item.productId}`} className={`shrink-0 rounded-md overflow-hidden bg-muted ${isCompact ? "w-16 h-20" : "w-24 h-32"}`}>
        <Image
          src={item.image || "/images/placeholder.svg"}
          alt={item.name}
          width={96}
          height={128}
          className="w-full h-full object-cover"
        />
      </Link>

      {/* Details */}
      <div className="flex flex-col flex-1 pb-1">
        <div className="flex justify-between gap-2 items-start">
          <Link href={`/products/${item.productId}`} className="flex-1">
            <h4 className={`font-medium text-foreground hover:text-primary transition-colors ${isCompact ? "text-sm line-clamp-2" : "text-base line-clamp-2"}`}>
              {item.name}
            </h4>
          </Link>
          <button
            onClick={() => removeItem(item.id)}
            className="text-muted-foreground hover:text-destructive flex-shrink-0"
            aria-label="Xóa sản phẩm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className={`mt-1 text-muted-foreground ${isCompact ? "text-xs" : "text-sm"}`}>
          {item.attributes?.color && <span>{item.attributes.color}</span>}
          {item.attributes?.color && item.attributes?.size && <span className="mx-1">|</span>}
          {item.attributes?.size && <span>Size {item.attributes.size}</span>}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-md h-8">
            <button
              onClick={handleDecrease}
              className="px-2 h-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-l-md"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className={`px-2 font-medium ${isCompact ? "text-xs" : "text-sm"} min-w-[32px] text-center`}>
              {item.quantity}
            </span>
            <button
              onClick={handleIncrease}
              className="px-2 h-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-r-md"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className={`font-semibold text-primary ${isCompact ? "text-sm" : "text-base"}`}>
              {formatPrice(item.price)}
            </p>
            {item.originalPrice && item.originalPrice > item.price && !isCompact && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(item.originalPrice)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
