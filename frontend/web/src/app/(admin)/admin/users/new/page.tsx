"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminNewUserPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/users">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Thông tin Người dùng</h1>
          <p className="text-muted-foreground mt-1">
            Thêm mới hoặc chỉnh sửa tài khoản người dùng, phân quyền truy cập.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin hồ sơ */}
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Hồ sơ cá nhân</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ & Tên *</label>
                <Input placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input placeholder="0901234567" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Email *</label>
                <Input placeholder="email@example.com" type="email" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Mật khẩu</label>
                <Input placeholder="••••••••" type="password" />
                <p className="text-xs text-muted-foreground">Bỏ trống nếu không muốn thay đổi (khi sửa tài khoản).</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Phân quyền */}
          <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Thiết lập tài khoản</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phân quyền Hệ thống</label>
              <select className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground">
                <option value="customer">Khách hàng (Customer)</option>
                <option value="admin">Quản trị viên (Admin)</option>
                <option value="super_admin">Quản lý cấp cao (Super Admin)</option>
              </select>
            </div>
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground">
                <option value="active">Hoạt động (Active)</option>
                <option value="inactive">Chưa kích hoạt (Inactive)</option>
                <option value="banned">Khóa tài khoản (Banned)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button className="w-full shadow-lg shadow-primary/30">Lưu Thông Tin</Button>
            <Button variant="outline" className="w-full text-muted-foreground" asChild>
              <Link href="/admin/users">Hủy bỏ</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
