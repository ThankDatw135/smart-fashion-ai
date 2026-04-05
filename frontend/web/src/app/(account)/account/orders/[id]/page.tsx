"use client";

import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, CreditCard, MapPin, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { formatPrice } from "@/lib/utils";
import { use } from "react";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);

  // Mock order detail
  const order = {
    id,
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    status: "processing" as const,
    paymentMethod: "Thanh toán khi nhận hàng (COD)",
    paymentStatus: "Chưa thanh toán",
    shippingAddress: {
      name: "Nguyễn Văn A",
      phone: "0912345678",
      fullAddress: "123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội"
    },
    items: [
      { id: "1", name: "Áo Polo Nam Premium MD3", variant: "Đen / L", price: 450000, quantity: 2, image: "/images/products/ao-thun-1.jpg" },
      { id: "2", name: "Quần Short Kaki Nam", variant: "Beige / 32", price: 350000, quantity: 1, image: "/images/products/jeans.jpg" }
    ],
    subtotal: 1250000,
    shippingFee: 35000,
    discount: 50000,
    total: 1235000,
    events: [
      { status: "processing" as const, date: new Date(), description: "Đơn hàng đang được chuẩn bị để giao cho ĐVVC" },
      { status: "pending" as const, date: new Date(new Date().getTime() - 86400000), description: "Hệ thống đã nhận đơn đặt hàng" },
    ]
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" asChild>
              <Link href="/account/orders"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <h1 className="text-2xl font-heading font-bold">Đơn hàng {order.id}</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Đang xử lý</Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Ngày đặt: {format(order.date, "HH:mm dd/MM/yyyy", { locale: vi })}
          </p>
        </div>
        <Button variant="outline" className="shrink-0 gap-2">
          <Printer className="w-4 h-4" /> In hóa đơn
        </Button>
      </div>

      <OrderTimeline status={order.status} events={order.events} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Shipping Address */}
        <div className="bg-background border rounded-2xl p-6">
          <div className="flex items-center gap-2 font-semibold mb-4 text-lg">
            <MapPin className="w-5 h-5 text-primary" /> Địa chỉ nhận hàng
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-base">{order.shippingAddress.name}</p>
            <p className="text-muted-foreground">Điện thoại: {order.shippingAddress.phone}</p>
            <p className="text-muted-foreground leading-relaxed">{order.shippingAddress.fullAddress}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-background border rounded-2xl p-6">
          <div className="flex items-center gap-2 font-semibold mb-4 text-lg">
            <CreditCard className="w-5 h-5 text-primary" /> Thanh toán
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between pb-2 border-b border-border/50">
              <span className="text-muted-foreground">Phương thức:</span>
              <span className="font-medium">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Trạng thái:</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items & Summary */}
      <div className="bg-background border rounded-2xl overflow-hidden mt-8">
        <h3 className="font-semibold p-6 pb-4 border-b text-lg">Sản phẩm đã đặt</h3>
        
        <div className="px-6 py-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 py-4 border-b border-border/40 last:border-0">
              <div className="w-20 h-24 bg-muted rounded-md shrink-0 overflow-hidden">
                { }
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/products/tshirt.jpg"; }}
                />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">Phân loại: {item.variant} x {item.quantity}</p>
              </div>
              <div className="font-medium text-right flex items-center shrink-0">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/30 p-6 flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tạm tính:</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phí vận chuyển:</span>
            <span>{formatPrice(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Giảm giá:</span>
            <span>-{formatPrice(order.discount)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Tổng cộng:</span>
            <span className="text-primary text-2xl font-heading">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
