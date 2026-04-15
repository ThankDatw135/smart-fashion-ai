"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Star, MessageSquareQuote, CheckSquare, EyeOff, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Review } from "@/types/review";
import { useAdminReviews } from "@/hooks/useReviews";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReviewsAPI } from "@/services/reviews.api";
import { toast } from "sonner";

function ConfirmDeleteDialog({
  open,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Xóa đánh giá?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Hành động này sẽ xóa vĩnh viễn đánh giá. Không thể hoàn tác.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>Hủy</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xóa"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => ReviewsAPI.approveReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Đã duyệt đánh giá!");
    },
    onError: () => toast.error("Không thể duyệt đánh giá."),
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) => ReviewsAPI.hideReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Đã ẩn đánh giá!");
    },
    onError: () => toast.error("Không thể ẩn đánh giá."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ReviewsAPI.adminDeleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Đã xóa đánh giá!");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Không thể xóa đánh giá."),
  });

  const columns = useMemo<ColumnDef<Review>[]>(
    () => [
      {
        accessorKey: "rating",
        header: "Sao",
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
          <div className="max-w-[280px]">
            <span className="text-sm line-clamp-2" title={row.original.content}>
              &ldquo;{row.original.content}&rdquo;
            </span>
          </div>
        ),
      },
      {
        accessorKey: "productId",
        header: "Sản phẩm (ID)",
        cell: ({ row }) => (
          <span className="text-sm font-medium font-mono text-muted-foreground truncate max-w-[160px] block">
            {row.original.productId}
          </span>
        ),
      },
      {
        accessorKey: "userId",
        header: "Người dùng",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">{row.original.userId}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "PENDING") badgeStatus = "pending";
          if (row.original.status === "HIDDEN") badgeStatus = "error";
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày gửi",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd/MM/yy HH:mm")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="flex items-center justify-end gap-1">
              {/* Approve */}
              <Button
                variant="ghost"
                size="icon"
                title="Duyệt — hiện lên web"
                disabled={status === "APPROVED" || approveMutation.isPending}
                onClick={() => approveMutation.mutate(row.original.id)}
              >
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              </Button>
              {/* Hide */}
              <Button
                variant="ghost"
                size="icon"
                title="Ẩn đánh giá"
                disabled={status === "HIDDEN" || hideMutation.isPending}
                onClick={() => hideMutation.mutate(row.original.id)}
              >
                <EyeOff className="w-4 h-4 text-amber-500" />
              </Button>
              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                title="Xóa vĩnh viễn"
                onClick={() => setDeleteTarget(row.original.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive opacity-75 hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          );
        },
      },
    ],
    [approveMutation, hideMutation]
  );

  const { data: res } = useAdminReviews();
  const reviews = res?.data || [];

  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <MessageSquareQuote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Đánh giá của Khách Hàng</h1>
            <p className="text-muted-foreground mt-1">
              Kiểm duyệt review ({reviews.length} tổng
              {pendingCount > 0 && (
                <span className="text-amber-600 font-medium"> · {pendingCount} chờ duyệt</span>
              )}
              ).
            </p>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={reviews} pageCount={res?.meta?.totalPages || 1} />
    </div>
  );
}
