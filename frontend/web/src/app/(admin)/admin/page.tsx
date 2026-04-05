"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/admin/KPICard";
import { AreaChartWidget, BarChartWidget } from "@/components/admin/ChartWidgets";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { Currency, ShoppingCart, Users, Activity, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { AdminAPI } from "@/services/admin.api";
import { AdminOrdersAPI } from "@/services/orders.api";

// Fallback mock data khi API chưa sẵn sàng
const FALLBACK_KPI = [
  { title: "Tổng doanh thu", value: "—", icon: Currency, trend: 0 },
  { title: "Đơn hàng mới", value: "—", icon: ShoppingCart, trend: 0 },
  { title: "Khách hàng mới", value: "—", icon: Users, trend: 0 },
  { title: "Tỷ lệ chuyển đổi", value: "—", icon: Activity, trend: 0 },
];

type RecentOrder = {
  id: string;
  orderNumber?: string;
  customer?: string;
  user?: { fullName: string };
  createdAt: string;
  totalAmount: number;
  status: StatusType;
};

export default function AdminDashboard() {
  // Fetch dashboard stats from API
  const { data: dashData, isLoading: isDashLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => AdminAPI.getDashboardStats(),
  });

  // Fetch revenue chart data
  const { data: revenueData } = useQuery({
    queryKey: ["admin", "dashboard", "revenue"],
    queryFn: () => AdminAPI.getRevenueChart(7),
  });

  // Fetch recent orders
  const { data: ordersData } = useQuery({
    queryKey: ["admin", "orders", "recent"],
    queryFn: () => AdminOrdersAPI.getOrders({ limit: 5 }),
  });

  // Transform dashboard data into KPI cards
  const summary = dashData?.data?.summary;
  const kpiData = summary
    ? [
        {
          title: "Tổng doanh thu",
          value: formatPrice(summary.totalRevenue || 0),
          icon: Currency,
          trend: summary.revenueTrend || 0,
        },
        {
          title: "Đơn hàng mới",
          value: String(summary.newOrders || 0),
          icon: ShoppingCart,
          trend: summary.ordersTrend || 0,
        },
        {
          title: "Khách hàng mới",
          value: String(summary.newCustomers || 0),
          icon: Users,
          trend: summary.customersTrend || 0,
        },
        {
          title: "Tỷ lệ chuyển đổi",
          value: `${(summary.conversionRate || 0).toFixed(2)}%`,
          icon: Activity,
          trend: summary.conversionTrend || 0,
        },
      ]
    : FALLBACK_KPI;

  // Transform revenue data for chart
  const revenueChartData = revenueData?.data || [];
  const orderChartData = revenueChartData.map((d: any) => ({
    name: d.name || d.date,
    Đơn_hàng: d.orderCount || d.orders || 0,
  }));
  const revenueChartFormatted = revenueChartData.map((d: any) => ({
    name: d.name || d.date,
    Doanh_thu: d.revenue || d.amount || 0,
  }));

  // Recent orders
  const recentOrders = (ordersData?.data || []) as any[];

  const columns = useMemo<ColumnDef<RecentOrder>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Mã ĐH",
        cell: ({ row }) => (
          <span className="font-medium text-primary">
            {row.original.orderNumber || row.original.id?.slice(0, 12)}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Khách hàng",
        cell: ({ row }) => row.original.customer || row.original.user?.fullName || "—",
      },
      {
        accessorKey: "createdAt",
        header: "Ngày đặt",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.createdAt
              ? format(new Date(row.original.createdAt), "dd/MM/yyyy")
              : "—"
            }
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Tổng tiền",
        cell: ({ row }) => <span className="font-medium">{formatPrice(row.original.totalAmount || 0)}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    []
  );

  if (isDashLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Đang tải Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan tình hình kinh doanh hôm nay.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm">
          <div className="space-y-1 mb-4">
            <h3 className="font-semibold text-lg">Doanh thu theo ngày</h3>
            <p className="text-sm text-muted-foreground">Doanh thu gộp 7 ngày qua</p>
          </div>
          <AreaChartWidget 
            data={revenueChartFormatted} 
            categories={["Doanh_thu"]} 
            index="name" 
            valueFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} 
          />
        </div>
        
        <div className="p-6 rounded-3xl border bg-card text-card-foreground shadow-sm">
          <div className="space-y-1 mb-4">
            <h3 className="font-semibold text-lg">Đơn hàng theo ngày</h3>
            <p className="text-sm text-muted-foreground">Số lượng đơn hàng 7 ngày qua</p>
          </div>
          <BarChartWidget 
            data={orderChartData} 
            categories={["Đơn_hàng"]} 
            index="name" 
            colors={["#3b82f6"]}
          />
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-heading">Đơn hàng gần đây</h2>
        </div>
        <DataTable columns={columns} data={recentOrders} />
      </div>
    </div>
  );
}
