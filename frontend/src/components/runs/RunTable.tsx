import { useState, useEffect } from "react";
import { formatMs, formatDate } from "@/lib/utils";
import { PlanStatusBadge } from "../ui/PlanStatusBadge";
import type { RunResultResponse } from "@/api/services";

interface RunTableProps {
  runs: (RunResultResponse & { planName?: string })[];
  showPlanName?: boolean;
  onSelectionChange?: (selectedIds: number[]) => void;
  onRowClick?: (runId: number) => void;
}

export function RunTable({ runs, showPlanName = false, onSelectionChange, onRowClick }: RunTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  const toggleSelection = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // prevent row click
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
            <tr>
              {onSelectionChange && (
                <th className="px-6 py-3 font-medium w-12 text-center">Compare</th>
              )}
              {showPlanName ? (
                <th className="px-6 py-3 font-medium">Plan Name</th>
              ) : (
                <th className="px-6 py-3 font-medium">Run ID</th>
              )}
              <th className="px-6 py-3 font-medium">Started At</th>
              <th className="px-6 py-3 font-medium text-right">Duration</th>
              <th className="px-6 py-3 font-medium text-right">p95 Latency</th>
              <th className="px-6 py-3 font-medium text-right">Avg RPS</th>
              <th className="px-6 py-3 font-medium text-right">Error Rate</th>
              <th className="px-6 py-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                  No runs found
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr 
                  key={run.id} 
                  className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} ${selectedIds.includes(run.id) ? "bg-primary/5" : ""}`}
                  onClick={() => onRowClick && onRowClick(run.id)}
                >
                  {onSelectionChange && (
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={selectedIds.includes(run.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelection(e as any, run.id);
                        }}
                      />
                    </td>
                  )}
                  {showPlanName ? (
                    <td className="px-6 py-4 font-medium">{run.planName || `Plan #${run.planId}`}</td>
                  ) : (
                    <td className="px-6 py-4 font-medium text-muted-foreground">#{run.id}</td>
                  )}
                  <td className="px-6 py-4">{formatDate(run.startedAt)}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatMs((run.durationSeconds || 0) * 1000)}</td>
                  <td className="px-6 py-4 text-right font-mono">{formatMs(run.p95Latency || 0)}</td>
                  <td className="px-6 py-4 text-right font-mono">{(run.avgRps || 0).toFixed(0)}</td>
                  <td className={`px-6 py-4 text-right font-mono ${(run.errorRate || 0) > 1 ? "text-red-500" : ""}`}>
                    {(run.errorRate || 0).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <PlanStatusBadge status={run.status || "COMPLETED"} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
