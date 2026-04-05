"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Clock, Loader2, PackageX } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AdminOrdersAPI } from "@/services/orders.api";
import { Order } from "@/types/order";

export default function AdminOrdersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => AdminOrdersAPI.getOrders(),
  });

  const orders = data?.data || [];

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: "orderNumber",
        header: "Mã ĐH",
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {row.original.orderNumber || row.original.id.slice(0, 12)}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Khách hàng",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-sm">{row.original.shippingName || row.original.user?.fullName || "—"}</p>
            <p className="text-xs text-muted-foreground">{row.original.shippingPhone || "—"}</p>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày đặt",
        cell: ({ row }) => (
          <div className="flex items-center text-muted-foreground text-sm">
            <Clock className="w-3 h-3 mr-1.5" />
            {row.original.createdAt
              ? format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })
              : "—"
            }
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Thanh toán",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-sm">{formatPrice(row.original.total || 0)}</p>
            <p className="text-xs text-muted-foreground capitalize">{row.original.paymentMethod || "—"}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          // Map OrderStatus to StatusType
          const statusMap: Record<string, StatusType> = {
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
          const mapped = statusMap[row.original.status] || "default";
          return <StatusBadge status={mapped} />;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/orders/${row.original.id}`}>
                <Eye className="w-4 h-4 mr-1.5" /> Chi tiết
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải đơn hàng...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <PackageX className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive font-medium">Không thể tải danh sách đơn hàng.</p>
        <p className="text-sm text-muted-foreground mt-1">Vui lòng kiểm tra kết nối backend.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Đơn hàng</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và xử lý {orders.length} đơn hàng của hệ thống.
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={orders} />
    </div>
  );
}
