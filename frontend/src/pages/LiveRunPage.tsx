import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StopCircle, ArrowLeft, Users } from "lucide-react";

import { planService } from "@/api/services";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { MetricSnapshot, TerminalMessage } from "@/hooks/useWebSocket";
import { LiveChart } from "@/components/charts/LiveChart";
import { MetricCard } from "@/components/ui/MetricCard";
import { PlanStatusBadge } from "@/components/ui/PlanStatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatMs } from "@/lib/utils";

export default function LiveRunPage() {
  const { id } = useParams<{ id: string }>();
  const planId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [metrics, setMetrics] = useState<MetricSnapshot[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [runStatus, setRunStatus] = useState<"RUNNING" | "COMPLETED" | "FAILED" | "ABORTED">("RUNNING");

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: () => planService.getOne(planId!),
    enabled: !!planId,
  });

  const abortRunMutation = useMutation({
    mutationFn: () => planService.abortRun(planId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      toast.success("Run aborted");
      setRunStatus("ABORTED");
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Failed to abort run");
    },
  });

  const handleSnapshot = useCallback((snapshot: MetricSnapshot) => {
    console.log("[LiveRunPage] Snapshot mapped to state:", snapshot);
    setMetrics((prev) => {
      const updated = [...prev, snapshot];
      return updated.length > 60 ? updated.slice(updated.length - 60) : updated;
    });
  }, []);

  const handleTerminal = useCallback(
    (message: TerminalMessage) => {
      setRunStatus(message.status);
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      queryClient.invalidateQueries({ queryKey: ["runs", planId] });
    },
    [queryClient, planId]
  );

  const { connected } = useWebSocket(
    runStatus === "RUNNING" ? planId : null,
    handleSnapshot,
    handleTerminal
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (runStatus === "RUNNING") {
      interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [runStatus]);

  if (isLoading || !plan) return <LoadingState message="Connecting to test runner..." />;

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/plans")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{plan.targetUrl}</span>
              <span>•</span>
              <span>{plan.virtualUsers} VUs max</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground font-medium">Elapsed</div>
            <div className="text-xl font-mono font-bold">{formatMs(elapsed * 1000)}</div>
          </div>
          <div className="h-10 w-px bg-border mx-2" />
          <PlanStatusBadge status={runStatus} />

          {runStatus === "RUNNING" && (
            <Button
              variant="destructive"
              onClick={() => abortRunMutation.mutate()}
              disabled={abortRunMutation.isPending}
              className="ml-2"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              {abortRunMutation.isPending ? "Aborting..." : "Abort Run"}
            </Button>
          )}

          {runStatus !== "RUNNING" && (
            <Button onClick={() => navigate(`/plans/${planId}`)} className="ml-2">
              View Results
            </Button>
          )}
        </div>
      </div>

      {runStatus !== "RUNNING" && runStatus !== "ABORTED" && (
        <div
          className={`p-4 rounded-lg flex justify-between items-center border ${
            runStatus === "COMPLETED"
              ? "bg-green-500/10 border-green-500/20 text-green-600"
              : "bg-red-500/10 border-red-500/20 text-red-600"
          }`}
        >
          <div className="font-medium">Test run has {runStatus.toLowerCase()}.</div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/plans/${planId}`)}>
            View Final Report
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Current RPS" value={latestMetric ? latestMetric.requestsPerSecond.toFixed(0) : "0"} unit="req/s" />
        <MetricCard label="Current p95" value={latestMetric ? formatMs(latestMetric.p95) : "-"} />
        <MetricCard
          label="Error Rate"
          value={latestMetric ? `${latestMetric.errorRate.toFixed(2)}%` : "0.00%"}
          valueColorClass={latestMetric && latestMetric.errorRate > 1 ? "text-red-500" : ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Latency Overview</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
            <Users className="h-4 w-4" />
            <span className="font-medium">{latestMetric ? latestMetric.activeVirtualUsers : 0}</span> Active VUs
            {!connected && runStatus === "RUNNING" && (
              <span className="text-red-500 ml-2">(Disconnected)</span>
            )}
          </div>
        </div>
        {metrics.length === 0 && runStatus !== "RUNNING" ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-muted/20 text-muted-foreground text-sm">
            <StopCircle className="h-8 w-8 mb-2 opacity-50" />
            <p>The test finished before any metrics were collected.</p>
            <p>Try increasing the duration or virtual users.</p>
          </div>
        ) : (
          <LiveChart data={metrics} height={400} />
        )}
      </div>
    </div>
  );
}
