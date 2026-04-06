"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Mail, Loader2, UsersIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { UsersAPI } from "@/services/users.api";
import { User } from "@/types/user";



export default function AdminUsersPage() {
  const { data, isLoading, error } = useQuery({
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
            <p className="font-medium">{row.original.fullName}</p>
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
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            row.original.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
            "bg-muted text-muted-foreground"
          }`}>
            {row.original.role === "admin" ? "Admin" : "Khách hàng"}
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
            {row.original.createdAt ? format(new Date(row.original.createdAt), "dd/MM/yyyy") : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/users/${row.original.id}/edit`}>
                <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" disabled={row.original.role === "admin"}>
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
          <h1 className="text-3xl font-heading font-bold tracking-tight">Khách hàng & Phân quyền</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tài khoản người dùng, phân quyền hệ thống.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="w-4 h-4 mr-2" /> Thêm người dùng
          </Link>
        </Button>
      </div>

      <DataTable columns={columns} data={users} />
    </div>
  );
}
