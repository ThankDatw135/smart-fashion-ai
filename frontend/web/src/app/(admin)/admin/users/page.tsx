"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Mail } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "super_admin" | "admin" | "customer";
  status: "active" | "inactive" | "banned";
  createdAt: Date;
  ordersCount: number;
};

// Mock data
const MOCK_USERS: AdminUser[] = [
  {
    id: "USR-001",
    name: "Admin System",
    email: "admin@smartfashion.vn",
    phone: "0912345678",
    role: "super_admin",
    status: "active",
    createdAt: new Date("2024-01-01"),
    ordersCount: 0,
  },
  {
    id: "USR-002",
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0901112223",
    role: "customer",
    status: "active",
    createdAt: new Date("2025-05-15"),
    ordersCount: 12,
  },
  {
    id: "USR-003",
    name: "Trần Thị B",
    email: "tranthib@example.com",
    phone: "0345556667",
    role: "customer",
    status: "inactive",
    createdAt: new Date("2026-02-10"),
    ordersCount: 1,
  },
  {
    id: "USR-004",
    name: "Lê C",
    email: "lec_spam@example.com",
    phone: "0999888777",
    role: "customer",
    status: "banned",
    createdAt: new Date("2026-03-20"),
    ordersCount: 0,
  },
];

export default function AdminUsersPage() {
  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Người dùng",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
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
            row.original.role === "super_admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
            row.original.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
            "bg-muted text-muted-foreground"
          }`}>
            {row.original.role === "super_admin" ? "Super Admin" : 
             row.original.role === "admin" ? "Admin" : "Khách hàng"}
          </span>
        ),
      },
      {
        accessorKey: "ordersCount",
        header: "Đơn hàng",
        cell: ({ row }) => <span>{row.original.ordersCount}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "inactive") badgeStatus = "pending";
          if (row.original.status === "banned") badgeStatus = "error";
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tham gia",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{format(row.original.createdAt, "dd/MM/yyyy")}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/users/new?id=${row.original.id}`}>
                <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" disabled={row.original.role === "super_admin"}>
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

      <DataTable columns={columns} data={MOCK_USERS} />
    </div>
  );
}
