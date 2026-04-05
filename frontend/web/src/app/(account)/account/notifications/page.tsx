import { Metadata } from "next";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, ShoppingBag, Percent, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Thông báo | Antigravity Store",
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "order" | "promo" | "system";
  isRead: boolean;
  date: Date;
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "Đơn hàng đang được giao",
    message: "Đơn hàng #ORD-123456 đang trên đường đến địa chỉ giao hàng của bạn. Vui lòng giữ liên lạc.",
    type: "order",
    isRead: false,
    date: new Date()
  },
  {
    id: "n2",
    title: "Siêu ưu đãi cuối tuần",
    message: "Tặng bạn mã WEEKEND giảm ngay 15% cho mọi sản phẩm. Số lượng siêu nháp, chỉ 100 mã!",
    type: "promo",
    isRead: false,
    date: new Date(new Date().setDate(new Date().getDate() - 1))
  },
  {
    id: "n3",
    title: "Bảo mật tài khoản",
    message: "Phát hiện mã đăng nhập mới trên thiết bị Chrome - Windows. Nếu là bạn, hãy bỏ qua tin nhắn này.",
    type: "system",
    isRead: true,
    date: new Date(new Date().setDate(new Date().getDate() - 5))
  }
];

export default function NotificationsPage() {
  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "order": return <ShoppingBag className="w-5 h-5" />;
      case "promo": return <Percent className="w-5 h-5" />;
      case "system": return <ShieldAlert className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (type: Notification["type"]) => {
    switch (type) {
      case "order": return "bg-blue-100 text-blue-600";
      case "promo": return "bg-emerald-100 text-emerald-600";
      case "system": return "bg-orange-100 text-orange-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">Thông báo</h1>
          <p className="text-sm text-muted-foreground">Theo dõi và cập nhật thông tin mới nhất.</p>
        </div>
        <Button variant="ghost" className="text-sm text-primary">
          Đánh dấu đã đọc tất cả
        </Button>
      </div>

      <div className="space-y-4">
        {mockNotifications.map((noti) => (
          <div 
            key={noti.id} 
            className={cn(
              "flex gap-4 p-5 rounded-xl border transition-colors hover:bg-muted/30 cursor-pointer relative overflow-hidden",
              noti.isRead ? "bg-background border-border" : "bg-primary/5 border-primary/20 shadow-sm"
            )}
          >
            {!noti.isRead && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none transform translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl bg-primary/20" />
            )}
            
            <div className={cn("w-12 h-12 rounded-full flex justify-center items-center shrink-0 mt-1", getColor(noti.type))}>
              {getIcon(noti.type)}
            </div>

            <div className="flex-1">
              <h3 className={cn("font-semibold mb-1", !noti.isRead && "text-primary")}>
                {noti.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-snug">
                {noti.message}
              </p>
              <span className="text-xs font-medium text-muted-foreground mt-3 block">
                {format(noti.date, "HH:mm, dd 'tháng' MM yyyy", { locale: vi })}
              </span>
            </div>
            
            {!noti.isRead && (
              <div className="w-3 h-3 rounded-full bg-primary shrink-0 place-self-center mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
