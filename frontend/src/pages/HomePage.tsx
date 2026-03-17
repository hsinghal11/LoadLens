import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, History as HistoryIcon, GitCompare, Activity } from 'lucide-react';
import { planService, runService } from '@/api/services';
import { MetricCard } from '@/components/ui/MetricCard';
import { PlanStatusBadge } from '@/components/ui/PlanStatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/button';
import { formatMs } from '@/lib/utils';

export default function HomePage() {
  const navigate = useNavigate();
  
  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.getAll,
  });

  const planIds = plans?.map(p => p.id) || [];

  const { data: runs, isLoading: isRunsLoading } = useQuery({
    queryKey: ['runs', planIds],
    queryFn: () => runService.getAllAcrossPlans(planIds),
    enabled: planIds.length > 0,
  });

  if (isPlansLoading || (planIds.length > 0 && isRunsLoading)) {
    return <LoadingState message="Loading dashboard..." />;
  }

  const runningPlan = plans?.find(p => p.status === 'RUNNING');
  
  const totalPlans = plans?.length || 0;
  const totalRuns = runs?.length || 0;
  
  const bestP95ThisWeek = runs && runs.length > 0 
    ? Math.min(...runs.map(r => r.p95Latency))
    : 0;

  const avgErrorRate = runs && runs.length > 0
    ? runs.reduce((acc, curr) => acc + curr.errorRate, 0) / runs.length
    : 0;

  const recentRuns = runs ? [...runs].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, 5) : [];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {runningPlan && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <p className="font-medium text-cyan-600 dark:text-cyan-400">
              <span className="font-bold">{runningPlan.name}</span> is currently running
            </p>
          </div>
          <Button size="sm" onClick={() => navigate(`/plans/${runningPlan.id}/run`)}>
            View Live →
          </Button>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Plans" value={totalPlans} />
          <MetricCard label="Total Runs" value={totalRuns} />
          <MetricCard 
            label="Best p95 This Week" 
            value={bestP95ThisWeek > 0 ? formatMs(bestP95ThisWeek) : '-'} 
            valueColorClass="text-green-500"
          />
          <MetricCard 
            label="Avg Error Rate" 
            value={totalRuns > 0 ? `${avgErrorRate.toFixed(2)}%` : '-'} 
            valueColorClass={avgErrorRate > 1 ? "text-red-500" : "text-foreground"}
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/plans?new=true" className="flex flex-col items-center justify-center p-6 bg-card border rounded-xl hover:border-primary transition-colors text-center gap-3 group">
            <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">New Test Plan</span>
          </Link>
          <Link to="/plans" className="flex flex-col items-center justify-center p-6 bg-card border rounded-xl hover:border-primary transition-colors text-center gap-3 group">
            <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6" />
            </div>
            <span className="font-medium">Run Existing Plan</span>
          </Link>
          <Link to="/history" className="flex flex-col items-center justify-center p-6 bg-card border rounded-xl hover:border-primary transition-colors text-center gap-3 group">
            <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <span className="font-medium">View History</span>
          </Link>
          <Link to="/compare" className="flex flex-col items-center justify-center p-6 bg-card border rounded-xl hover:border-primary transition-colors text-center gap-3 group">
            <div className="p-3 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform">
              <GitCompare className="w-6 h-6" />
            </div>
            <span className="font-medium">Compare Runs</span>
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Recent Runs</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/history">View All</Link>
          </Button>
        </div>
        <div className="border rounded-xl flex flex-col overflow-hidden bg-card">
          {recentRuns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Plan Name</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">p95 Latency</th>
                    <th className="px-6 py-3 font-medium text-right">Avg RPS</th>
                    <th className="px-6 py-3 font-medium text-right">Error Rate</th>
                    <th className="px-6 py-3 font-medium text-right">Time Ago</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentRuns.map(run => {
                    const plan = plans?.find(p => p.id === run.planId);
                    // Mocking 'time ago' for brevity since there's no library like date-fns included by user
                    return (
                      <tr key={run.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{run.planName || plan?.name || `Plan #${run.planId}`}</td>
                        <td className="px-6 py-4"><PlanStatusBadge status={run.status || 'COMPLETED'} /></td>
                        <td className="px-6 py-4 text-right font-mono">{formatMs(run.p95Latency)}</td>
                        <td className="px-6 py-4 text-right font-mono">{run.avgRps.toFixed(0)} req/s</td>
                        <td className="px-6 py-4 text-right font-mono text-red-500">{run.errorRate.toFixed(2)}%</td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {new Date(run.startedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="h-10 w-10 mb-4 opacity-20" />
              <p>No runs found. Start a test plan to see results here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
