import { Metadata } from "next";
import { Ticket, Clock, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kho Vouchers | Antigravity Store",
};

interface VoucherItem {
  id: string;
  code: string;
  title: string;
  description: string;
  type: "percent" | "fixed" | "freeship";
  status: "active" | "used" | "expired";
  expiresAt: string;
}

const mockVouchers: VoucherItem[] = [
  { id: "v1", code: "WELCOME10", title: "Giảm 10% đơn đầu", description: "Áp dụng tối đa 50K", type: "percent", status: "active", expiresAt: "2026-12-31" },
  { id: "v2", code: "FREESHIP50", title: "Miễn phí vận chuyển", description: "Áp dụng tối đa 35K, Đơn từ 300K", type: "freeship", status: "active", expiresAt: "2026-05-31" },
  { id: "v3", code: "TET2026", title: "Lì xì Tết 50K", description: "Ngày dùng: 01/02/2026", type: "fixed", status: "used", expiresAt: "2026-02-15" },
  { id: "v4", code: "FLASH88", title: "Siêu ưu đãi 8.8", description: "Hết hạn: 09/08/2025", type: "fixed", status: "expired", expiresAt: "2025-08-09" }
];

export default function VouchersPage() {
  const renderVoucherList = (status: "active" | "used" | "expired") => {
    const list = mockVouchers.filter(v => v.status === status);

    if (list.length === 0) {
      return (
        <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
          <Ticket className="w-12 h-12 mb-3" />
          <p>Không có Voucher nào ở trạng thái này.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map(voucher => (
          <div key={voucher.id} className={cn(
            "flex overflow-hidden rounded-xl border relative shadow-sm",
            status === "active" ? "bg-background" : "bg-muted/30 grayscale opacity-60"
          )}>
            <div className="w-24 bg-primary/10 border-r flex flex-col items-center justify-center p-3 text-center shrink-0 border-dashed">
              <Ticket className="w-8 h-8 text-primary mb-1" />
              <div className="w-4 h-4 rounded-full bg-background absolute -left-2 top-1/2 -translate-y-1/2 border-r" />
              <div className="w-4 h-4 rounded-full bg-background absolute left-22 top-1/2 -translate-y-1/2 border-l" />
            </div>
            <div className="flex-1 p-4">
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="font-bold text-sm bg-muted px-2 py-0.5 rounded uppercase">{voucher.code}</span>
                {status === "active" && <span className="text-xs text-primary font-medium flex items-center"><Clock className="w-3 h-3 mr-1" />Sắp hết hạn</span>}
                {status === "used" && <span className="text-xs text-emerald-600 font-medium flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" />Đã dùng</span>}
              </div>
              <h3 className="font-semibold">{voucher.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-2">{voucher.description}</p>
              
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-muted-foreground">HSD: {voucher.expiresAt}</p>
                {status === "active" && (
                  <Button size="sm" variant="secondary" className="h-7 text-xs px-3">Dùng ngay</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Kho Vouchers</h1>
        <p className="text-sm text-muted-foreground">Tất cả ưu đãi, mã giảm giá và mã miễn phí vận chuyển của bạn.</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto overflow-y-hidden bg-transparent border-b rounded-none h-12 p-0 space-x-6">
          <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 bg-transparent data-[state=active]:bg-transparent">
            Có hiệu lực (2)
          </TabsTrigger>
          <TabsTrigger value="used" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 bg-transparent data-[state=active]:bg-transparent">
            Đã sử dụng
          </TabsTrigger>
          <TabsTrigger value="expired" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 bg-transparent data-[state=active]:bg-transparent">
            Hết hiệu lực
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">{renderVoucherList("active")}</TabsContent>
        <TabsContent value="used">{renderVoucherList("used")}</TabsContent>
        <TabsContent value="expired">{renderVoucherList("expired")}</TabsContent>
      </Tabs>
    </div>
  );
}
