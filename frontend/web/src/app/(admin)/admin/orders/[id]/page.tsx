"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Check,
  ChevronLeft,
  CreditCard,
  Loader2,
  MapPin,
  PackageX,
  Truck,
  RefreshCw,
  User,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { AdminOrdersAPI } from "@/services/orders.api";
import { Order, OrderStatus } from "@/types/order";
import { SafeImage } from "@/components/ui/safe-image";

// Trạng thái pipeline — lowercase match backend
const STATUS_PIPELINE: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Đã đặt hàng" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "preparing", label: "Đang chuẩn bị" },
  { key: "shipping", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "completed", label: "Hoàn thành" },
];

// Map lowercase OrderStatus → StatusBadge type
const statusBadgeMap: Record<string, StatusType> = {
  pending: "pending",
  confirmed: "processing",
  preparing: "processing",
  shipping: "shipped",
  delivered: "delivered",
  completed: "completed",
  cancelled: "cancelled",
  return_requested: "warning",
  returned: "info",
};

// Quy tắc chuyển trạng thái — PHẢI dùng lowercase để match backend VALID_TRANSITIONS
const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; variant?: "default" | "destructive" }[]>> = {
  pending: [
    { status: "confirmed", label: "Xác nhận đơn hàng" },
    { status: "cancelled", label: "Hủy đơn", variant: "destructive" },
  ],
  confirmed: [
    { status: "preparing", label: "Bắt đầu chuẩn bị" },
    { status: "cancelled", label: "Hủy đơn", variant: "destructive" },
  ],
  preparing: [
    { status: "shipping", label: "Bắt đầu giao hàng" },
    { status: "cancelled", label: "Hủy đơn", variant: "destructive" },
  ],
  shipping: [
    { status: "delivered", label: "Xác nhận đã giao" },
  ],
  delivered: [
    { status: "completed", label: "Đánh dấu hoàn thành" },
  ],
};

// Payment label helpers
const paymentMethodLabel: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  momo: "MoMo",
};
const paymentStatusColor: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-500",
  pending: "bg-amber-500/10 text-amber-500",
  failed: "bg-red-500/10 text-red-500",
  refunded: "bg-blue-500/10 text-blue-500",
};
const paymentStatusLabel: Record<string, string> = {
  success: "Đã thanh toán",
  pending: "Chờ thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders", orderId],
    queryFn: () => AdminOrdersAPI.getOrderById(orderId),
    enabled: !!orderId,
  });

  const updateStatus = useMutation({
    mutationFn: (newStatus: string) => AdminOrdersAPI.updateStatus(orderId, newStatus),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái đơn hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => {
      toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải chi tiết đơn hàng...</span>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <PackageX className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive font-medium">Không tìm thấy đơn hàng.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/admin/orders">
            <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Link>
        </Button>
      </div>
    );
  }

  const order = data.data as Order;
  const currentStatusIndex = STATUS_PIPELINE.findIndex((s) => s.key === order.status);
  const isCancelledOrReturned = ["cancelled", "return_requested", "returned"].includes(order.status);
  const nextActions = NEXT_STATUS[order.status] || [];
  const pStatus = order.payment?.status || "pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/orders">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-heading font-bold tracking-tight">Chi tiết Đơn hàng</h1>
            <StatusBadge status={statusBadgeMap[order.status] || "default"} />
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Mã đơn:{" "}
            <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>
            {" • "}
            Ngày đặt:{" "}
            {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <div className="p-6 rounded-3xl border bg-card shadow-sm">
            <h3 className="font-semibold text-lg mb-6">Trạng thái Xử lý</h3>

            {isCancelledOrReturned ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
                <PackageX className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400 capitalize">
                    Đơn hàng: {order.status.replace("_", " ")}
                  </p>
                  {order.cancelReason && (
                    <p className="text-sm text-red-600 dark:text-red-500 mt-1">Lý do: {order.cancelReason}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative flex justify-between items-start px-4">
                {/* Progress track */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
                  style={{
                    width: currentStatusIndex >= 0
                      ? `${(currentStatusIndex / (STATUS_PIPELINE.length - 1)) * 100}%`
                      : "0%",
                  }}
                />
                {STATUS_PIPELINE.map((step, idx) => {
                  const done = idx <= currentStatusIndex;
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 w-16">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        done
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-card border-muted text-muted-foreground"
                      }`}>
                        <Check className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight ${done ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="p-6 rounded-3xl border bg-card shadow-sm">
            <h3 className="font-semibold text-lg mb-4">
              Sản phẩm ({order.items?.length || 0})
            </h3>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                    <div className="relative w-full h-full">
                      {item.imageUrl ? (
                        <SafeImage src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">IMG</div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.variantInfo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatPrice(item.price)}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <div className="w-28 text-right font-semibold text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 mt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {(order.discountAmount || order.discount) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Giảm giá</span>
                    <span className="text-destructive">
                      -{formatPrice(order.discountAmount || order.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Phí vận chuyển</span>
                  <span>{formatPrice(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t">
                  <span>Tổng tiền</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="p-6 rounded-3xl border bg-card shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" /> Lịch sử trạng thái
              </h3>
              <div className="space-y-3">
                {order.statusHistory.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium capitalize">{h.status.replace("_", " ")} {h.note && `— ${h.note}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(h.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        {h.changer?.fullName && ` • bởi ${h.changer.fullName}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="p-5 rounded-3xl border bg-card shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" /> Khách hàng
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Tên:</span> <span className="font-medium">{order.user?.fullName || order.shippingName}</span></p>
              {order.user?.email && <p><span className="text-muted-foreground">Email:</span> {order.user.email}</p>}
              <p><span className="text-muted-foreground">SĐT:</span> {order.shippingPhone}</p>
            </div>
          </div>

          {/* Shipping */}
          <div className="p-5 rounded-3xl border bg-card shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground" /> Địa chỉ giao hàng
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.shippingPhone}</p>
              <p className="text-muted-foreground leading-relaxed">
                {[order.shippingAddress, order.shippingWard, order.shippingDistrict, order.shippingProvince]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.note && (
                <p className="text-muted-foreground italic pt-2 border-t">Ghi chú: {order.note}</p>
              )}
              <div className="pt-3 mt-1 border-t flex items-center gap-2 text-muted-foreground">
                <Truck className="w-4 h-4" />
                <span>Phí ship: {formatPrice(order.shippingFee)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="p-5 rounded-3xl border bg-card shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" /> Thanh toán
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                {paymentMethodLabel[order.payment?.method || "cod"]}
              </p>
              {order.voucher && (
                <p><span className="text-muted-foreground">Voucher:</span> <span className="font-mono font-medium">{order.voucher.code}</span></p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${paymentStatusColor[pStatus] || "bg-muted text-muted-foreground"}`}>
                  {paymentStatusLabel[pStatus] || pStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {nextActions.length > 0 && (
            <div className="space-y-3">
              {nextActions.map((action) => (
                <Button
                  key={action.status}
                  className="w-full"
                  size="lg"
                  variant={action.variant || "default"}
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate(action.status)}
                >
                  {updateStatus.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang cập nhật...</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-2" /> {action.label}</>
                  )}
                </Button>
              ))}
            </div>
          )}

          {isCancelledOrReturned && (
            <p className="text-center text-sm text-muted-foreground">
              Đơn hàng đã kết thúc, không thể thay đổi trạng thái.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
