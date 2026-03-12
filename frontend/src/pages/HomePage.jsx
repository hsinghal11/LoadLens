import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Mock data (replace with real API calls) ──────────────────────────────────
const mockUser = {
  name: "Arjun Sharma",
  email: "arjun@example.com",
  avatar: null,
};

const mockRecentRuns = [
  {
    id: 1,
    planName: "Auth API Stress Test",
    targetUrl: "api.example.com/auth",
    p95: 142,
    rps: 287,
    errorRate: 0.4,
    status: "COMPLETED",
    duration: 30,
    completedAt: "2 hours ago",
    trend: "down",
  },
  {
    id: 2,
    planName: "Payment Gateway Load",
    targetUrl: "api.example.com/pay",
    p95: 891,
    rps: 43,
    errorRate: 8.2,
    status: "COMPLETED",
    duration: 60,
    completedAt: "Yesterday",
    trend: "up",
  },
  {
    id: 3,
    planName: "Search Endpoint Soak",
    targetUrl: "api.example.com/search",
    p95: 204,
    rps: 156,
    errorRate: 0.1,
    status: "COMPLETED",
    duration: 120,
    completedAt: "2 days ago",
    trend: "down",
  },
  {
    id: 4,
    planName: "Home Feed API",
    targetUrl: "api.example.com/feed",
    p95: 318,
    rps: 98,
    errorRate: 1.3,
    status: "COMPLETED",
    duration: 45,
    completedAt: "3 days ago",
    trend: "up",
  },
];

const mockPlans = [
  {
    id: 1,
    name: "Auth API Stress Test",
    targetUrl: "api.example.com/auth",
    virtualUsers: 50,
    status: "CREATED",
    lastRun: "2h ago",
    runsCount: 12,
  },
  {
    id: 2,
    name: "Payment Gateway Load",
    targetUrl: "api.example.com/pay",
    virtualUsers: 100,
    status: "CREATED",
    lastRun: "Yesterday",
    runsCount: 8,
  },
  {
    id: 3,
    name: "Search Endpoint Soak",
    targetUrl: "api.example.com/search",
    virtualUsers: 200,
    status: "CREATED",
    lastRun: "2d ago",
    runsCount: 5,
  },
  {
    id: 4,
    name: "Home Feed API",
    targetUrl: "api.example.com/feed",
    virtualUsers: 75,
    status: "RUNNING",
    lastRun: "Running…",
    runsCount: 3,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({ status }) {
  const map = {
    COMPLETED: {
      bg: "rgba(52,211,153,0.12)",
      color: "#34d399",
      dot: "#34d399",
      label: "Completed",
    },
    RUNNING: {
      bg: "rgba(34,211,238,0.12)",
      color: "#22d3ee",
      dot: "#22d3ee",
      label: "Running",
      pulse: true,
    },
    FAILED: {
      bg: "rgba(239,68,68,0.12)",
      color: "#f87171",
      dot: "#f87171",
      label: "Failed",
    },
    ABORTED: {
      bg: "rgba(156,163,175,0.12)",
      color: "#9ca3af",
      dot: "#9ca3af",
      label: "Aborted",
    },
    CREATED: {
      bg: "rgba(167,139,250,0.12)",
      color: "#a78bfa",
      dot: "#a78bfa",
      label: "Ready",
    },
  };
  const s = map[status] || map.CREATED;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: s.bg,
        color: s.color,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: s.dot,
          animation: s.pulse
            ? "ping 1.5s cubic-bezier(0,0,0.2,1) infinite"
            : "none",
        }}
      />
      {s.label}
    </span>
  );
}

function TrendChip({ trend, value }) {
  const up = trend === "up";
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        background: up ? "rgba(249,115,22,0.1)" : "rgba(52,211,153,0.1)",
        color: up ? "#f97316" : "#34d399",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {up ? "↑" : "↓"} {value}
    </span>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({ icon, title, desc, accent, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      className="relative w-full text-left rounded-2xl p-5 transition-all duration-300 group"
      style={{
        background: hovered
          ? `rgba(${accent}, 0.08)`
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? `rgba(${accent}, 0.3)` : "rgba(255,255,255,0.08)"}`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 40px rgba(${accent}, 0.12)` : "none",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
        style={{ background: `rgba(${accent}, 0.12)` }}
      >
        {icon}
      </div>
      <div
        className="font-semibold text-sm text-white mb-1"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {title}
      </div>
      <div
        className="text-xs leading-relaxed"
        style={{
          color: "rgba(255,255,255,0.4)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {desc}
      </div>
      <div
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs"
        style={{ color: `rgba(${accent}, 0.8)` }}
      >
        →
      </div>
    </button>
  );
}

// ── Sparkline mini chart ─────────────────────────────────────────────────────
function Sparkline({ values, color }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 80,
    H = 28;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle
        cx={pts.split(" ").pop().split(",")[0]}
        cy={pts.split(" ").pop().split(",")[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const [greeting, setGreeting] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening",
    );
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Simulate TanStack queries (replace with real fetchers)
  const { data: plans = mockPlans } = useQuery({
    queryKey: ["plans"],
    queryFn: () => Promise.resolve(mockPlans),
    staleTime: 30000,
  });

  const { data: recentRuns = mockRecentRuns } = useQuery({
    queryKey: ["recent-runs"],
    queryFn: () => Promise.resolve(mockRecentRuns),
    staleTime: 30000,
  });

  const runningPlan = plans.find((p) => p.status === "RUNNING");
  const sparkData = [142, 178, 155, 203, 167, 189, 142, 156, 134, 142];

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "#04070f",
        fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes slide-in { from { opacity:0; transform: translateX(-12px); } to { opacity:1; transform: translateX(0); } }
        @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
        .shimmer-text {
          background: linear-gradient(90deg, #22d3ee, #a78bfa, #f97316, #22d3ee);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .slide-in { animation: slide-in 0.4s ease forwards; }
        .fade-in  { animation: fade-in  0.5s ease forwards; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40"
        style={{
          background: "rgba(6,10,20,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-5 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #22d3ee, #a78bfa)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="white" />
              <path
                d="M8 1v2M8 13v2M1 8h2M13 8h2"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            className="font-bold text-base tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            LoadLens
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {[
            { id: "overview", icon: "⬡", label: "Overview" },
            { id: "plans", icon: "📋", label: "Test Plans" },
            { id: "history", icon: "🕐", label: "Run History" },
            { id: "compare", icon: "⇄", label: "Compare Runs" },
            { id: "settings", icon: "⚙", label: "Settings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
              style={{
                background:
                  activeTab === item.id
                    ? "rgba(34,211,238,0.1)"
                    : "transparent",
                color:
                  activeTab === item.id ? "#22d3ee" : "rgba(255,255,255,0.45)",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: activeTab === item.id ? 600 : 400,
                border:
                  activeTab === item.id
                    ? "1px solid rgba(34,211,238,0.2)"
                    : "1px solid transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id)
                  e.currentTarget.style.color = "rgba(255,255,255,0.75)";
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id)
                  e.currentTarget.style.color = "rgba(255,255,255,0.45)";
              }}
            >
              <span className="text-base w-5 text-center flex-shrink-0">
                {item.icon}
              </span>
              {item.label}
              {item.id === "history" && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(167,139,250,0.2)",
                    color: "#a78bfa",
                  }}
                >
                  {recentRuns.length}
                </span>
              )}
              {item.id === "plans" && runningPlan && (
                <span
                  className="ml-auto w-2 h-2 rounded-full bg-cyan-400"
                  style={{ animation: "ping 1.5s infinite" }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* User profile */}
        <div
          className="px-3 py-3 mx-2 mb-3 rounded-xl flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {getInitials(mockUser.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-xs font-semibold text-white truncate"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {mockUser.name}
            </div>
            <div
              className="text-xs truncate"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {mockUser.email}
            </div>
          </div>
          <button
            className="text-xs transition-colors"
            style={{ color: "rgba(255,255,255,0.25)" }}
            onMouseEnter={(e) =>
              (e.target.style.color = "rgba(255,255,255,0.6)")
            }
            onMouseLeave={(e) =>
              (e.target.style.color = "rgba(255,255,255,0.25)")
            }
            title="Sign out"
          >
            ⇥
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="ml-60 min-h-screen">
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-8 py-4"
          style={{
            background: "rgba(4,7,15,0.8)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <h1
              className="font-bold text-lg text-white"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {greeting}, {mockUser.name.split(" ")[0]} 👋
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {time.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              ·{" "}
              {time.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
              color: "white",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 0 20px rgba(34,211,238,0.25)",
              cursor: "pointer",
              border: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 30px rgba(34,211,238,0.4)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 20px rgba(34,211,238,0.25)")
            }
          >
            <span>+</span> New Test Plan
          </button>
        </div>

        <div className="px-8 py-6 space-y-6 fade-in">
          {/* ── RUNNING ALERT ── */}
          {runningPlan && (
            <div
              className="flex items-center justify-between rounded-2xl px-5 py-4"
              style={{
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full bg-cyan-400"
                  style={{ animation: "ping 1.5s infinite" }}
                />
                <span
                  className="text-sm font-medium text-cyan-300"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <strong>{runningPlan.name}</strong> is currently running ·{" "}
                  {runningPlan.virtualUsers} virtual users
                </span>
              </div>
              <button
                className="text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-200"
                style={{
                  background: "rgba(34,211,238,0.15)",
                  color: "#22d3ee",
                  border: "1px solid rgba(34,211,238,0.3)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(34,211,238,0.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(34,211,238,0.15)")
                }
              >
                View live →
              </button>
            </div>
          )}

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "Total Plans",
                value: plans.length,
                icon: "📋",
                color: "34,211,238",
                sub: `${plans.filter((p) => p.status === "RUNNING").length} running`,
              },
              {
                label: "Total Runs",
                value: recentRuns.length * 3,
                icon: "▶️",
                color: "167,139,250",
                sub: "all time",
              },
              {
                label: "Best p95",
                value: "129ms",
                icon: "⚡",
                color: "52,211,153",
                sub: "this week",
              },
              {
                label: "Avg Error Rate",
                value: `${(recentRuns.reduce((a, r) => a + r.errorRate, 0) / recentRuns.length).toFixed(1)}%`,
                icon: "🎯",
                color: "249,115,22",
                sub: "last 7 days",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5 transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="text-xs"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {stat.label}
                  </span>
                  <span className="text-base">{stat.icon}</span>
                </div>
                <div
                  className="font-bold mb-1"
                  style={{
                    fontSize: "1.75rem",
                    color: `rgba(${stat.color}, 0.95)`,
                    fontFamily: "'Sora', sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs"
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── QUICK ACTIONS ── */}
          <div>
            <h2
              className="font-semibold text-sm mb-3"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              What do you want to do?
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <QuickAction
                icon="🚀"
                title="New Test Plan"
                desc="Set a target URL, virtual users, and duration. Run it instantly."
                accent="34,211,238"
                onClick={() => setShowNewPlanModal(true)}
              />
              <QuickAction
                icon="▶️"
                title="Run Existing Plan"
                desc="Pick a saved plan and fire it off. Results save automatically."
                accent="167,139,250"
                onClick={() => setActiveTab("plans")}
              />
              <QuickAction
                icon="🕐"
                title="View Past Results"
                desc="Browse all completed runs with full latency breakdowns."
                accent="52,211,153"
                onClick={() => setActiveTab("history")}
              />
              <QuickAction
                icon="⇄"
                title="Compare Two Runs"
                desc="Overlay any two runs on one chart. Spot regressions instantly."
                accent="249,115,22"
                onClick={() => setActiveTab("compare")}
              />
            </div>
          </div>

          {/* ── BOTTOM TWO COLUMNS ── */}
          <div className="grid grid-cols-12 gap-4">
            {/* Recent runs table */}
            <div
              className="col-span-8 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <h3
                  className="font-semibold text-sm text-white"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  Recent Runs
                </h3>
                <button
                  className="text-xs transition-colors"
                  style={{
                    color: "rgba(34,211,238,0.7)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#22d3ee")}
                  onMouseLeave={(e) =>
                    (e.target.style.color = "rgba(34,211,238,0.7)")
                  }
                  onClick={() => setActiveTab("history")}
                >
                  View all →
                </button>
              </div>

              {/* Table header */}
              <div
                className="grid px-5 py-2.5 text-xs"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px",
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'JetBrains Mono', monospace",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span>PLAN</span>
                <span>p95</span>
                <span>RPS</span>
                <span>ERR%</span>
                <span>STATUS</span>
                <span className="text-right">WHEN</span>
              </div>

              {/* Table rows */}
              {recentRuns.map((run, i) => (
                <div
                  key={run.id}
                  className="grid px-5 py-3.5 cursor-pointer transition-colors duration-150"
                  style={{
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px",
                    borderBottom:
                      i < recentRuns.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div>
                    <div
                      className="text-sm font-medium text-white mb-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {run.planName}
                    </div>
                    <div
                      className="text-xs"
                      style={{
                        color: "rgba(255,255,255,0.3)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {run.targetUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-sm font-mono"
                      style={{
                        color:
                          run.p95 > 300
                            ? "#f97316"
                            : run.p95 > 200
                              ? "#facc15"
                              : "#34d399",
                      }}
                    >
                      {run.p95}ms
                    </span>
                    <TrendChip
                      trend={run.trend}
                      value={
                        run.trend === "up"
                          ? `+${Math.round(run.p95 * 0.15)}ms`
                          : `-${Math.round(run.p95 * 0.08)}ms`
                      }
                    />
                  </div>
                  <span
                    className="text-sm font-mono"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {run.rps}
                  </span>
                  <span
                    className="text-sm font-mono"
                    style={{
                      color:
                        run.errorRate > 5
                          ? "#f87171"
                          : run.errorRate > 1
                            ? "#f97316"
                            : "#34d399",
                    }}
                  >
                    {run.errorRate}%
                  </span>
                  <StatusBadge status={run.status} />
                  <span
                    className="text-xs text-right"
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {run.completedAt}
                  </span>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="col-span-4 space-y-4">
              {/* Active plans */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <h3
                    className="font-semibold text-sm text-white"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    Your Plans
                  </h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(167,139,250,0.15)",
                      color: "#a78bfa",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {plans.length}
                  </span>
                </div>
                <div className="p-2 space-y-1">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-150"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <div
                          className="text-xs font-medium text-white truncate"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {plan.name}
                        </div>
                        <div
                          className="text-xs truncate"
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {plan.virtualUsers} VU · {plan.runsCount} runs
                        </div>
                      </div>
                      <StatusBadge status={plan.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* p95 trend */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-semibold text-white"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    p95 trend
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    last 10 runs
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div
                      className="font-bold text-2xl"
                      style={{
                        color: "#34d399",
                        fontFamily: "'Sora', sans-serif",
                      }}
                    >
                      142ms
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{
                        color: "rgba(52,211,153,0.7)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      ↓ 18ms from last run
                    </div>
                  </div>
                  <Sparkline values={sparkData} color="#34d399" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── NEW PLAN MODAL ── */}
      {showNewPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewPlanModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 slide-in"
            style={{
              background: "rgba(8,12,24,0.98)",
              border: "1px solid rgba(34,211,238,0.2)",
              boxShadow:
                "0 0 80px rgba(34,211,238,0.1), 0 40px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="font-bold text-lg text-white"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                New Test Plan
              </h2>
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  border: "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "Plan Name",
                  placeholder: "e.g. Auth API Stress Test",
                  type: "text",
                },
                {
                  label: "Target URL",
                  placeholder: "https://api.example.com/endpoint",
                  type: "url",
                },
              ].map((f) => (
                <div key={f.label}>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "rgba(34,211,238,0.4)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                </div>
              ))}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Virtual Users", placeholder: "50", type: "number" },
                  { label: "Duration (s)", placeholder: "30", type: "number" },
                  { label: "Ramp-up (s)", placeholder: "5", type: "number" },
                ].map((f) => (
                  <div key={f.label}>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 text-center"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "rgba(34,211,238,0.4)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(34,211,238,0.3)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 0 30px rgba(34,211,238,0.5)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 0 20px rgba(34,211,238,0.3)")
                }
              >
                Save & Run →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
