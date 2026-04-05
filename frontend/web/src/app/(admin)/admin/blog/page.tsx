"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Newspaper } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  status: "published" | "draft" | "archived";
  views: number;
  createdAt: Date;
};

// Mock data
const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: "BLOG-001",
    title: "Xu Hướng Thời Trang Mùa Hè 2026",
    slug: "xu-huong-thoi-trang-mua-he-2026",
    author: "Admin C",
    category: "Xu Hướng",
    status: "published",
    views: 1250,
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: "BLOG-002",
    title: "Bí Quyết Phối Đồ Công Sở Trẻ Trung",
    slug: "bi-quyet-phoi-do-cong-so",
    author: "Jane B",
    category: "Style Guide",
    status: "published",
    views: 890,
    createdAt: new Date(Date.now() - 86400000 * 10),
  },
  {
    id: "BLOG-003",
    title: "Top 5 Mẫu Áo Khoác Không Thể Thiếu Của Phái Mạnh",
    slug: "top-5-mau-ao-khoac-phai-manh",
    author: "Admin C",
    category: "Góc Tin Tức",
    status: "draft",
    views: 0,
    createdAt: new Date(),
  },
];

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
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.category}</span>,
      },
      {
        accessorKey: "author",
        header: "Tác giả",
        cell: ({ row }) => <span className="text-sm">{row.original.author}</span>,
      },
      {
        accessorKey: "views",
        header: "Lượt xem",
        cell: ({ row }) => <span className="text-sm">{row.original.views.toLocaleString()}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "draft") badgeStatus = "pending";
          if (row.original.status === "archived") badgeStatus = "error";
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày đăng",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{format(row.original.createdAt, "dd/MM/yyyy")}</span>,
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
          <h1 className="text-3xl font-heading font-bold tracking-tight">Bài Viết & CMS</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý nội dung Blog, SEO, Tin Tức Bán Hàng.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Viết bài mới
        </Button>
      </div>

      <DataTable columns={columns} data={MOCK_BLOG_POSTS} />
    </div>
  );
}
