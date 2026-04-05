"use client";

import { useCartTotals } from "@/stores/cart.store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function CartSummary() {
  const { subtotal, totalSubtotal, selectedCount } = useCartTotals();

  const shippingEstimate = subtotal > 500000 || subtotal === 0 ? 0 : 35000;
  const total = subtotal + shippingEstimate;

  if (totalSubtotal === 0) return null;

  return (
    <div className="bg-muted/30 rounded-xl p-6 border ring-1 ring-border/50">
      <h3 className="text-lg font-semibold font-heading mb-4">Tổng đơn hàng</h3>
      
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
        
        {shippingEstimate > 0 && (
          <p className="text-xs text-muted-foreground">
            Mua thêm <span className="text-primary font-medium">{formatPrice(500000 - subtotal)}</span> để được miễn phí giao hàng!
          </p>
        )}

        <Separator className="my-4" />
        
        <div className="flex justify-between items-center text-base font-bold">
          <span>Tổng cộng:</span>
          <span className="text-primary text-xl font-heading">{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-right text-muted-foreground">(Bao gồm VAT nếu có)</p>
      </div>

      <div className="mt-6 space-y-3">
        <Button 
          className="w-full h-12 text-base rounded-full shadow-md" 
          disabled={selectedCount === 0}
          asChild={selectedCount > 0}
        >
          {selectedCount > 0 ? (
            <Link href="/checkout">
              Tiến hành thanh toán <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <>Chọn sản phẩm để thanh toán</>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Thanh toán bảo mật toàn cầu</span>
        </div>
      </div>
    </div>
  );
}
