import { CheckCircle2, ChevronRight, Package, Truck, Inbox, XCircle, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface OrderEvent {
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  date: Date;
  description: string;
}

interface OrderTimelineProps {
  status: OrderEvent["status"];
  events: OrderEvent[];
}

export function OrderTimeline({ status, events }: OrderTimelineProps) {
  const steps = [
    { key: "pending", label: "Chờ xác nhận", icon: Inbox },
    { key: "processing", label: "Đang xử lý", icon: Package },
    { key: "shipped", label: "Đang giao hàng", icon: Truck },
    { key: "delivered", label: "Giao thành công", icon: CheckCircle2 },
  ];

  // For cancelled or returned layout
  if (status === "cancelled" || status === "returned") {
    const isCancelled = status === "cancelled";
    return (
      <div className={clsx("p-6 rounded-2xl border", isCancelled ? "bg-destructive/10 border-destructive/20" : "bg-orange-50 border-orange-200")}>
        <div className="flex items-center gap-3">
          {isCancelled ? <XCircle className="w-6 h-6 text-destructive" /> : <AlertCircle className="w-6 h-6 text-orange-500" />}
          <h3 className={clsx("font-semibold text-lg", isCancelled ? "text-destructive" : "text-orange-700")}>
            Đơn hàng đã bị {isCancelled ? "hủy" : "trả về"}
          </h3>
        </div>
        <div className="mt-4 space-y-3">
          {events.map((e, index) => (
            <div key={index} className="flex gap-4 text-sm">
              <span className="text-muted-foreground w-32 shrink-0">{format(e.date, "HH:mm dd/MM/yyyy", { locale: vi })}</span>
              <span>{e.description}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate current step index
  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="py-6">
      <div className="relative flex justify-between">
        {/* Background Line */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-muted -z-10 rounded-full" />
        
        {/* Active Line */}
        <div 
          className="absolute top-5 left-8 h-1 bg-primary -z-10 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 4rem)` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center gap-3 w-1/4">
              <div 
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-colors duration-300",
                  isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/20"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={clsx(
                "text-xs md:text-sm font-medium text-center",
                isCompleted ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-10 bg-muted/40 rounded-xl p-5 border shadow-inner">
        <h4 className="font-semibold mb-4 border-b pb-2">Lịch sử cập nhật</h4>
        <div className="space-y-4">
          {events.map((e, index) => (
            <div key={index} className="flex gap-4 text-sm relative">
              {index !== events.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-border" />
              )}
              <div className="w-[24px] h-[24px] rounded-full bg-background border-2 border-primary flex items-center justify-center shrink-0 z-10">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="flex-1 pb-1">
                <span className="font-medium text-foreground">{e.description}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(e.date, "HH:mm - dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
