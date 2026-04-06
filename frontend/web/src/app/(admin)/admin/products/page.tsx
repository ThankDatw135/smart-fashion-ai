"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import Image from "next/image";

type AdminProduct = Product;

export default function AdminProductsPage() {
  const columns = useMemo<ColumnDef<AdminProduct>[]>(
    () => [
      {
        accessorKey: "image",
        header: "Sản phẩm",
        cell: ({ row }) => (
          <div className="flex items-center gap-3" suppressHydrationWarning>
            <div className="relative w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden" suppressHydrationWarning>
              <Image 
                src={row.original.images[0] || "/placeholder.jpg"} 
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
          const stock = row.original.variants?.reduce((s, v) => s + v.stock, 0) || 0;
          return <span>{stock}</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const stock = row.original.variants?.reduce((s, v) => s + v.stock, 0) || 0;
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
            <Button variant="ghost" size="icon">
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
      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Sản phẩm</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý kho sản phẩm của cửa hàng.
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
