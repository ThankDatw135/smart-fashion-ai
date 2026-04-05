import { Metadata } from "next";
import { Crown, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Đặc quyền thành viên VIP | Antigravity Store",
};

export default function VipPage() {
  const currentLevel = "Silver";
  const points = 2450;
  const nextLevel = "Gold";
  const requiredPoints = 5000;
  const progressPercent = (points / requiredPoints) * 100;

  const benefits = [
    { title: "Miễn phí vận chuyển VIP", status: "active" },
    { title: "Giảm 5% cho mọi đơn hàng", status: "active" },
    { title: "Quà tặng Sinh nhật (Voucher săn độc quyền)", status: "active" },
    { title: "Ưu tiên hỗ trợ CSKH trong 5 phút", status: "inactive" },
    { title: "Giảm 10% tại cửa hàng Offline", status: "inactive" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Chương trình Thành viên VIP</h1>
        <p className="text-sm text-muted-foreground">Khám phá các phần thưởng và đặc quyền tại Antigravity Store.</p>
      </div>

      <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden isolate">
        <Sparkles className="absolute top-10 right-10 text-white/10 w-32 h-32 -z-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 -z-10" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-100/10 border-2 border-slate-700 backdrop-blur flex justify-center items-center">
            <Crown className="w-8 h-8 text-slate-200" />
          </div>
          <div>
            <p className="text-slate-400 font-medium">Hạng thẻ hiện tại</p>
            <h2 className="text-3xl font-heading font-bold tracking-wider">{currentLevel}</h2>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span>{points} Điểm</span>
            <span>{requiredPoints} Điểm ({nextLevel})</span>
          </div>
          <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-slate-300 mt-4">Mua sắm thêm <strong className="text-white">{(requiredPoints - points) * 1000}đ</strong> để thăng hạng <strong>{nextLevel}</strong></p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Đặc quyền hạng {currentLevel} của bạn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((bene, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border flex items-center gap-3 ${bene.status === "active" ? "bg-background" : "bg-muted/30 opacity-60 grayscale"}`}
            >
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${bene.status === "active" ? "text-emerald-500" : "text-muted-foreground"}`} />
              <span className="font-medium text-sm">{bene.title}</span>
            </div>
          ))}
        </div>
        <Button variant="link" className="px-0 pt-4 font-semibold text-primary">Xem chi tiết chính sách đổi điểm <ChevronRight className="w-4 h-4 ml-1" /></Button>
      </div>

    </div>
  );
}
