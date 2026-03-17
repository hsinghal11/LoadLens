import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RunResultResponse } from "@/api/services";

interface CompareChartProps {
  runA: RunResultResponse;
  runB: RunResultResponse;
  height?: number;
}

export function CompareChart({ runA, runB, height = 400 }: CompareChartProps) {
  const data = [
    { metric: "p50 Latency (ms)", runA: runA.p50Latency, runB: runB.p50Latency },
    { metric: "p95 Latency (ms)", runA: runA.p95Latency, runB: runB.p95Latency },
    { metric: "Avg RPS",          runA: runA.avgRps,      runB: runB.avgRps },
    { metric: "Error Rate (%)",   runA: runA.errorRate,   runB: runB.errorRate },
  ];

  return (
    <div className="w-full border rounded-xl bg-card p-4 pt-6" style={{ height: height + 60 }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <XAxis
            dataKey="metric"
            tick={{ fill: "#888", fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151", borderRadius: "8px" }}
            itemStyle={{ fontSize: 14 }}
            labelStyle={{ color: "#9ca3af", marginBottom: 8, fontWeight: "bold" }}
            formatter={(value: number | undefined, name: string | undefined) => [
              value == null ? '-' : (Number.isInteger(value) ? value : value.toFixed(2)),
              name === "runA" ? `Run A (#${runA.id})` : `Run B (#${runB.id})`,
            ] as [string | number, string]}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value: string) =>
              value === "runA" ? `Run A (#${runA.id})` : `Run B (#${runB.id})`
            }
          />
          <Bar dataKey="runA" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="runB" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
