"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Eye, PackageX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import { useMyOrders } from "@/hooks/useOrders";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800 border-blue-200" },
  shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  delivered: { label: "Hoàn tất", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200" },
  returned: { label: "Trả hàng", color: "bg-orange-100 text-orange-800 border-orange-200" },
};

function OrderList({ orders, isLoading }: { orders: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải đơn hàng...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-background rounded-xl border border-dashed">
        <PackageX className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground font-medium">Bạn chưa có đơn hàng nào ở trạng thái này.</p>
        <Button asChild className="mt-4 rounded-full" variant="outline">
          <Link href="/products">Bắt đầu mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const status = statusMap[order.status?.toLowerCase()] || statusMap.pending;
        return (
          <div key={order.id} className="bg-background rounded-2xl border p-5 sm:p-6 shadow-sm hover:border-primary/50 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 mb-4">
              <div className="flex flex-col">
                <span className="font-semibold text-lg">{order.id}</span>
                <span className="text-sm text-muted-foreground">
                  {order.createdAt ? format(new Date(order.createdAt), "HH:mm dd/MM/yyyy", { locale: vi }) : "—"}
                </span>
              </div>
              <Badge variant="outline" className={status.color}>
                {status.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 py-2">
              <div className="w-16 h-16 bg-muted rounded-md overflow-hidden shrink-0 relative">
                <Image
                  src={order.items?.[0]?.image || "/images/placeholder.svg"}
                  alt={order.items?.[0]?.name || "Sản phẩm"}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium line-clamp-1">{order.items?.[0]?.name || "Sản phẩm"}</p>
                {(order.items?.length || 0) > 1 && (
                  <p className="text-sm text-muted-foreground">và {order.items.length - 1} sản phẩm khác...</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary">{formatPrice(order.totalAmount || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Tổng cộng ({order.items?.length || 0} sp)</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              {order.status?.toLowerCase() === "delivered" && (
                <Button variant="outline" asChild>
                  <Link href={`/account/orders/${order.id}/return`}>Yêu cầu trả hàng</Link>
                </Button>
              )}
              <Button asChild>
                <Link href={`/account/orders/${order.id}`}>
                  Xem chi tiết <Eye className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { data, isLoading } = useMyOrders();
  const [activeTab, setActiveTab] = useState("all");

  const orders = data?.data || [];
  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter((o: any) => o.status?.toLowerCase() === activeTab);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Lịch sử đơn hàng</h1>
        <p className="text-sm text-muted-foreground">Theo dõi và quản lý trạng thái các đơn đặt hàng đã mua.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto overflow-y-hidden bg-transparent border-b rounded-none h-12 p-0 space-x-6">
          {["all", "processing", "shipped", "delivered", "cancelled"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 bg-transparent data-[state=active]:bg-transparent"
            >
              {tab === "all" ? "Tất cả" : statusMap[tab]?.label || tab}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {["all", "processing", "shipped", "delivered", "cancelled"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <OrderList 
              orders={tab === activeTab ? filteredOrders : []} 
              isLoading={isLoading} 
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
