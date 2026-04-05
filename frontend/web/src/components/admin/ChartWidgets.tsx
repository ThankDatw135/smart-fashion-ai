"use client";

import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart
} from "recharts";

interface ChartProps {
  data: any[];
  categories: string[]; // ['uv', 'pv']
  index: string; // 'name'
  colors?: string[];
  yAxisWidth?: number;
  valueFormatter?: (value: number) => string;
}

const defaultColors = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

export function AreaChartWidget({ 
  data, 
  categories, 
  index, 
  colors = defaultColors,
  yAxisWidth = 56,
  valueFormatter = (v) => v.toString() 
}: ChartProps) {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {categories.map((category, i) => (
              <linearGradient key={category} id={`color-${category}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey={index} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            width={yAxisWidth}
            tickFormatter={valueFormatter} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [valueFormatter(Number(value) || 0), ""]}
          />
          {categories.map((category, i) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color-${category})`}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartWidget({ 
  data, 
  categories, 
  index, 
  colors = defaultColors,
  yAxisWidth = 56,
  valueFormatter = (v) => v.toString() 
}: ChartProps) {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey={index} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            width={yAxisWidth}
            tickFormatter={valueFormatter} 
          />
          <Tooltip 
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [valueFormatter(Number(value) || 0), ""]}
          />
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const mockRevenueData = [
  { name: "Thứ 2", "Doanh thu": 12000000, "Đơn hàng": 42 },
  { name: "Thứ 3", "Doanh thu": 18500000, "Đơn hàng": 56 },
  { name: "Thứ 4", "Doanh thu": 15000000, "Đơn hàng": 49 },
  { name: "Thứ 5", "Doanh thu": 21000000, "Đơn hàng": 71 },
  { name: "Thứ 6", "Doanh thu": 25500000, "Đơn hàng": 85 },
  { name: "Thứ 7", "Doanh thu": 38000000, "Đơn hàng": 120 },
  { name: "CN", "Doanh thu": 32000000, "Đơn hàng": 95 },
];

export function ChartWidgets() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="p-6 rounded-3xl border bg-card shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">Biểu đồ doanh thu</h3>
        <AreaChartWidget 
           data={mockRevenueData} 
           categories={["Doanh thu"]} 
           index="name" 
           valueFormatter={(v) => `${(v / 1000000).toLocaleString('vi-VN')}M`} 
        />
      </div>
      <div className="p-6 rounded-3xl border bg-card shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">Biểu đồ đơn hàng</h3>
        <BarChartWidget 
           data={mockRevenueData} 
           categories={["Đơn hàng"]} 
           index="name" 
           colors={["#f59e0b"]}
        />
      </div>
    </div>
  );
}
