"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, LayoutTemplate } from "lucide-react";

type BannerConfig = {
  id: string;
  name: string;
  position: "homepage_hero" | "category_top" | "popup";
  status: "active" | "inactive";
  priority: number;
};

// Mock data
const MOCK_BANNERS: BannerConfig[] = [
  {
    id: "BAN-001",
    name: "Summer Sale 2026 - Hero Banner",
    position: "homepage_hero",
    status: "active",
    priority: 1,
  },
  {
    id: "BAN-002",
    name: "Banner New Arrival",
    position: "homepage_hero",
    status: "active",
    priority: 2,
  },
  {
    id: "BAN-003",
    name: "Black Friday Popup",
    position: "popup",
    status: "inactive",
    priority: 1,
  },
];

export default function AdminBannersPage() {
  const columns = useMemo<ColumnDef<BannerConfig>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên Banner/Chiến dịch",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <span className="font-semibold">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "position",
        header: "Vị trí",
        cell: ({ row }) => (
           <span className="text-sm">
             {row.original.position === "homepage_hero" && "Trang Chủ - Hero"}
             {row.original.position === "category_top" && "Danh Mục - Top"}
             {row.original.position === "popup" && "Popup Toàn Trang"}
           </span>
        )
      },
      {
        accessorKey: "priority",
        header: "Thứ tự sắp xếp",
        cell: ({ row }) => <span className="font-medium text-center block w-full">{row.original.priority}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "inactive") badgeStatus = "error";
          return <StatusBadge status={badgeStatus} />;
        },
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
          <h1 className="text-3xl font-heading font-bold tracking-tight">Bảng Biển & Landing Page</h1>
          <p className="text-muted-foreground mt-1">
             Quản lý Banner quảng cáo, Popup, và Carousel hình ảnh.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Tạo Banner
        </Button>
      </div>

      <DataTable columns={columns} data={MOCK_BANNERS} />
    </div>
  );
}
