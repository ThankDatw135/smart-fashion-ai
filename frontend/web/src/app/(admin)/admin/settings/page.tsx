"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Save, Store, Truck, CreditCard, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

const TABS = [
  { id: "general", label: "Thông tin chung", icon: Store },
  { id: "shipping", label: "Vận chuyển", icon: Truck },
  { id: "payment", label: "Thanh toán", icon: CreditCard },
  { id: "notifications", label: "Thông báo", icon: Bell },
];

// ---- General Settings ----
function GeneralTab() {
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      shopName: "Smart Fashion AI",
      email: "contact@smartfashion.vn",
      phone: "1900 1234",
      address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
      description: "Thời trang thông minh, phong cách cá nhân.",
      taxCode: "",
      website: "https://smartfashion.vn",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put("/admin/settings/general", data).then((r) => r.data),
    onSuccess: () => toast.success("Đã lưu cài đặt chung!"),
    onError: () => toast.error("Không thể lưu. Vui lòng thử lại."),
  });

  return (
    <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Tên Cửa Hàng *</label>
          <Input {...register("shopName")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email liên hệ</label>
          <Input {...register("email")} type="email" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Số điện thoại Hotline</label>
          <Input {...register("phone")} />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Địa chỉ trụ sở</label>
          <Input {...register("address")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Website</label>
          <Input {...register("website")} type="url" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Mã số thuế</label>
          <Input {...register("taxCode")} placeholder="0123456789" />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Mô tả cửa hàng (SEO)</label>
          <Textarea {...register("description")} className="min-h-[80px]" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cài đặt
        </Button>
      </div>
    </form>
  );
}

// ---- Shipping Settings ----
function ShippingTab() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      intraCityFee: 25000,
      suburbanFee: 35000,
      remoteFee: 50000,
      freeShipThreshold: 500000,
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put("/admin/settings/shipping", data).then((r) => r.data),
    onSuccess: () => toast.success("Đã lưu cấu hình vận chuyển!"),
    onError: () => toast.error("Không thể lưu. Vui lòng thử lại."),
  });

  return (
    <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Phí ship Nội thành (VNĐ)</label>
          <Input {...register("intraCityFee")} type="number" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phí ship Ngoại thành (VNĐ)</label>
          <Input {...register("suburbanFee")} type="number" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Phí ship Vùng xa (VNĐ)</label>
          <Input {...register("remoteFee")} type="number" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ngưỡng Freeship (VNĐ)</label>
          <Input {...register("freeShipThreshold")} type="number" />
          <p className="text-xs text-muted-foreground">Đơn hàng đạt ngưỡng này sẽ được miễn phí vận chuyển.</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cài đặt
        </Button>
      </div>
    </form>
  );
}

// ---- Payment Settings ----
function PaymentTab() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      bankName: "Vietcombank",
      accountNumber: "0123456789",
      accountHolder: "NGUYEN VAN A",
      qrImageUrl: "",
      enableCOD: true,
      enableBankTransfer: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put("/admin/settings/payment", data).then((r) => r.data),
    onSuccess: () => toast.success("Đã lưu cài đặt thanh toán!"),
    onError: () => toast.error("Không thể lưu. Vui lòng thử lại."),
  });

  return (
    <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Ngân hàng</label>
          <Input {...register("bankName")} placeholder="Vietcombank" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Số tài khoản</label>
          <Input {...register("accountNumber")} className="font-mono" />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">Tên chủ tài khoản</label>
          <Input {...register("accountHolder")} className="uppercase" />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium">URL Mã QR thanh toán</label>
          <Input {...register("qrImageUrl")} placeholder="https:// (Admin upload ảnh riêng)" />
        </div>
        <div className="space-y-3 col-span-2">
          <label className="text-sm font-medium">Phương thức thanh toán</label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("enableCOD")} className="w-4 h-4 rounded" />
            <span className="text-sm">Thanh toán khi nhận hàng (COD)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("enableBankTransfer")} className="w-4 h-4 rounded" />
            <span className="text-sm">Chuyển khoản ngân hàng</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cài đặt
        </Button>
      </div>
    </form>
  );
}

// ---- Notification Settings ----
function NotificationsTab() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      emailNewOrder: true,
      emailLowStock: true,
      emailNewReview: false,
      emailNewReturn: true,
      smtpHost: "",
      smtpPort: "587",
      smtpUser: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put("/admin/settings/notifications", data).then((r) => r.data),
    onSuccess: () => toast.success("Đã lưu cài đặt thông báo!"),
    onError: () => toast.error("Không thể lưu. Vui lòng thử lại."),
  });

  return (
    <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Gửi email khi</label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register("emailNewOrder")} className="w-4 h-4 rounded" />
          <span className="text-sm">Có đơn hàng mới</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register("emailLowStock")} className="w-4 h-4 rounded" />
          <span className="text-sm">Kho sắp hết hàng (Low stock)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register("emailNewReview")} className="w-4 h-4 rounded" />
          <span className="text-sm">Có đánh giá mới chờ duyệt</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register("emailNewReturn")} className="w-4 h-4 rounded" />
          <span className="text-sm">Có yêu cầu đổi/trả hàng</span>
        </label>
      </div>
      <hr className="my-4 border-border" />
      <div className="space-y-3">
        <label className="text-sm font-medium">Cài đặt SMTP (tùy chọn)</label>
        <div className="grid grid-cols-2 gap-3">
          <Input {...register("smtpHost")} placeholder="smtp.gmail.com" />
          <Input {...register("smtpPort")} placeholder="587" />
        </div>
        <Input {...register("smtpUser")} placeholder="noreply@smartfashion.vn" type="email" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu cài đặt
        </Button>
      </div>
    </form>
  );
}

// ---- Main Page ----
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const renderTab = () => {
    switch (activeTab) {
      case "general": return <GeneralTab />;
      case "shipping": return <ShippingTab />;
      case "payment": return <PaymentTab />;
      case "notifications": return <NotificationsTab />;
      default: return <GeneralTab />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Cài đặt Cửa hàng</h1>
        <p className="text-muted-foreground mt-1">
          Thiết lập thông tin cơ bản, vận chuyển, thanh toán và thông báo.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-max">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-6 rounded-3xl border bg-card shadow-sm">
        {renderTab()}
      </div>
    </div>
  );
}
