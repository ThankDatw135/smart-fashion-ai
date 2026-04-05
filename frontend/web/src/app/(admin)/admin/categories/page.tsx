"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import Link from "next/link";

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  productsCount: number;
};

// We will use the Category type from types/product instead.
import { Category } from "@/types/product";
import { useCategories } from "@/hooks/useCategories";

export default function AdminCategoriesPage() {
  const { data: categoriesResponse, isLoading } = useCategories();

  const tableData = useMemo(() => {
    const categories = categoriesResponse?.data || [];
    return categories.map((cat: Category) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent: categories.find((c: Category) => c.id === cat.parentId)?.name || null,
      productsCount: 0, // Dữ liệu này cần backend trả về hoặc tính toán
    }));
  }, [categoriesResponse?.data]);

  const columns = useMemo<ColumnDef<AdminCategory>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên Danh mục",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${row.original.parent ? "bg-muted" : "bg-primary/10 text-primary"}`}>
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "parent",
        header: "Danh mục cha",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.parent || "— (Gốc)"}</span>,
      },
      {
        accessorKey: "productsCount",
        header: "Số lượng Sản phẩm",
        cell: ({ row }) => <span className="font-medium">{row.original.productsCount}</span>,
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
          <h1 className="text-3xl font-heading font-bold tracking-tight">Danh mục Sản phẩm</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý cấu trúc cây danh mục cho cửa hàng.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Thêm Danh Mục
        </Button>
      </div>

      <DataTable columns={columns} data={tableData} />
    </div>
  );
}
