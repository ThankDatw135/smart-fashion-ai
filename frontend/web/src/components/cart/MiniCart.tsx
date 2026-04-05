"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useCartStore, useCartTotals } from "@/stores/cart.store";
import { CartItem } from "./CartItem";
import { formatPrice } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";

export function MiniCart() {
  const [isMounted, setIsMounted] = useState(false);
  const { items, itemCount, selectedCount, subtotal } = useCartTotals();
  const toggleAllSelections = useCartStore((s) => s.toggleAllSelections);
  
  const allSelected = items.length > 0 && items.every((i) => i.selected !== false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingBag className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group hover:bg-accent hover:text-accent-foreground rounded-full">
          <ShoppingBag className="h-5 w-5 transition-transform group-hover:scale-110" />
          {itemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground border border-background">
              {itemCount > 99 ? "99+" : itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b pb-4">
          <SheetTitle className="font-heading">Giỏ Hàng ({itemCount})</SheetTitle>
          {items.length > 0 && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="select-all" 
                checked={allSelected} 
                onCheckedChange={(checked) => toggleAllSelections(!!checked)}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Chọn tất cả ({selectedCount}/{itemCount})
              </label>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
              <SheetClose asChild>
                <Button variant="outline" className="mt-4 rounded-full" asChild>
                  <Link href="/products">Tiếp tục mua sắm</Link>
                </Button>
              </SheetClose>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item) => (
                <CartItem key={item.id} item={item} variant="compact" />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-6 border-t bg-muted/20 flex-col gap-4 sm:flex-col">
            <div className="flex justify-between items-center w-full mb-2">
              <span className="font-medium text-muted-foreground">Tạm tính ({selectedCount} sản phẩm)</span>
              <span className="font-bold text-xl text-primary">{formatPrice(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <SheetClose asChild>
                <Button variant="outline" className="w-full h-11 rounded-full" asChild>
                  <Link href="/cart">Xem chi tiết</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button className="w-full h-11 rounded-full shadow-md" asChild>
                  <Link href="/checkout">Thanh toán</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
