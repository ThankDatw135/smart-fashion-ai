"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateUser, useUserById } from "@/hooks/useUsers";

const userSchema = z.object({
  fullName: z.string().min(2, "Tên hiển thị tối thiểu 2 ký tự"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "USER"]),
  status: z.enum(["ACTIVE", "BANNED"]),
  isVIP: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AdminEditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { mutateAsync: updateUser, isPending } = useUpdateUser();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { fullName: "", phone: "", role: "USER", status: "ACTIVE", isVIP: false },
  });

  const { data: userRes, isLoading } = useUserById(userId);
  const user = userRes?.data;

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        phone: user.phone || "",
        role: user.role === "admin" || user.role === "super_admin" ? "ADMIN" : "USER",
        status: user.status === "ACTIVE" ? "ACTIVE" : "BANNED",
        isVIP: user.isVIP || false,
      });
    }
  }, [user, reset]);

  if (isLoading) {
    return <div className="py-24 text-center">Đang tải dữ liệu...</div>;
  }

  const onSubmit = async (data: UserFormValues) => {
    try {
      await updateUser({ id: userId, data });
      toast.success("Cập nhật thông tin người dùng thành công!");
      router.push("/admin/users");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" asChild>
          <Link href="/admin/users">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Hồ Sơ Người Dùng</h1>
          <p className="text-muted-foreground mt-1">Phân quyền và quản lý trạng thái tài khoản</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-6">
        <h3 className="font-semibold text-lg border-b pb-3">Thông tin cá nhân</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Họ & Tên *</label>
            <Input {...register("fullName")} placeholder="Nhập họ tên" />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Số điện thoại</label>
            <Input {...register("phone")} placeholder="09xxxx" />
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm space-y-6 flex flex-col gap-4">
        <h3 className="font-semibold text-lg border-b pb-3">Cài đặt Quyền & Trạng thái</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vai trò (Role)</label>
            <select {...register("role")} className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm">
              <option value="USER">Thành viên thường (User)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Trạng thái tài khoản</label>
            <select {...register("status")} className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm">
              <option value="ACTIVE">⚡ Hoạt động (Active)</option>
              <option value="BANNED">🚫 Khóa (Banned)</option>
            </select>
          </div>
        </div>

        <label className="flex items-center space-x-3 cursor-pointer p-4 bg-muted/30 rounded-lg border">
          <input type="checkbox" {...register("isVIP")} className="w-5 h-5 rounded border-gray-300 text-primary" />
          <div>
            <p className="text-sm font-bold text-primary">Tài khoản VIP 👑</p>
            <p className="text-xs text-muted-foreground">Kích hoạt đặc quyền giảm giá / Freeship vô hạn cho khách hàng này.</p>
          </div>
        </label>

        <div className="flex gap-4 pt-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Đang xử lý..." : "Cập nhật dữ liệu"}
          </Button>
          <Button type="button" variant="outline" className="w-full text-muted-foreground" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    </form>
  );
}
