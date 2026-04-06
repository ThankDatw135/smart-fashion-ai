"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Star, MessageSquareQuote, CheckSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Review } from "@/types/review";
import { useAdminReviews } from "@/hooks/useReviews";

export default function AdminReviewsPage() {
  const columns = useMemo<ColumnDef<Review>[]>(
    () => [
      {
        accessorKey: "rating",
        header: "Đánh giá",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold">{row.original.rating}</span>
          </div>
        ),
      },
      {
        accessorKey: "content",
        header: "Nội dung",
        cell: ({ row }) => (
          <div className="max-w-[300px]">
             <span className="text-sm line-clamp-2" title={row.original.content}>&quot;{row.original.content}&quot;</span>
          </div>
        ),
      },
      {
        accessorKey: "productId",
        header: "Sản phẩm (ID)",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-primary hover:underline cursor-pointer truncate max-w-[200px] block">
            {row.original.productId}
          </span>
        ),
      },
      {
        accessorKey: "userId",
        header: "Người dùng (ID)",
        cell: ({ row }) => <span className="text-xs">{row.original.userId}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "PENDING") badgeStatus = "pending";
          if (row.original.status === "HIDDEN") badgeStatus = "error";
          
          return (
            <StatusBadge 
              status={badgeStatus} 
            />
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày gửi",
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm")}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" title="Duyệt đưa lên web" disabled={row.original.status === "APPROVED"}>
              <CheckSquare className="w-4 h-4 text-emerald-500" />
            </Button>
            <Button variant="ghost" size="icon" title="Ẩn/Xóa">
              <Trash2 className="w-4 h-4 text-destructive opacity-75 hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const { data: res } = useAdminReviews();
  const reviews = res?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
             <MessageSquareQuote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Đánh giá của Khách Hàng</h1>
            <p className="text-muted-foreground mt-1">
              Kiểm duyệt review để xuất hiện trên trang Sản phẩm.
            </p>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={reviews} pageCount={res?.meta?.totalPages || 1} />
    </div>
  );
}
