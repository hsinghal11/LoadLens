import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { runService } from '@/api/services';
import { CompareChart } from '@/components/runs/CompareChart';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatMs } from '@/lib/utils';
import { PlanStatusBadge } from '@/components/ui/PlanStatusBadge';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const run1Id = searchParams.get('run1');
  const run2Id = searchParams.get('run2');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['compare', run1Id, run2Id],
    queryFn: () => runService.compare(Number(run1Id), Number(run2Id)),
    enabled: !!run1Id && !!run2Id,
  });

  if (!run1Id || !run2Id) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Please select exactly two runs to compare from the History or Plan detail pages.</p>
        <Button onClick={() => navigate('/history')} className="mt-4" variant="outline">Go to History</Button>
      </div>
    );
  }

  if (isLoading) return <LoadingState message="Analyzing comparison..." />;
  if (isError || !data) return <div className="p-8 text-red-500">Failed to load comparison data.</div>;

  const { runA, runB, delta } = data;

  // Delta helpers - assuming delta object shape from prompt is { p95: -12.4, p50: -5.1, rps: 50.0, errorRate: 0.0 }
  // Fallback calculations if backend doesn't provide them yet:
  const resolvedDelta = delta || {
    p95: runB.p95Latency - runA.p95Latency,
    p50: runB.p50Latency - runA.p50Latency,
    rps: runB.avgRps - runA.avgRps,
    errorRate: runB.errorRate - runA.errorRate,
  };

  const getLatencyVerdict = (d: number) => {
    if (d === 0) return { text: "No change", color: "text-muted-foreground" };
    return d > 0 
      ? { text: `↑ ${d.toFixed(1)}ms slower`, color: "text-red-500" } 
      : { text: `↓ ${Math.abs(d).toFixed(1)}ms faster`, color: "text-green-500" };
  };

  const getRpsVerdict = (d: number) => {
    if (d === 0) return { text: "No change", color: "text-muted-foreground" };
    return d > 0 
      ? { text: `↑ ${d.toFixed(1)} RPS higher`, color: "text-green-500" } 
      : { text: `↓ ${Math.abs(d).toFixed(1)} RPS lower`, color: "text-red-500" };
  };

  const getErrorVerdict = (d: number) => {
    if (d === 0) return { text: "No change", color: "text-muted-foreground" };
    return d > 0 
      ? { text: `↑ ${d.toFixed(2)}% worse`, color: "text-red-500" } 
      : { text: `↓ ${Math.abs(d).toFixed(2)}% better`, color: "text-green-500" };
  };

  const tableRows = [
    { label: "p95 Latency", valA: formatMs(runA.p95Latency), valB: formatMs(runB.p95Latency), deltaRaw: resolvedDelta.p95, verdict: getLatencyVerdict(resolvedDelta.p95) },
    { label: "p50 Latency", valA: formatMs(runA.p50Latency), valB: formatMs(runB.p50Latency), deltaRaw: resolvedDelta.p50, verdict: getLatencyVerdict(resolvedDelta.p50) },
    { label: "Avg RPS", valA: runA.avgRps.toFixed(1), valB: runB.avgRps.toFixed(1), deltaRaw: resolvedDelta.rps, verdict: getRpsVerdict(resolvedDelta.rps) },
    { label: "Error Rate", valA: `${runA.errorRate.toFixed(2)}%`, valB: `${runB.errorRate.toFixed(2)}%`, deltaRaw: resolvedDelta.errorRate, verdict: getErrorVerdict(resolvedDelta.errorRate) },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Run Comparison</h1>
          <p className="text-muted-foreground mt-1">Comparing Run #{runA.id} against Run #{runB.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
          <div className="text-sm font-medium text-muted-foreground mb-1">Run A</div>
          <div className="text-lg font-bold">#{runA.id}</div>
          <div className="mt-2"><PlanStatusBadge status={runA.status || 'COMPLETED'} /></div>
        </div>
        <div className="border bg-card p-4 rounded-xl shadow-sm text-center">
          <div className="text-sm font-medium text-muted-foreground mb-1">Run B</div>
          <div className="text-lg font-bold">#{runB.id}</div>
          <div className="mt-2"><PlanStatusBadge status={runB.status || 'COMPLETED'} /></div>
        </div>
      </div>

      <CompareChart runA={runA} runB={runB} />

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Delta Summary</h2>
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
              <tr>
                <th className="px-6 py-4 font-medium w-1/4">Metric</th>
                <th className="px-6 py-4 font-medium text-right w-1/5">Run A</th>
                <th className="px-6 py-4 font-medium text-right w-1/5">Run B</th>
                <th className="px-6 py-4 font-medium text-right w-1/5">Delta</th>
                <th className="px-6 py-4 font-medium text-right w-[15%]">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tableRows.map((row) => (
                <tr key={row.label} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{row.label}</td>
                  <td className="px-6 py-4 text-right font-mono text-muted-foreground">{row.valA}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium">{row.valB}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${row.verdict.color}`}>
                    {row.deltaRaw > 0 ? "+" : ""}{Number.isInteger(row.deltaRaw) ? row.deltaRaw : row.deltaRaw.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 text-right ${row.verdict.color}`}>
                    {row.verdict.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
