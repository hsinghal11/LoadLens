import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, Play, GitCompare } from "lucide-react";
import { toast } from "sonner";

import { planService, runService } from "@/api/services";
import type { TestPlanResponse } from "@/api/services";
import { PlanStatusBadge } from "@/components/ui/PlanStatusBadge";
import type { PlanStatus } from "@/components/ui/PlanStatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/LoadingState";
import { RunTable } from "@/components/runs/RunTable";
import { CreatePlanModal } from "@/components/plans/CreatePlanModal";
import { formatMs, formatDate } from "@/lib/utils";

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const planId = parseInt(id!, 10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRunIds, setSelectedRunIds] = useState<number[]>([]);

  const { data: plan, isLoading: isPlanLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: () => planService.getOne(planId),
  });

  const { data: runs, isLoading: isRunsLoading } = useQuery({
    queryKey: ["runs", planId],
    queryFn: () => runService.getByPlan(planId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Omit<TestPlanResponse, "id" | "status" | "createdAt" | "updatedAt">) =>
      planService.update(planId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      toast.success("Plan updated successfully");
      setIsEditModalOpen(false);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Failed to update plan");
    },
  });

  if (isPlanLoading || isRunsLoading) return <LoadingState />;
  if (!plan) return <div className="p-8">Plan not found</div>;

  const handleCompare = () => {
    if (selectedRunIds.length === 2) {
      navigate(`/compare?run1=${selectedRunIds[0]}&run2=${selectedRunIds[1]}`);
    }
  };

  const handleRun = () => {
    planService.startRun(planId)
      .then(() => navigate(`/plans/${planId}/run`))
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e.response?.data?.message || "Could not start run");
      });
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Plan Detail Card */}
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{plan.name}</h1>
              <PlanStatusBadge status={plan.status as PlanStatus} />
            </div>
            <a
              href={plan.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors font-mono text-sm max-w-[400px] truncate"
            >
              {plan.targetUrl}
            </a>

            <div className="flex flex-wrap gap-x-8 gap-y-4 mt-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Virtual Users</div>
                <div className="text-xl font-semibold mt-1">{plan.virtualUsers}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Duration</div>
                <div className="text-xl font-semibold mt-1">{formatMs(plan.durationSeconds * 1000)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Ramp Up</div>
                <div className="text-xl font-semibold mt-1">{plan.rampUpSeconds}s</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Created At</div>
                <div className="text-lg font-medium mt-1">{formatDate(plan.createdAt)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 md:border-l md:pl-6">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Plan
            </Button>
            <Button
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              onClick={handleRun}
              disabled={plan.status === "RUNNING"}
            >
              <Play className="w-4 h-4 mr-2" />
              Run Now
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Run History</h2>
          {selectedRunIds.length > 0 && (
            <Button
              variant={selectedRunIds.length === 2 ? "default" : "outline"}
              disabled={selectedRunIds.length !== 2}
              onClick={handleCompare}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              {selectedRunIds.length === 2 ? "Compare Selected" : `${selectedRunIds.length} selected`}
            </Button>
          )}
        </div>

        <RunTable runs={runs || []} onSelectionChange={setSelectedRunIds} />
      </div>

      <CreatePlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={plan}
        onSubmit={(data) => updateMutation.mutate(data)}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
