"use client";

import { useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PackageSearch, Check, X, Pencil, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { InventoryItemResponse, InventoryAPI } from "@/services/inventory.api";
import { useInventory } from "@/hooks/useInventory";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ---- Inline Edit Cell for Stock ----
function StockEditCell({
  item,
  onSave,
}: {
  item: InventoryItemResponse;
  onSave: (id: string, stock: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(item.stock));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const n = Number(val);
    if (isNaN(n) || n < 0) {
      toast.error("Số lượng không hợp lệ");
      return;
    }
    setSaving(true);
    try {
      await onSave(item.id, n);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={`font-semibold text-lg ${
            item.status === "out_of_stock"
              ? "text-destructive"
              : item.status === "low_stock"
              ? "text-amber-500"
              : "text-foreground"
          }`}
        >
          {item.stock}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-primary"
          onClick={() => setEditing(true)}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-20 h-8 text-sm"
        min={0}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") { setEditing(false); setVal(String(item.stock)); }
        }}
      />
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={handleSave}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setEditing(false); setVal(String(item.stock)); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => InventoryAPI.updateStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Đã cập nhật tồn kho!");
    },
    onError: () => toast.error("Không thể cập nhật tồn kho."),
  });

  const handleSaveStock = useCallback(
    async (id: string, stock: number) => {
      await updateStockMutation.mutateAsync({ id, stock });
    },
    [updateStockMutation]
  );

  const columns = useMemo<ColumnDef<InventoryItemResponse>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Sản phẩm",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <PackageSearch className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-sm">{row.original.name}</p>
              <p className="text-xs text-muted-foreground font-mono">SKU: {row.original.sku}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Danh mục",
        cell: ({ row }) => <span className="text-sm">{row.original.category}</span>,
      },
      {
        accessorKey: "stock",
        header: "Tồn kho thực tế",
        cell: ({ row }) => (
          <StockEditCell item={row.original} onSave={handleSaveStock} />
        ),
      },
      {
        accessorKey: "threshold",
        header: "Định mức tối thiểu",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.threshold}</span>,
      },
      {
        accessorKey: "price",
        header: "Giá nhập",
        cell: ({ row }) => <span className="text-sm">{formatPrice(row.original.price)}</span>,
      },
      {
        accessorKey: "status",
        header: "Cảnh báo",
        cell: ({ row }) => {
          const statusMap: Record<string, StatusType> = {
            in_stock: "active",
            low_stock: "pending",
            out_of_stock: "error",
          };
          return <StatusBadge status={statusMap[row.original.status] || "default"} />;
        },
      },
    ],
    [handleSaveStock]
  );

  const { data: res } = useInventory();
  const inventory = res?.data || [];

  const outOfStock = inventory.filter((i) => i.status === "out_of_stock").length;
  const lowStock = inventory.filter((i) => i.status === "low_stock").length;
  const totalValue = inventory.reduce((sum, i) => sum + i.stock * i.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Quản lý Kho</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi lượng tồn kho, cảnh báo sắp hết hàng. Click vào số lượng để sửa nhanh.
          </p>
        </div>
      </div>

      {/* Cảnh báo tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-destructive/10 text-destructive border-destructive/20">
          <p className="font-medium text-sm">Hết hàng (Out of stock)</p>
          <p className="text-3xl font-bold mt-1">{outOfStock}</p>
          <p className="text-xs mt-1 opacity-70">sản phẩm</p>
        </div>
        <div className="p-4 rounded-xl border bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20">
          <p className="font-medium text-sm">Sắp hết (Low stock)</p>
          <p className="text-3xl font-bold mt-1">{lowStock}</p>
          <p className="text-xs mt-1 opacity-70">sản phẩm</p>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <p className="font-medium text-sm text-muted-foreground">Tổng giá trị kho</p>
          <p className="text-3xl font-bold mt-1 text-primary">{formatPrice(totalValue)}</p>
          <p className="text-xs mt-1 text-muted-foreground">{inventory.length} sản phẩm</p>
        </div>
      </div>

      <DataTable columns={columns} data={inventory} pageCount={res?.meta?.totalPages || 1} />
    </div>
  );
}
