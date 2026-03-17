import { formatMs } from "@/lib/utils";
import { PlanStatusBadge } from "../ui/PlanStatusBadge";
import type { PlanStatus } from "../ui/PlanStatusBadge";
import { Button } from "../ui/button";
import { Play, Edit2, Trash2, StopCircle } from "lucide-react";
import type { TestPlanResponse } from "@/api/services";

interface PlanTableProps {
  plans: TestPlanResponse[];
  onRun: (plan: TestPlanResponse) => void;
  onAbort: (plan: TestPlanResponse) => void;
  onEdit: (plan: TestPlanResponse) => void;
  onDelete: (plan: TestPlanResponse) => void;
}

export function PlanTable({ plans, onRun, onAbort, onEdit, onDelete }: PlanTableProps) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Target URL</th>
              <th className="px-6 py-3 font-medium text-right">VUs</th>
              <th className="px-6 py-3 font-medium text-right">Duration</th>
              <th className="px-6 py-3 font-medium text-center">Status</th>
              <th className="px-6 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-medium">{plan.name}</td>
                <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]" title={plan.targetUrl}>
                  {plan.targetUrl}
                </td>
                <td className="px-6 py-4 text-right font-mono">{plan.virtualUsers}</td>
                <td className="px-6 py-4 text-right font-mono">{formatMs(plan.durationSeconds * 1000)}</td>
                <td className="px-6 py-4 text-center">
                  <PlanStatusBadge status={plan.status as PlanStatus} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {plan.status === "RUNNING" ? (
                      <Button variant="outline" size="sm" onClick={() => onAbort(plan)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                        <StopCircle className="h-4 w-4 mr-1" />
                        Abort
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onRun(plan)} className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(plan)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
