import { cn } from "@/lib/utils";

export type PlanStatus =
  | "CREATED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "ABORTED"
  | "DRAINING";

interface PlanStatusBadgeProps {
  status: PlanStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string; pulse?: boolean }> = {
  CREATED: { label: "Ready", className: "bg-violet-500/15 text-violet-500 border-violet-500/30" },
  RUNNING: { label: "Running", className: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30", pulse: true },
  COMPLETED: { label: "Completed", className: "bg-green-500/15 text-green-500 border-green-500/30" },
  FAILED: { label: "Failed", className: "bg-red-500/15 text-red-500 border-red-500/30" },
  ABORTED: { label: "Aborted", className: "bg-gray-500/15 text-gray-500 border-gray-500/30" },
  DRAINING: { label: "Draining", className: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
};

export function PlanStatusBadge({ status, className }: PlanStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-500/15 text-gray-500", pulse: false };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        config.className,
        className
      )}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
      )}
      {config.label}
    </div>
  );
}
