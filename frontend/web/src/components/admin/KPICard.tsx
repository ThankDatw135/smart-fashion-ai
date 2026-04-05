import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: number; // percentage ex: 15.5
  trendLabel?: string;
  trendPeriod?: string;
  className?: string;
}

export function KPICard({ title, value, icon: Icon, trend, trendLabel, trendPeriod = "so với tháng trước", className }: KPICardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className={cn("p-6 rounded-3xl border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-muted-foreground">{title}</h3>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="text-3xl font-heading font-bold">{value}</h2>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-sm mt-4 pt-4 border-t border-dashed">
          <div className={cn(
            "flex items-center gap-0.5 font-medium px-2 py-0.5 rounded-full text-xs",
            isPositive ? "text-emerald-600 bg-emerald-100" : 
            isNegative ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted"
          )}>
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
          <span className="text-muted-foreground text-xs">{trendLabel || trendPeriod}</span>
        </div>
      )}
    </div>
  );
}
