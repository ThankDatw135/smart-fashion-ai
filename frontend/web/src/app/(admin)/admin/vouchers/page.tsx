"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Ticket } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";

import { Voucher } from "@/types/voucher";
import { useVouchers } from "@/hooks/useVouchers";

export default function AdminVouchersPage() {
  const columns = useMemo<ColumnDef<Voucher>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Mã Khuyến Mãi",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Ticket className="w-4 h-4" />
            </div>
            <span className="font-semibold">{row.original.code}</span>
          </div>
        ),
      },
      {
        accessorKey: "discountValue",
        header: "Mức giảm",
        cell: ({ row }) => (
          <span className="font-medium text-destructive">
            {row.original.discountType === "PERCENTAGE" ? `${row.original.discountValue}%` : formatPrice(row.original.discountValue)}
          </span>
        ),
      },
      {
        accessorKey: "minOrderValue",
        header: "Đơn tối thiểu",
        cell: ({ row }) => <span>{formatPrice(row.original.minOrderValue || 0)}</span>,
      },
      {
        accessorKey: "usageLimit",
        header: "Đã dùng",
        cell: ({ row }) => {
          const usedCount = 0; // Tạm thời
          const usageLimit = row.original.usageLimit || 1;
          const percentage = Math.min((usedCount / usageLimit) * 100, 100);
          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm">
                {usedCount} / {row.original.usageLimit || "∞"}
              </span>
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${percentage}%` }} 
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (!row.original.isActive) badgeStatus = "pending";
          const isExpired = new Date(row.original.endDate) < new Date();
          if (isExpired) badgeStatus = "error";
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        accessorKey: "endDate",
        header: "Hết hạn",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{format(new Date(row.original.endDate), "dd/MM/yyyy")}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon">
              <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="w-4 h-4 text-destructive opacity-75 hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const { data: res } = useVouchers();
  const vouchers = res?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Khuyến mãi & Vouchers</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý mã giảm giá, chương trình khuyến mãi.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Tạo Voucher mới
        </Button>
      </div>

      <DataTable columns={columns} data={vouchers} />
    </div>
  );
}
