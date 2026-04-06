"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Newspaper } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { BlogPost } from "@/types/blog";
import { useBlogPosts } from "@/hooks/useBlog";

export default function AdminBlogPage() {
  const columns = useMemo<ColumnDef<BlogPost>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Bài Viết",
        cell: ({ row }) => (
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
               <span className="font-semibold text-sm hover:text-primary cursor-pointer transition-colors max-w-[250px] line-clamp-2" title={row.original.title}>
                 {row.original.title}
               </span>
               <p className="text-xs text-muted-foreground line-clamp-1">/{row.original.slug}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Chuyên mục",
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.category?.name || "Chưa phân loại"}</span>,
      },
      {
        accessorKey: "author",
        header: "Tác giả",
        cell: ({ row }) => <span className="text-sm">{row.original.author?.name || "Unknown"}</span>,
      },
      {
        accessorKey: "viewCount",
        header: "Lượt xem",
        cell: ({ row }) => <span className="text-sm">{(row.original.viewCount || 0).toLocaleString()}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const badgeStatus: StatusType = "active";
          // Mặc định tạm thời do schema blog chưa có status.
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        accessorKey: "publishedAt",
        header: "Ngày đăng",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{format(new Date(row.original.publishedAt || Date.now()), "dd/MM/yyyy")}</span>,
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

  const { data: res } = useBlogPosts();
  const posts = res?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Bài Viết & CMS</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý nội dung Blog, SEO, Tin Tức Bán Hàng.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Viết bài mới
        </Button>
      </div>

      <DataTable columns={columns} data={posts} pageCount={res?.meta?.totalPages || 1} />
    </div>
  );
}
