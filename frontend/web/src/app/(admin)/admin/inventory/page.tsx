"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ExternalLink, PackageSearch } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  threshold: number;
  price: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
};

// Mock data
const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "PROD-001",
    name: "Áo Thun Cổ Tròn Basic",
    sku: "TSHIRT-001",
    category: "Thời trang nam",
    stock: 250,
    threshold: 50,
    price: 150000,
    status: "in_stock",
  },
  {
    id: "PROD-002",
    name: "Quần Jeans Slimfit",
    sku: "JEANS-002",
    category: "Thời trang nam",
    stock: 12,
    threshold: 20,
    price: 450000,
    status: "low_stock",
  },
  {
    id: "PROD-003",
    name: "Váy Hoa Mùa Hè",
    sku: "DRESS-003",
    category: "Thời trang nữ",
    stock: 0,
    threshold: 15,
    price: 350000,
    status: "out_of_stock",
  },
  {
    id: "PROD-004",
    name: "Túi Xách Da Mini",
    sku: "BAG-004",
    category: "Phụ kiện",
    stock: 85,
    threshold: 10,
    price: 850000,
    status: "in_stock",
  },
];

export default function AdminInventoryPage() {
  const columns = useMemo<ColumnDef<InventoryItem>[]>(
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
              <p className="text-xs text-muted-foreground">SKU: {row.original.sku}</p>
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
          <span className={`font-semibold text-lg ${
            row.original.status === "out_of_stock" ? "text-destructive" :
            row.original.status === "low_stock" ? "text-amber-500" : "text-foreground"
          }`}>
            {row.original.stock}
          </span>
        ),
      },
      {
        accessorKey: "threshold",
        header: "Định mức tối thiểu",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.threshold}</span>,
      },
      {
        accessorKey: "status",
        header: "Cảnh báo",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "low_stock") badgeStatus = "pending";
          if (row.original.status === "out_of_stock") badgeStatus = "error";
          
          return (
            <StatusBadge 
              status={badgeStatus} 
              // label override
            />
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3 h-3 mr-1.5" /> Thêm hàng
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
          <h1 className="text-3xl font-heading font-bold tracking-tight">Quản lý Kho</h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi lượng tồn kho, cảnh báo sắp hết hàng.
          </p>
        </div>
        <Button>Xuất báo cáo (Excel)</Button>
      </div>

      {/* Cảnh báo tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-4 rounded-xl border bg-destructive/10 text-destructive border-destructive/20 flex items-center justify-between">
          <div>
            <p className="font-medium">Hết hàng (Out of stock)</p>
            <p className="text-2xl font-bold mt-1">1</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="font-medium">Sắp hết (Low stock)</p>
            <p className="text-2xl font-bold mt-1">1</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <p className="font-medium text-muted-foreground">Tổng giá trị kho</p>
            <p className="text-2xl font-bold mt-1 text-primary">{formatPrice(450500000)}</p>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={MOCK_INVENTORY} />
    </div>
  );
}
