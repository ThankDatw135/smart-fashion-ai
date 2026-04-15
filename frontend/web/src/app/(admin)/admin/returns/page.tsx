"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ReturnRequest, AdminReturnsAPI } from "@/services/returns.api";
import { useAdminReturns } from "@/hooks/useReturns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminReturnsPage() {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      AdminReturnsAPI.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      const label = status === "approved" ? "Đã chấp thuận" : "Đã từ chối";
      toast.success(`${label} yêu cầu đổi/trả hàng!`);
    },
    onError: () => toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại."),
  });

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
            <span className="font-semibold font-mono text-sm">{row.original.id}</span>
          </div>
        ),
      },
      {
        accessorKey: "orderId",
        header: "Mã Đơn Hàng",
        cell: ({ row }) => (
          <span className="text-primary font-mono text-sm cursor-pointer hover:underline">
            {row.original.orderId}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Khách hàng",
        cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
      },
      {
        accessorKey: "reason",
        header: "Lý do",
        cell: ({ row }) => (
          <span
            className="text-sm text-muted-foreground truncate max-w-[220px] block"
            title={row.original.reason}
          >
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const statusMap: Record<string, StatusType> = {
            pending: "pending",
            approved: "active",
            rejected: "error",
            completed: "active",
          };
          return <StatusBadge status={statusMap[row.original.status] || "default"} />;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày gửi",
        cell: ({ row }) => {
          try {
            return (
              <span className="text-sm text-muted-foreground">
                {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
              </span>
            );
          } catch {
            return <span className="text-sm">{row.original.createdAt}</span>;
          }
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isPending = row.original.status === "pending";
          const isProcessing = updateStatusMutation.isPending;

          return (
            <div className="flex items-center justify-end gap-2">
              {/* Approve */}
              <Button
                variant="outline"
                size="icon"
                title="Chấp thuận yêu cầu"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                disabled={!isPending || isProcessing}
                onClick={() =>
                  updateStatusMutation.mutate({ id: row.original.id, status: "approved" })
                }
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              {/* Reject */}
              <Button
                variant="outline"
                size="icon"
                title="Từ chối yêu cầu"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 disabled:opacity-40"
                disabled={!isPending || isProcessing}
                onClick={() =>
                  updateStatusMutation.mutate({ id: row.original.id, status: "rejected" })
                }
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [updateStatusMutation]
  );

  const { data: res } = useAdminReturns();
  const returns = res?.data || [];
  const pendingCount = returns.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Yêu cầu Đổi / Trả hàng</h1>
          <p className="text-muted-foreground mt-1">
            Xử lý các khiếu nại hoàn trả sản phẩm ({returns.length} yêu cầu
            {pendingCount > 0 && (
              <span className="text-amber-600 font-medium"> · {pendingCount} chờ xử lý</span>
            )}
            ).
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={returns} pageCount={res?.meta?.totalPages || 1} />
    </div>
  );
}
