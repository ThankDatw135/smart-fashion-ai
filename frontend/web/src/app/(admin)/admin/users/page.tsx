"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Mail, Loader2, UsersIcon, Crown } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { UsersAPI } from "@/services/users.api";
import { User } from "@/types/user";

export default function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => UsersAPI.getUsers(),
  });

  const users = data?.data || [];

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Người dùng",
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium">{row.original.fullName}</p>
              {row.original.isVIP && <Crown className="w-3.5 h-3.5 text-amber-500" />}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" /> {row.original.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Số điện thoại",
        cell: ({ row }) => <span className="text-sm">{row.original.phone || "—"}</span>,
      },
      {
        accessorKey: "role",
        header: "Phân quyền",
        cell: ({ row }) => (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              row.original.role === "admin"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                : row.original.role === "super_admin"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {row.original.role === "super_admin"
              ? "Super Admin"
              : row.original.role === "admin"
              ? "Admin"
              : "Khách hàng"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const statusMap: Record<string, StatusType> = {
            ACTIVE: "active",
            INACTIVE: "pending",
            BANNED: "error",
          };
          return <StatusBadge status={statusMap[row.original.status] || "default"} />;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tham gia",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAt
              ? format(new Date(row.original.createdAt), "dd/MM/yyyy")
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/users/${row.original.id}/edit`}>
                <Eye className="w-4 h-4 mr-1.5" /> Chi tiết
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải danh sách...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Khách hàng & Phân quyền</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tài khoản người dùng ({users.length} tài khoản).
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UsersIcon className="w-4 h-4" />
          <span>{users.filter((u: User) => u.status === "ACTIVE").length} đang hoạt động</span>
        </div>
      </div>

      <DataTable columns={columns} data={users} />
    </div>
  );
}
