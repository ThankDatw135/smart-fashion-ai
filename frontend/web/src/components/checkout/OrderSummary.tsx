"use client";

import Image from "next/image";
import { useCartTotals } from "@/stores/cart.store";
import { formatPrice } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function OrderSummary() {
  const { selectedItems, selectedCount, subtotal } = useCartTotals();

  const shippingEstimate = subtotal > 500000 ? 0 : 35000;
  const total = subtotal + shippingEstimate;

  return (
    <div className="bg-muted/30 rounded-xl p-6 border ring-1 ring-border/50 sticky top-24">
      <h3 className="text-lg font-heading font-semibold mb-4">Tổng quan đơn hàng</h3>
      
      {/* Product List */}
      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
        {selectedItems.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="relative w-16 h-20 shrink-0 bg-muted rounded-md overflow-hidden">
              <Image 
                src={item.image || "/images/placeholder.svg"} 
                alt={item.name}
                fill 
                className="object-cover"
              />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-5 h-5 flex justify-center items-center rounded-full z-10 border-2 border-background">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-col justify-center flex-1">
              <h4 className="text-sm font-medium line-clamp-2">{item.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {item.attributes.color && `${item.attributes.color} | `}Size {item.attributes.size}
              </p>
            </div>
            <div className="text-sm font-medium flex items-center shrink-0">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <Separator className="mb-4" />

      {/* Bill Calculation */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tạm tính ({selectedCount} sp):</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Phí vận chuyển:</span>
          {shippingEstimate === 0 ? (
            <span className="text-emerald-600 font-medium">Miễn phí</span>
          ) : (
            <span className="font-medium">{formatPrice(shippingEstimate)}</span>
          )}
        </div>

        <Separator className="my-4" />
        
        <div className="flex justify-between items-center text-base font-bold">
          <span>Phải thanh toán:</span>
          <span className="text-primary text-2xl font-heading">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
