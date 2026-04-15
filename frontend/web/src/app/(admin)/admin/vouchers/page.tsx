"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Ticket, AlertTriangle, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { Voucher } from "@/types/voucher";
import { useVouchers } from "@/hooks/useVouchers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { VouchersAPI } from "@/services/vouchers.api";
import { toast } from "sonner";

// ---- Confirm Delete Dialog ----
function ConfirmDeleteDialog({
  open,
  voucherCode,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  voucherCode: string;
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
            <h2 className="text-base font-semibold">Xóa voucher?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Xác nhận xóa voucher{" "}
              <span className="font-mono font-semibold text-foreground">{voucherCode}</span>?
              Hành động này không thể hoàn tác.
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

export default function AdminVouchersPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => VouchersAPI.deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success("Đã xóa voucher!");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Không thể xóa voucher."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      VouchersAPI.updateVoucher(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["vouchers"] });
      toast.success(isActive ? "Đã kích hoạt voucher" : "Đã tắt voucher");
    },
    onError: () => toast.error("Không thể thay đổi trạng thái."),
  });

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
            <div>
              <span className="font-semibold font-mono">{row.original.code}</span>
              <p className="text-xs text-muted-foreground">{(row.original as any).name || ""}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "discountValue",
        header: "Mức giảm",
        cell: ({ row }) => (
          <span className="font-medium text-destructive">
            {row.original.discountType === "PERCENTAGE"
              ? `${row.original.discountValue}%`
              : formatPrice(row.original.discountValue)}
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
        header: "Đã dùng / Giới hạn",
        cell: ({ row }) => {
          const used = (row.original as any).usedCount || 0;
          const limit = row.original.usageLimit;
          const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm">
                {used} / {limit || "∞"}
              </span>
              {limit && (
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                </div>
              )}
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
          const isExpired = row.original.endDate && new Date(row.original.endDate) < new Date();
          if (isExpired) badgeStatus = "error";
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        accessorKey: "endDate",
        header: "Hết hạn",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.endDate
              ? format(new Date(row.original.endDate), "dd/MM/yyyy")
              : "Không giới hạn"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {/* Toggle active */}
            <Button
              variant="ghost"
              size="icon"
              title={row.original.isActive ? "Tắt voucher" : "Bật voucher"}
              onClick={() =>
                toggleMutation.mutate({ id: row.original.id, isActive: !row.original.isActive })
              }
            >
              {row.original.isActive ? (
                <ToggleRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
            {/* Edit */}
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/vouchers/${row.original.id}`}>
                <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
            {/* Delete */}
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)}>
              <Trash2 className="w-4 h-4 text-destructive opacity-75 hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        ),
      },
    ],
    [toggleMutation]
  );

  const { data: res } = useVouchers();
  const vouchers = res?.data || [];

  return (
    <div className="space-y-6">
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        voucherCode={deleteTarget?.code || ""}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Khuyến mãi & Vouchers</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý mã giảm giá, chương trình khuyến mãi ({vouchers.length} vouchers).
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/vouchers/new">
            <Plus className="w-4 h-4 mr-2" /> Tạo Voucher mới
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={vouchers} />
    </div>
  );
}
