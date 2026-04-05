"use client";

import { KPICard } from "@/components/admin/KPICard";
import { formatPrice } from "@/lib/utils";
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { ChartWidgets } from "@/components/admin/ChartWidgets";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Phân tích & Báo cáo</h1>
          <p className="text-muted-foreground mt-1">
            Số liệu kinh doanh tổng hợp chi tiết theo thời gian.
          </p>
        </div>
        <select className="h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground">
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="this_year">Năm nay</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Doanh thu"
          value={formatPrice(125500000)}
          trend={+15.2}
          icon={DollarSign}
        />
        <KPICard
          title="Đơn hàng"
          value="452"
          trend={+5.4}
          icon={ShoppingCart}
        />
        <KPICard
          title="Khách hàng mới"
          value="89"
          trend={-2.1}
          icon={Users}
        />
        <KPICard
          title="Sản phẩm bán ra"
          value="1,024"
          trend={+12.0}
          icon={Package}
        />
      </div>

      <ChartWidgets />
      
      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         <div className="p-6 rounded-3xl border bg-card shadow-sm">
            <h3 className="font-semibold mb-4 text-lg">Top Sản phẩm bán chạy</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                 <span className="text-sm">Áo Thun Cổ Tròn Basic</span>
                 <span className="font-medium text-sm">240 áo</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                 <span className="text-sm">Quần Jeans Slimfit Nam</span>
                 <span className="font-medium text-sm">185 quần</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                 <span className="text-sm">Đầm Mùa Hè Họa Tiết Hoa</span>
                 <span className="font-medium text-sm">150 đầm</span>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
