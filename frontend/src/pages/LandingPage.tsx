import { useState, useEffect, useRef } from "react";

// ── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// ── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(words, speed = 80, pause = 1800) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = words[wordIdx];
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          setDisplay(current.slice(0, charIdx + 1));
          if (charIdx + 1 === current.length) {
            setTimeout(() => setDeleting(true), pause);
          } else setCharIdx((c) => c + 1);
        } else {
          setDisplay(current.slice(0, charIdx - 1));
          if (charIdx - 1 === 0) {
            setDeleting(false);
            setWordIdx((w) => (w + 1) % words.length);
            setCharIdx(0);
          } else setCharIdx((c) => c - 1);
        }
      },
      deleting ? speed / 2 : speed,
    );
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return display;
}

// ── Floating particle ────────────────────────────────────────────────────────
function Particle({ style }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: style.size,
        height: style.size,
        left: style.left,
        top: style.top,
        background: style.color,
        opacity: style.opacity,
        animation: `float-particle ${style.duration}s ease-in-out infinite`,
        animationDelay: style.delay,
        filter: "blur(1px)",
      }}
    />
  );
}

// ── Live metrics ticker ──────────────────────────────────────────────────────
function MetricTicker() {
  const [rps, setRps] = useState(247);
  const [p95, setP95] = useState(142);
  const [errors, setErrors] = useState(0.3);
  useEffect(() => {
    const iv = setInterval(() => {
      setRps((v) =>
        Math.max(180, Math.min(320, v + (Math.random() - 0.5) * 20)),
      );
      setP95((v) =>
        Math.max(80, Math.min(280, v + (Math.random() - 0.5) * 15)),
      );
      setErrors((v) =>
        Math.max(0, Math.min(2, v + (Math.random() - 0.5) * 0.2)),
      );
    }, 900);
    return () => clearInterval(iv);
  }, []);

  const bars = Array.from({ length: 28 }, (_, i) => ({
    h: 20 + Math.random() * 60,
    color: i > 22 ? "#f97316" : i > 18 ? "#facc15" : "#22d3ee",
  }));
  const [chartBars] = useState(bars);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,15,30,0.85)",
        border: "1px solid rgba(34,211,238,0.2)",
        backdropFilter: "blur(20px)",
        boxShadow:
          "0 0 60px rgba(34,211,238,0.08), 0 30px 80px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
        <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
        <span
          className="ml-2 text-xs font-mono"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          loadlens — live dashboard
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
          />
          <span className="text-xs font-mono text-emerald-400">LIVE</span>
        </div>
      </div>

      <div className="p-5">
        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: "Requests/sec",
              value: Math.round(rps),
              unit: "rps",
              color: "#22d3ee",
            },
            {
              label: "p95 Latency",
              value: Math.round(p95),
              unit: "ms",
              color: "#a78bfa",
            },
            {
              label: "Error Rate",
              value: errors.toFixed(1),
              unit: "%",
              color: errors > 1 ? "#f97316" : "#34d399",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl p-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="text-xs mb-1"
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "monospace",
                }}
              >
                {m.label}
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-xl font-bold"
                  style={{ color: m.color, fontFamily: "monospace" }}
                >
                  {m.value}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  {m.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-mono"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              p95 latency · last 30s
            </span>
            <div className="flex items-center gap-3">
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                <span className="w-2 h-0.5 bg-cyan-400 inline-block rounded" />{" "}
                p50
              </span>
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                <span className="w-2 h-0.5 bg-violet-400 inline-block rounded" />{" "}
                p95
              </span>
            </div>
          </div>
          <div className="flex items-end gap-0.5 h-16">
            {chartBars.map((bar, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-700"
                style={{
                  height: `${bar.h}%`,
                  background: bar.color,
                  opacity: 0.7 + (i / chartBars.length) * 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Status row */}
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{
            background: "rgba(34,211,238,0.06)",
            border: "1px solid rgba(34,211,238,0.12)",
          }}
        >
          <span className="text-xs font-mono text-cyan-400">
            ● RUNNING · 00:23 elapsed
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            50 VU · api.example.com
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Bento card ───────────────────────────────────────────────────────────────
function BentoCard({ children, className = "", style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${className}`}
      style={{
        background: "rgba(10,15,30,0.6)",
        border: `1px solid ${hovered ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(12px)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 60px rgba(34,211,238,0.1), 0 0 0 1px rgba(34,211,238,0.1)"
          : "0 4px 24px rgba(0,0,0,0.3)",
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(34,211,238,0.05) 0%, transparent 70%)",
          }}
        />
      )}
      {children}
    </div>
  );
}

// ── Main Landing Page ────────────────────────────────────────────────────────
function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const typed = useTypewriter(
    ["any API.", "your backend.", "your microservice.", "production loads."],
    75,
    2000,
  );

  const c1 = useCounter(500, 1800, statsVisible);
  const c2 = useCounter(99, 1600, statsVisible);
  const c3 = useCounter(1, 1400, statsVisible);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const particles = Array.from({ length: 18 }, (_, i) => ({
    size: `${3 + Math.random() * 5}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    color:
      i % 3 === 0
        ? "rgba(34,211,238,0.6)"
        : i % 3 === 1
          ? "rgba(167,139,250,0.5)"
          : "rgba(249,115,22,0.4)",
    opacity: 0.3 + Math.random() * 0.4,
    duration: 4 + Math.random() * 6,
    delay: `-${Math.random() * 6}s`,
  }));

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        background: "#04070f",
        fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-18px) translateX(8px); }
          66% { transform: translateY(8px) translateX(-6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #22d3ee, #a78bfa, #f97316, #22d3ee);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .fade-up { animation: fade-up 0.8s ease forwards; }
        .fade-up-1 { animation: fade-up 0.8s ease 0.1s forwards; opacity: 0; }
        .fade-up-2 { animation: fade-up 0.8s ease 0.25s forwards; opacity: 0; }
        .fade-up-3 { animation: fade-up 0.8s ease 0.4s forwards; opacity: 0; }
        .fade-up-4 { animation: fade-up 0.8s ease 0.55s forwards; opacity: 0; }
        .fade-up-5 { animation: fade-up 0.8s ease 0.7s forwards; opacity: 0; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          padding: scrolled ? "10px 0" : "20px 0",
          background: scrolled ? "rgba(4,7,15,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
              }}
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
              className="font-bold text-lg tracking-tight"
              style={{ fontFamily: "'Sora', sans-serif", color: "white" }}
            >
              LoadLens
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it works", "Docs"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm transition-colors duration-200"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => (e.target.style.color = "white")}
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(255,255,255,0.5)")
                }
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm px-4 py-2 rounded-lg transition-all duration-200"
              style={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => (e.target.style.color = "white")}
              onMouseLeave={(e) =>
                (e.target.style.color = "rgba(255,255,255,0.7)")
              }
            >
              Sign in
            </a>
            <a
              href="/register"
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
                color: "white",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 0 20px rgba(34,211,238,0.3)",
              }}
              onMouseEnter={(e) =>
                (e.target.style.boxShadow = "0 0 30px rgba(34,211,238,0.5)")
              }
              onMouseLeave={(e) =>
                (e.target.style.boxShadow = "0 0 20px rgba(34,211,238,0.3)")
              }
            >
              Get started free
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Circular gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute rounded-full"
            style={{
              width: "700px",
              height: "700px",
              left: "50%",
              top: "40%",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(167,139,250,0.08) 40%, transparent 70%)",
              filter: "blur(40px)",
              animation: "glow-pulse 4s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "400px",
              height: "400px",
              left: "15%",
              top: "30%",
              background:
                "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "300px",
              height: "300px",
              right: "10%",
              top: "50%",
              background:
                "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
              filter: "blur(50px)",
            }}
          />
        </div>

        {/* Spinning rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div
            className="absolute rounded-full"
            style={{
              width: "500px",
              height: "500px",
              border: "1px solid rgba(34,211,238,0.4)",
              animation: "spin-slow 20s linear infinite",
              borderDasharray: "4 8",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "680px",
              height: "680px",
              border: "1px solid rgba(167,139,250,0.3)",
              animation: "spin-reverse 30s linear infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "860px",
              height: "860px",
              border: "1px solid rgba(255,255,255,0.06)",
              animation: "spin-slow 45s linear infinite",
            }}
          />
        </div>

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p, i) => (
            <Particle key={i} style={p} />
          ))}
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div
            className="fade-up-1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            style={{
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              style={{ animation: "pulse 1.5s infinite" }}
            />
            <span
              className="text-xs font-medium text-cyan-400"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Real-time load testing · Open source
            </span>
          </div>

          {/* Headline */}
          <h1
            className="fade-up-2 font-bold leading-none mb-6"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(3rem, 8vw, 6.5rem)",
            }}
          >
            <span style={{ color: "white" }}>Stress test </span>
            <br />
            <span className="shimmer-text">{typed}</span>
            <span
              className="inline-block w-0.5 h-[0.85em] ml-1 align-middle bg-cyan-400"
              style={{ animation: "pulse 1s step-end infinite" }}
            />
          </h1>

          {/* Subtitle */}
          <p
            className="fade-up-3 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Simulate hundreds of concurrent users, watch live latency metrics
            stream to your dashboard, and compare runs side by side — all
            without paying for a SaaS tool.
          </p>

          {/* CTA buttons */}
          <div className="fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="/register"
              className="group flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
                color: "white",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 0 40px rgba(34,211,238,0.35)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 60px rgba(34,211,238,0.55)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 0 40px rgba(34,211,238,0.35)")
              }
            >
              Start testing free
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href="#features"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-base transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.8)",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "rgba(255,255,255,0.8)";
              }}
            >
              See how it works
            </a>
          </div>

          {/* Dashboard preview */}
          <div className="fade-up-5 max-w-2xl mx-auto">
            <MetricTicker />
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ animation: "fade-up 1s ease 1.2s forwards", opacity: 0 }}
        >
          <span
            className="text-xs"
            style={{
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            scroll
          </span>
          <div
            className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            <div
              className="w-1 h-2 rounded-full bg-cyan-400"
              style={{ animation: "float-particle 1.5s ease-in-out infinite" }}
            />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                value: c1,
                suffix: "+",
                label: "Virtual users per test",
                color: "#22d3ee",
              },
              {
                value: c2,
                suffix: ".9%",
                label: "Metric delivery accuracy",
                color: "#a78bfa",
              },
              {
                value: c3,
                suffix: "s",
                label: "Update interval",
                color: "#f97316",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="font-bold mb-1"
                  style={{
                    fontSize: "clamp(2rem, 5vw, 3.5rem)",
                    color: stat.color,
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  {stat.value}
                  {stat.suffix}
                </div>
                <div
                  className="text-sm"
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ── */}
      <section id="features" className="py-20 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div
              className="inline-block text-xs font-medium px-3 py-1.5 rounded-full mb-4"
              style={{
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.2)",
                color: "#a78bfa",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              FEATURES
            </div>
            <h2
              className="font-bold mb-4"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Everything you need to{" "}
              <span className="shimmer-text">break things safely</span>
            </h2>
            <p
              className="text-base max-w-xl mx-auto"
              style={{
                color: "rgba(255,255,255,0.45)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              No terminal. No lost results. No expensive subscriptions.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-12 gap-4 auto-rows-auto">
            {/* Card 1 — large, live metrics */}
            <BentoCard className="col-span-12 md:col-span-7 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,211,238,0.15)" }}
                >
                  <span className="text-lg">📡</span>
                </div>
                <div>
                  <h3
                    className="font-semibold text-white mb-0.5"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    Live Metrics Dashboard
                  </h3>
                  <p
                    className="text-sm"
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    p50 / p95 latency, RPS, and error rate stream to your
                    browser every second over WebSocket. No refresh needed.
                  </p>
                </div>
              </div>
              {/* Mini chart viz */}
              <div className="flex items-end gap-0.5 h-12 mt-4">
                {Array.from({ length: 40 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${25 + Math.sin(i * 0.4) * 20 + Math.random() * 20}%`,
                      background:
                        i > 32
                          ? "rgba(249,115,22,0.7)"
                          : "rgba(34,211,238,0.5)",
                    }}
                  />
                ))}
              </div>
            </BentoCard>

            {/* Card 2 — virtual threads */}
            <BentoCard className="col-span-12 md:col-span-5 p-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(167,139,250,0.15)" }}
              >
                <span className="text-lg">⚡</span>
              </div>
              <h3
                className="font-semibold text-white mb-2"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                500+ Concurrent Users
              </h3>
              <p
                className="text-sm mb-4"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Java 21 Virtual Threads simulate massive concurrency on a
                laptop. No cloud. No cluster.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded"
                    style={{
                      background:
                        i < 20
                          ? "rgba(167,139,250,0.6)"
                          : "rgba(249,115,22,0.5)",
                      animation: `pulse ${1 + Math.random()}s ease-in-out ${Math.random()}s infinite`,
                    }}
                  />
                ))}
                <span
                  className="text-xs self-center ml-1"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  ···
                </span>
              </div>
            </BentoCard>

            {/* Card 3 — history */}
            <BentoCard className="col-span-12 md:col-span-4 p-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(52,211,153,0.15)" }}
              >
                <span className="text-lg">🗄️</span>
              </div>
              <h3
                className="font-semibold text-white mb-2"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Persistent History
              </h3>
              <p
                className="text-sm"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Every run saved to PostgreSQL. Results never vanish when you
                close the terminal — because there is no terminal.
              </p>
              <div className="mt-4 space-y-1.5">
                {[
                  "Run #12 · p95: 142ms",
                  "Run #11 · p95: 398ms",
                  "Run #10 · p95: 129ms",
                ].map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {r}
                    </span>
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: i === 1 ? "#f97316" : "#34d399" }}
                    />
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Card 4 — comparison */}
            <BentoCard className="col-span-12 md:col-span-5 p-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(249,115,22,0.15)" }}
              >
                <span className="text-lg">🔀</span>
              </div>
              <h3
                className="font-semibold text-white mb-2"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Run Comparison
              </h3>
              <p
                className="text-sm mb-4"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Overlay any two runs on one chart. Instantly see if a deployment
                made things faster or slower.
              </p>
              {/* Comparison bars */}
              <div className="space-y-2">
                {[
                  { label: "p95 before", v: 35, color: "#22d3ee" },
                  { label: "p95 after", v: 68, color: "#f97316" },
                ].map((b) => (
                  <div key={b.label}>
                    <div
                      className="flex justify-between text-xs mb-1"
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <span>{b.label}</span>
                      <span>{Math.round(b.v * 4)}ms</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${b.v}%`, background: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Card 5 — auth */}
            <BentoCard className="col-span-12 md:col-span-3 p-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(34,211,238,0.1)" }}
              >
                <span className="text-lg">🔐</span>
              </div>
              <h3
                className="font-semibold text-white mb-2"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Secure Auth
              </h3>
              <p
                className="text-sm"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Google OAuth2 or email/password. JWT-secured API. Your data
                stays yours.
              </p>
              <div className="mt-4 flex gap-2">
                <div
                  className="flex-1 rounded-lg py-2 text-center text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  🇬 Google
                </div>
                <div
                  className="flex-1 rounded-lg py-2 text-center text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  ✉ Email
                </div>
              </div>
            </BentoCard>

            {/* Card 6 — mock server */}
            <BentoCard className="col-span-12 p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(167,139,250,0.15)" }}
                >
                  <span className="text-lg">🎯</span>
                </div>
                <div className="flex-1">
                  <h3
                    className="font-semibold text-white mb-1"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    Safe by default — built-in mock server
                  </h3>
                  <p
                    className="text-sm"
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Test against our companion server with{" "}
                    <code
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "#22d3ee",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      /fast
                    </code>
                    ,{" "}
                    <code
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "#a78bfa",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      /slow
                    </code>
                    ,{" "}
                    <code
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "#f97316",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      /flaky
                    </code>
                    , and{" "}
                    <code
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "#34d399",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      /variable
                    </code>{" "}
                    endpoints. No rate limiting. No legal issues. Repeatable
                    demos.
                  </p>
                </div>
                <div className="hidden md:flex gap-2 flex-shrink-0">
                  {[
                    { label: "/fast", color: "#22d3ee", ms: "~10ms" },
                    { label: "/slow", color: "#a78bfa", ms: "~500ms" },
                    { label: "/flaky", color: "#f97316", ms: "20% err" },
                  ].map((e) => (
                    <div
                      key={e.label}
                      className="rounded-xl px-3 py-2 text-center"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="text-xs font-mono mb-0.5"
                        style={{ color: e.color }}
                      >
                        {e.label}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {e.ms}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <div
              className="inline-block text-xs font-medium px-3 py-1.5 rounded-full mb-4"
              style={{
                background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.2)",
                color: "#22d3ee",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              HOW IT WORKS
            </div>
            <h2
              className="font-bold"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Three steps to answers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: "⚙️",
                title: "Create a plan",
                desc: "Name your test, paste a target URL, set virtual users and duration. Saved forever.",
              },
              {
                step: "02",
                icon: "▶️",
                title: "Hit run",
                desc: "Hundreds of virtual users hit your server simultaneously. Watch the graph draw itself live.",
              },
              {
                step: "03",
                icon: "📊",
                title: "Compare & decide",
                desc: "Pick any two runs, overlay them on one chart. Know immediately if your last deploy helped or hurt.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative p-6 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {s.step}
                </div>
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3
                  className="font-semibold text-white mb-2"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm"
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(34,211,238,0.08) 0%, transparent 100%)",
          }}
        />
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Ready to <span className="shimmer-text">break your server</span>
            <br />
            before your users do?
          </h2>
          <p
            className="mb-8 text-base"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Free. Open source. No credit card. Self-hostable in one command.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)",
              color: "white",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 0 50px rgba(34,211,238,0.4)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 70px rgba(34,211,238,0.6)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow =
                "0 0 50px rgba(34,211,238,0.4)")
            }
          >
            Get started free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p
          className="text-sm"
          style={{
            color: "rgba(255,255,255,0.25)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Built with Spring Boot + React · Open source on GitHub
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;

