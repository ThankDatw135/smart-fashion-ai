"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Star, MessageSquareQuote, CheckSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";

type ReviewItem = {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  status: "published" | "pending" | "hidden";
  createdAt: Date;
};

// Mock data
const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: "REV-2001",
    productName: "Áo Blazer Nam Phong Cách Hàn Quốc",
    customerName: "Minh D",
    rating: 5,
    comment: "Sản phẩm Form lên rất chuẩn, vải đẹp, xứng đáng với giá tiền.",
    status: "published",
    createdAt: new Date(),
  },
  {
    id: "REV-2002",
    productName: "Áo Thun Cổ Tròn Basic",
    customerName: "Hoàng K",
    rating: 2,
    comment: "Giao hàng hơi chậm, áo rút sau lần giặt đầu.",
    status: "pending",
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "REV-2003",
    productName: "Đầm Dự Tiệc Sang Trọng",
    customerName: "Ngọc M",
    rating: 1,
    comment: "Spam quảng cáo website lạ link rác abc.xyz lừa đảo.",
    status: "hidden",
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
];

export default function AdminReviewsPage() {
  const columns = useMemo<ColumnDef<ReviewItem>[]>(
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
        accessorKey: "comment",
        header: "Nội dung",
        cell: ({ row }) => (
          <div className="max-w-[300px]">
             <span className="text-sm line-clamp-2" title={row.original.comment}>&quot;{row.original.comment}&quot;</span>
          </div>
        ),
      },
      {
        accessorKey: "productName",
        header: "Sản phẩm",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-primary hover:underline cursor-pointer truncate max-w-[200px] block">
            {row.original.productName}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Tên hiển thị",
        cell: ({ row }) => <span className="text-xs">{row.original.customerName}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "pending") badgeStatus = "pending";
          if (row.original.status === "hidden") badgeStatus = "error";
          
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
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{format(row.original.createdAt, "dd/MM/yyyy HH:mm")}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" title="Duyệt đưa lên web" disabled={row.original.status === "published"}>
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

      <DataTable columns={columns} data={MOCK_REVIEWS} />
    </div>
  );
}
