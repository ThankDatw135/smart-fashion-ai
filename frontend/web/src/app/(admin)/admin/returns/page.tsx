"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, X } from "lucide-react";
import { format } from "date-fns";

type ReturnRequest = {
  id: string;
  orderId: string;
  customerName: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  createdAt: Date;
};

// Mock data
const MOCK_RETURNS: ReturnRequest[] = [
  {
    id: "RET-1001",
    orderId: "ORD-2026-0985",
    customerName: "Nguyễn Văn A",
    reason: "Sản phẩm không đúng kích cỡ mô tả.",
    status: "pending",
    createdAt: new Date(),
  },
  {
    id: "RET-1002",
    orderId: "ORD-2026-0980",
    customerName: "Trần Thị B",
    reason: "Lỗi đường chỉ may bên hông áo.",
    status: "approved",
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "RET-1003",
    orderId: "ORD-2026-0950",
    customerName: "Lê C",
    reason: "Không thích nữa.",
    status: "rejected",
    createdAt: new Date(Date.now() - 86400000 * 3),
  },
];

export default function AdminReturnsPage() {
  const columns = useMemo<ColumnDef<ReturnRequest>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Mã Yêu Cầu",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span className="font-semibold">{row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "orderId",
        header: "Mã Đơn Tương Ứng",
        cell: ({ row }) => <span className="text-primary cursor-pointer hover:underline">{row.original.orderId}</span>,
      },
      {
        accessorKey: "customerName",
        header: "Khách hàng",
        cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
      },
      {
        accessorKey: "reason",
        header: "Lý do",
        cell: ({ row }) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block" title={row.original.reason}>{row.original.reason}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "pending") badgeStatus = "pending";
          if (row.original.status === "rejected") badgeStatus = "error";
          if (row.original.status === "approved") badgeStatus = "active"; // can style differently if needed
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày gửi",
        cell: ({ row }) => <span className="text-sm">{format(row.original.createdAt, "dd/MM/yyyy")}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="icon" className="text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50" disabled={row.original.status !== "pending"}>
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10 disabled:opacity-50" disabled={row.original.status !== "pending"}>
              <X className="w-4 h-4" />
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
          <h1 className="text-3xl font-heading font-bold tracking-tight">Yêu cầu Đổi / Trả hàng</h1>
          <p className="text-muted-foreground mt-1">
            Xử lý các khiếu nại hoàn trả sản phẩm từ khách hàng.
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={MOCK_RETURNS} />
    </div>
  );
}
