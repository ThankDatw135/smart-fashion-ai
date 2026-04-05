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

type AdminVoucher = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  status: "active" | "expired" | "disabled";
  expiresAt: Date;
};

// Mock data
const MOCK_VOUCHERS: AdminVoucher[] = [
  {
    id: "VOU-1",
    code: "WELCOME2026",
    type: "percent",
    value: 10,
    minOrderValue: 200000,
    usageLimit: 1000,
    usedCount: 450,
    status: "active",
    expiresAt: new Date(Date.now() + 86400000 * 30),
  },
  {
    id: "VOU-2",
    code: "FREESHIP",
    type: "fixed",
    value: 35000,
    minOrderValue: 500000,
    usageLimit: 500,
    usedCount: 120,
    status: "active",
    expiresAt: new Date(Date.now() + 86400000 * 15),
  },
  {
    id: "VOU-3",
    code: "SUMMER50",
    type: "fixed",
    value: 50000,
    minOrderValue: 1000000,
    usageLimit: 100,
    usedCount: 100,
    status: "expired",
    expiresAt: new Date(Date.now() - 86400000 * 5),
  },
];

export default function AdminVouchersPage() {
  const columns = useMemo<ColumnDef<AdminVoucher>[]>(
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
        accessorKey: "value",
        header: "Mức giảm",
        cell: ({ row }) => (
          <span className="font-medium text-destructive">
            {row.original.type === "percent" ? `${row.original.value}%` : formatPrice(row.original.value)}
          </span>
        ),
      },
      {
        accessorKey: "minOrderValue",
        header: "Đơn tối thiểu",
        cell: ({ row }) => <span>{formatPrice(row.original.minOrderValue)}</span>,
      },
      {
        accessorKey: "usageLimit",
        header: "Đã dùng",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm">
              {row.original.usedCount} / {row.original.usageLimit}
            </span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${(row.original.usedCount / row.original.usageLimit) * 100}%` }} 
              />
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "expired") badgeStatus = "error";
          if (row.original.status === "disabled") badgeStatus = "pending";
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        accessorKey: "expiresAt",
        header: "Hết hạn",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{format(row.original.expiresAt, "dd/MM/yyyy")}</span>,
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

      <DataTable columns={columns} data={MOCK_VOUCHERS} />
    </div>
  );
}
