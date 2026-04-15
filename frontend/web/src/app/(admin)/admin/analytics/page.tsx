"use client";

import { useState } from "react";
import { KPICard } from "@/components/admin/KPICard";
import { formatPrice } from "@/lib/utils";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, Loader2 } from "lucide-react";
import { ChartWidgets } from "@/components/admin/ChartWidgets";
import { useQuery } from "@tanstack/react-query";
import { AdminAPI } from "@/services/admin.api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#6366f1", "#f43f5e", "#f59e0b", "#22c55e", "#3b82f6"];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<7 | 30 | 365>(30);

  const { data: dashboardData, isLoading: loadingDash } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => AdminAPI.getDashboardStats(),
  });

  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ["admin", "revenue", period],
    queryFn: () => AdminAPI.getRevenueChart(period),
  });

  const { data: topProductsData } = useQuery({
    queryKey: ["admin", "top-products"],
    queryFn: () => AdminAPI.getTopProducts(10),
  });

  const { data: orderStatusData } = useQuery({
    queryKey: ["admin", "order-status"],
    queryFn: () => AdminAPI.getOrderStatusSummary(),
  });

  const summary = dashboardData?.data?.summary || {};
  const revenueChart = revenueData?.data || [];
  const topProducts = topProductsData?.data || [];
  const orderStatus = orderStatusData?.data || {};

  const orderStatusChart = Object.entries(orderStatus).map(([key, value]) => ({
    name: { pending: "Chờ duyệt", processing: "Đang xử lý", shipped: "Đang giao", delivered: "Đã giao", cancelled: "Hủy" }[key] || key,
    value: value as number,
  }));

  if (loadingDash) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải dữ liệu phân tích...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Phân tích & Báo cáo</h1>
          <p className="text-muted-foreground mt-1">Số liệu kinh doanh tổng hợp chi tiết theo thời gian.</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value) as 7 | 30 | 365)}
          className="h-10 px-3 py-2 rounded-md border bg-background text-sm text-foreground"
        >
          <option value={7}>7 ngày qua</option>
          <option value={30}>30 ngày qua</option>
          <option value={365}>Năm nay</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Doanh thu"
          value={formatPrice(summary.revenue || 0)}
          trend={summary.revenueTrend || 0}
          icon={DollarSign}
        />
        <KPICard
          title="Đơn hàng"
          value={String(summary.orders || 0)}
          trend={summary.ordersTrend || 0}
          icon={ShoppingCart}
        />
        <KPICard
          title="Khách hàng mới"
          value={String(summary.newUsers || 0)}
          trend={summary.usersTrend || 0}
          icon={Users}
        />
        <KPICard
          title="Sản phẩm bán ra"
          value={String(summary.soldItems || 0)}
          trend={summary.soldTrend || 0}
          icon={Package}
        />
      </div>

      {/* Revenue Chart */}
      <div className="p-6 rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Biểu đồ Doanh thu
          </h3>
          {loadingRevenue && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {revenueChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueChart} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} className="text-muted-foreground" />
              <Tooltip
                formatter={(value) => [formatPrice(Number(value) || 0), "Doanh thu"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center">
            <ChartWidgets />
          </div>
        )}
      </div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top sản phẩm */}
        <div className="p-6 rounded-3xl border bg-card shadow-sm">
          <h3 className="font-semibold mb-4 text-lg">Top Sản phẩm bán chạy</h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có dữ liệu.</p>
            ) : (
              topProducts.slice(0, 8).map((product: any, i: number) => (
                <div key={product.id || i} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <span className="font-medium text-sm text-primary">{product.soldCount || product.count || 0} cái</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trạng thái đơn hàng */}
        <div className="p-6 rounded-3xl border bg-card shadow-sm">
          <h3 className="font-semibold mb-4 text-lg">Phân bổ Trạng thái Đơn hàng</h3>
          {orderStatusChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderStatusChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {orderStatusChart.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu đơn hàng.</p>
          )}
        </div>
      </div>
    </div>
  );
}
