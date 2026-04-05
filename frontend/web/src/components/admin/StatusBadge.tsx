import { cn } from "@/lib/utils";

export type StatusType = 
  | "success" | "warning" | "destructive" | "info" | "default" 
  | "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "completed"
  | "active" | "inactive" | "out_of_stock"
  | "error" | "expired";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<StatusType, { bg: string, text: string, defaultLabel: string }> = {
  success: { bg: "bg-emerald-100", text: "text-emerald-700", defaultLabel: "Thành công" },
  warning: { bg: "bg-amber-100", text: "text-amber-700", defaultLabel: "Cảnh báo" },
  destructive: { bg: "bg-red-100", text: "text-red-700", defaultLabel: "Lỗi" },
  info: { bg: "bg-blue-100", text: "text-blue-700", defaultLabel: "Thông tin" },
  default: { bg: "bg-slate-100", text: "text-slate-700", defaultLabel: "Mặc định" },
  
  // Orders
  pending: { bg: "bg-amber-100", text: "text-amber-700", defaultLabel: "Chờ xác nhận" },
  processing: { bg: "bg-blue-100", text: "text-blue-700", defaultLabel: "Đang xử lý" },
  shipped: { bg: "bg-indigo-100", text: "text-indigo-700", defaultLabel: "Đang giao" },
  delivered: { bg: "bg-emerald-100", text: "text-emerald-700", defaultLabel: "Đã giao" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", defaultLabel: "Đã hủy" },
  completed: { bg: "bg-emerald-100", text: "text-emerald-700", defaultLabel: "Hoàn thành" },
  
  // Products
  active: { bg: "bg-emerald-100", text: "text-emerald-700", defaultLabel: "Đang bán" },
  inactive: { bg: "bg-slate-100", text: "text-slate-700", defaultLabel: "Đã ẩn" },
  out_of_stock: { bg: "bg-red-100", text: "text-red-700", defaultLabel: "Hết hàng" },

  // AI & Vouchers
  error: { bg: "bg-red-100", text: "text-red-700", defaultLabel: "Lỗi" },
  expired: { bg: "bg-slate-100", text: "text-slate-700", defaultLabel: "Hết hạn" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.default;
  
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
      config.bg,
      config.text
    )}>
      {label || config.defaultLabel}
    </span>
  );
}
