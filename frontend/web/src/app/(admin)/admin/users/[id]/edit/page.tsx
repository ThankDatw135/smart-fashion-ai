"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { UsersAPI } from "@/services/users.api";
import { AdminOrdersAPI } from "@/services/orders.api";
import { User } from "@/types/user";
import { useState } from "react";

function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  variant,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>Hủy</Button>
          <Button variant={variant || "default"} size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [confirm, setConfirm] = useState<{
    type: "ban" | "unban" | "makeAdmin" | "removeAdmin" | null;
  }>({ type: null });

  const { data: userData, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => UsersAPI.getUserById(userId),
    enabled: !!userId,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["admin", "orders", "user", userId],
    queryFn: () => AdminOrdersAPI.getOrders({ userId, limit: 10 } as any),
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<User>) => UsersAPI.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setConfirm({ type: null });
    },
    onError: () => toast.error("Có lỗi xảy ra, vui lòng thử lại."),
  });

  const handleConfirmAction = async () => {
    const { type } = confirm;
    if (type === "ban") {
      await updateMutation.mutateAsync({ status: "BANNED" });
      toast.success("Đã khóa tài khoản người dùng.");
    } else if (type === "unban") {
      await updateMutation.mutateAsync({ status: "ACTIVE" });
      toast.success("Đã mở khóa tài khoản người dùng.");
    } else if (type === "makeAdmin") {
      await updateMutation.mutateAsync({ role: "admin" });
      toast.success("Đã cấp quyền Admin.");
    } else if (type === "removeAdmin") {
      await updateMutation.mutateAsync({ role: "user" });
      toast.success("Đã thu hồi quyền Admin.");
    }
  };

  const user = userData?.data;
  const orders = ordersData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải thông tin...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive font-medium">Không tìm thấy người dùng.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/users"><ChevronLeft className="w-4 h-4 mr-2" /> Quay lại</Link>
        </Button>
      </div>
    );
  }

  const statusMap: Record<string, StatusType> = {
    ACTIVE: "active",
    INACTIVE: "pending",
    BANNED: "error",
  };

  const CONFIRM_CONFIG = {
    ban: {
      title: "Khóa tài khoản?",
      description: `Người dùng "${user.fullName}" sẽ không thể đăng nhập nữa.`,
      confirmLabel: "Khóa tài khoản",
      variant: "destructive" as const,
    },
    unban: {
      title: "Mở khóa tài khoản?",
      description: `Người dùng "${user.fullName}" sẽ có thể đăng nhập lại.`,
      confirmLabel: "Mở khóa",
      variant: "default" as const,
    },
    makeAdmin: {
      title: "Cấp quyền Admin?",
      description: `"${user.fullName}" sẽ có toàn quyền quản trị hệ thống.`,
      confirmLabel: "Cấp quyền",
      variant: "default" as const,
    },
    removeAdmin: {
      title: "Thu hồi quyền Admin?",
      description: `"${user.fullName}" sẽ trở thành khách hàng thông thường.`,
      confirmLabel: "Thu hồi",
      variant: "destructive" as const,
    },
  };

  const currentConfirm = confirm.type ? CONFIRM_CONFIG[confirm.type] : null;

  return (
    <div className="space-y-6">
      {confirm.type && currentConfirm && (
        <ConfirmActionDialog
          open={true}
          title={currentConfirm.title}
          description={currentConfirm.description}
          confirmLabel={currentConfirm.confirmLabel}
          variant={currentConfirm.variant}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirm({ type: null })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/users"><ChevronLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-heading font-bold tracking-tight">{user.fullName}</h1>
            <StatusBadge status={statusMap[user.status] || "default"} />
            {user.role === "admin" && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-semibold">
                <Crown className="w-3 h-3" /> Admin
              </span>
            )}
            {user.isVIP && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold">
                <Crown className="w-3 h-3" /> VIP
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">ID: <span className="font-mono">{user.id}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin cá nhân */}
          <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
            <h3 className="font-semibold text-lg">Thông tin tài khoản</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{user.phone || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  Tham gia:{" "}
                  {user.createdAt
                    ? format(new Date(user.createdAt), "dd/MM/yyyy", { locale: vi })
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Tổng đơn: {orders.length}</span>
              </div>
            </div>
          </div>

          {/* Lịch sử đơn hàng */}
          <div className="p-6 rounded-3xl border bg-card shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Lịch sử đơn hàng gần đây</h3>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Chưa có đơn hàng nào.</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 10).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                  >
                    <div>
                      <p className="font-medium font-mono text-primary">
                        #{order.orderNumber || order.id?.slice(0, 12)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.createdAt
                          ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total || 0)}</p>
                      <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="space-y-5">
          {/* Thao tác */}
          <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-3">
            <h3 className="font-semibold mb-2">Thao tác quản trị</h3>

            {/* Ban / Unban */}
            {user.status === "BANNED" ? (
              <Button
                variant="outline"
                className="w-full gap-2 text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                onClick={() => setConfirm({ type: "unban" })}
                disabled={updateMutation.isPending}
              >
                <UserCheck className="w-4 h-4" /> Mở khóa tài khoản
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive border-destructive hover:bg-destructive/5"
                onClick={() => setConfirm({ type: "ban" })}
                disabled={user.role === "admin" || updateMutation.isPending}
              >
                <UserX className="w-4 h-4" /> Khóa tài khoản
              </Button>
            )}

            {/* Admin role */}
            {user.role !== "admin" ? (
              <Button
                variant="outline"
                className="w-full gap-2 text-purple-600 border-purple-600 hover:bg-purple-50"
                onClick={() => setConfirm({ type: "makeAdmin" })}
                disabled={updateMutation.isPending}
              >
                <Shield className="w-4 h-4" /> Cấp quyền Admin
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 text-amber-600 border-amber-600 hover:bg-amber-50"
                onClick={() => setConfirm({ type: "removeAdmin" })}
                disabled={updateMutation.isPending}
              >
                <ShieldOff className="w-4 h-4" /> Thu hồi quyền Admin
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center pt-1">
              * Không thể khóa tài khoản Admin
            </p>
          </div>

          {/* Thống kê nhanh */}
          <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-3">
            <h3 className="font-semibold mb-2">Tổng quan</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng đơn hàng</span>
                <span className="font-semibold">{orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng chi tiêu</span>
                <span className="font-semibold text-primary">
                  {formatPrice(orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái VIP</span>
                <span className={`font-medium ${user.isVIP ? "text-amber-500" : "text-muted-foreground"}`}>
                  {user.isVIP ? "VIP Member" : "Thông thường"}
                </span>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => router.back()}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    </div>
  );
}
