"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  MapPin,
  CreditCard,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/checkout/StepIndicator";
import { OrdersAPI } from "@/services/orders.api";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { SafeImage } from "@/components/ui/safe-image";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  // Fetch order details if orderId is available
  const { data, isLoading } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => OrdersAPI.getOrderById(orderId!),
    enabled: !!orderId,
  });

  const order = data?.data;

  return (
    <div className="container py-12 max-w-4xl min-h-[70vh]">
      <StepIndicator currentStep={3} />

      {/* Success Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-10 mt-10 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        <h1 className="text-3xl font-heading font-bold mb-3">Đặt hàng thành công!</h1>
        <p className="text-emerald-700 dark:text-emerald-300 mb-2 max-w-md">
          Cảm ơn bạn đã mua sắm tại Smart Fashion AI. Đơn hàng của bạn đang được xử lý và sẽ sớm gửi đến bạn.
        </p>

        {order?.orderNumber && (
          <p className="mt-2 mb-6">
            Mã đơn hàng:{" "}
            <strong className="font-mono bg-emerald-100 dark:bg-emerald-900 px-3 py-1 rounded-md text-emerald-800 dark:text-emerald-200">
              {order.orderNumber}
            </strong>
          </p>
        )}

        {!order && !isLoading && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-6">
            Bạn có thể xem chi tiết đơn hàng trong trang &ldquo;Đơn hàng của tôi&rdquo;.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button
            asChild
            variant="outline"
            className="border-emerald-200 hover:bg-emerald-100 dark:border-emerald-800 dark:hover:bg-emerald-900"
          >
            <Link href="/account/orders">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Xem đơn hàng
            </Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="/products">
              Tiếp tục mua sắm
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Order Details — only show if we have real order data */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Đang tải thông tin đơn hàng...</span>
        </div>
      )}

      {order && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Shipping info */}
          <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary mb-2">
              <MapPin className="w-5 h-5" />
              <h3 className="font-semibold">Địa chỉ giao hàng</h3>
            </div>
            <div className="text-sm space-y-1.5">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.shippingPhone}</p>
              <p className="text-muted-foreground leading-relaxed">
                {[order.shippingAddress, order.shippingWard, order.shippingDistrict, order.shippingProvince]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>

          {/* Payment info */}
          <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-semibold">Thanh toán</h3>
            </div>
            <div className="text-sm space-y-1.5">
              <p>{order.payment?.method === "cod" ? "Thanh toán khi nhận hàng (COD)" : order.payment?.method === "bank_transfer" ? "Chuyển khoản ngân hàng" : "MoMo"}</p>
              <p className="text-muted-foreground">
                Trạng thái:{" "}
                <span className={`font-medium ${order.payment?.status === "success" ? "text-emerald-600" : "text-amber-600"}`}>
                  {order.payment?.status === "success" ? "Đã thanh toán" : "Chờ thanh toán"}
                </span>
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Package className="w-5 h-5" />
              <h3 className="font-semibold">Tóm tắt</h3>
            </div>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sản phẩm ({order.items?.length || 0})</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span className="text-emerald-600">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí ship</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t mt-2 text-base">
                <span>Tổng</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items list */}
      {order?.items && order.items.length > 0 && (
        <div className="mt-6 p-6 rounded-2xl border bg-card shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Chi tiết sản phẩm</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <SafeImage 
                      src={item.imageUrl} 
                      alt={item.productName} 
                      fill
                      className="object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">IMG</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.variantInfo} • x{item.quantity}
                  </p>
                </div>
                <div className="font-semibold text-sm text-primary">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
