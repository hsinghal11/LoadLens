import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MetricSnapshot } from "@/hooks/useWebSocket";

interface LiveChartProps {
  data: MetricSnapshot[];
  height?: number;
}

export function LiveChart({ data, height = 300 }: LiveChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center border rounded-xl bg-card text-muted-foreground"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="relative flex h-3 w-3 mb-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <p>Waiting for first data point...</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour12: false }),
    p50: d.p50,
    p95: d.p95,
  }));

  return (
    <div className="w-full border rounded-xl bg-card p-4 pt-6" style={{ height: height + 60 }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: "#888" }}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#888" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Latency (ms)", angle: -90, position: "insideLeft", fill: "#888", fontSize: 12, dy: 40 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151", borderRadius: "8px" }}
            itemStyle={{ fontSize: 14 }}
            labelStyle={{ color: "#9ca3af", marginBottom: 4 }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Line
            type="monotone"
            dataKey="p50"
            name="p50 Latency"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="p95"
            name="p95 Latency"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
