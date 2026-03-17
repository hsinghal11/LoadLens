import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
    isPositive?: boolean;
  };
  valueColorClass?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  valueColorClass,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow space-y-2 p-6 flex flex-col justify-between",
        className
      )}
    >
      <div className="flex flex-row items-center justify-between space-y-0">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{label}</h3>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
              trend.isPositive === true ? "text-green-500 bg-green-500/10" : 
              trend.isPositive === false ? "text-red-500 bg-red-500/10" : 
              "text-muted-foreground bg-muted"
            )}
          >
            {trend.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
            {trend.direction === "down" && <ArrowDownRight className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1 mt-2">
          <div className={cn("text-3xl font-bold tracking-tight", valueColorClass)}>
            {value}
          </div>
          {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
