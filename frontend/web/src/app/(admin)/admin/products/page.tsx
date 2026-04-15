"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import Image from "next/image";
import { toast } from "sonner";

// AlertDialog đơn giản dùng inline (tránh import nếu chưa có shadcn AlertDialog)
function ConfirmDeleteDialog({
  open,
  productName,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold font-heading">Xác nhận xóa sản phẩm</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bạn có chắc muốn ẩn sản phẩm{" "}
              <span className="font-semibold text-foreground">&ldquo;{productName}&rdquo;</span>?
              <br />
              Thao tác này sẽ ẩn sản phẩm khỏi cửa hàng (có thể khôi phục sau).
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Hủy bỏ
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xóa...
              </>
            ) : (
              "Xác nhận xóa"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

type AdminProduct = Product;

export default function AdminProductsPage() {
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const { mutateAsync: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      toast.success(`Đã ẩn sản phẩm "${deleteTarget.name}"`);
    } catch {
      toast.error("Không thể xóa sản phẩm. Vui lòng thử lại.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = useMemo<ColumnDef<AdminProduct>[]>(
    () => [
      {
        accessorKey: "image",
        header: "Sản phẩm",
        cell: ({ row }) => (
          <div className="flex items-center gap-3" suppressHydrationWarning>
            <div className="relative w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden" suppressHydrationWarning>
              <Image
                src={row.original.images?.[0] || "/placeholder.jpg"}
                alt={row.original.name}
                fill
                sizes="48px"
                className="object-cover rounded-md"
              />
            </div>
            <div suppressHydrationWarning>
              <p className="font-medium max-w-[200px] truncate">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">SKU: {row.original.sku}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Danh mục",
        cell: ({ row }) => <span className="capitalize">{row.original.categoryId}</span>,
      },
      {
        accessorKey: "price",
        header: "Giá bán",
        cell: ({ row }) => <span className="font-medium">{formatPrice(row.original.price)}</span>,
      },
      {
        accessorKey: "inventory",
        header: "Tồn kho",
        cell: ({ row }) => {
          const stock = row.original.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) || 0;
          return (
            <span className={stock === 0 ? "text-destructive font-medium" : stock < 5 ? "text-amber-500 font-medium" : ""}>
              {stock}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const stock = row.original.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) || 0;
          const status = stock > 0 ? "active" : "out_of_stock";
          return <StatusBadge status={status} />;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2" suppressHydrationWarning>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/products/${row.original.id}/edit`}>
                <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="w-4 h-4 text-destructive opacity-75 hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const { data: res } = useProducts();
  const products = res?.data || [];

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        productName={deleteTarget?.name || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isPending={isDeleting}
      />

      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Sản phẩm</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý kho sản phẩm của cửa hàng ({products.length} sản phẩm).
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" /> Thêm sản phẩm
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={products} pageCount={res?.meta?.totalPages || 1} />
    </div>
  );
}
