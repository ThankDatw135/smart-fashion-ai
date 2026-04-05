"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { VoucherInput } from "@/components/cart/VoucherInput";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore } from "@/stores/cart.store";
import { useEffect, useState } from "react";

export function CartView() {
  const { items, clearCart } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="container min-h-[60vh] py-12 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container min-h-[60vh] py-16 flex flex-col items-center justify-center text-center">
        <div className="h-24 w-24 bg-muted overflow-hidden ring-1 ring-border shadow-sm rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold font-heading mb-3">Giỏ hàng trống</h2>
        <p className="text-muted-foreground max-w-sm mb-8">
          Bạn chưa có sản phẩm nào trong giỏ hàng. Khám phá ngay các bộ sưu tập thời trang mới nhất!
        </p>
        <Button size="lg" className="rounded-full shadow-md" asChild>
          <Link href="/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-3xl font-bold font-heading mb-8">Giỏ hàng của bạn</h1>
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pl-2 pr-2 md:pl-0 md:pr-0">
        {/* Chi tiết sản phẩm */}
        <div className="flex-1">
          <div className="hidden md:flex justify-between items-center pb-4 border-b text-sm font-medium text-muted-foreground">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="select-all-cart" 
                checked={items.length > 0 && items.every(i => i.selected !== false)} 
                onCheckedChange={(checked: boolean) => useCartStore.getState().toggleAllSelections(!!checked)}
              />
              <label htmlFor="select-all-cart" className="cursor-pointer">
                Chọn tất cả ({items.filter(i => i.selected !== false).reduce((acc, curr) => acc + curr.quantity, 0)}/{items.reduce((acc, curr) => acc + curr.quantity, 0)} sản phẩm)
              </label>
            </div>
            <span>Giá tiền</span>
          </div>
          
          <div className="flex flex-col">
            {items.map((item) => (
              <CartItem key={item.id} item={item} variant="full" />
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/products">← Tới danh mục sắm</Link>
            </Button>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" 
              onClick={() => clearCart()}
            >
              Xóa tất cả
            </Button>
          </div>
        </div>

        {/* Tổng kết giỏ hàng */}
        <div className="w-full lg:w-[380px] shrink-0 space-y-6">
          <div className="bg-muted/30 rounded-xl p-6 border ring-1 ring-border/50">
            <h3 className="font-medium text-sm mb-3">Mã giảm giá</h3>
            <VoucherInput />
          </div>

          <CartSummary />
        </div>
      </div>
    </div>
  );
}
