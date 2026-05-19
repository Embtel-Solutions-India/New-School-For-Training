import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ComposedChart, Line, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, DollarSign, ShoppingCart, TrendingUp, Award } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TOOLTIP_STYLE = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };

const fmt = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Number(n).toLocaleString()}`;
};

function useCountUp(target, duration = 1400, active = true) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, active]);
  return value;
}

const KpiCard = ({ label, value, raw, prefix = "", suffix = "", color, icon: Icon, sub, subPositive, loading }) => {
  const count = useCountUp(raw || 0, 1400, !loading);
  const display = prefix + (raw >= 1000 ? fmt(count).replace("$", "") : count.toLocaleString()) + suffix;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[22px] ${glass} p-5`}>
      <div className="flex items-start justify-between">
        <div className="rounded-xl p-2.5" style={{ background: color }}>
          <Icon size={18} className="text-white" />
        </div>
        {sub !== undefined && !loading && (
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${subPositive ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
            {subPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(sub)}%
          </div>
        )}
      </div>
      <p className="mt-4 text-sm text-white/50">{label}</p>
      {loading ? (
        <Skeleton variant="text" width={100} height={40} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
      ) : (
        <p className="mt-1 text-2xl font-bold">{prefix}{raw >= 1000 ? fmt(raw) : raw?.toLocaleString()}{suffix}</p>
      )}
    </motion.div>
  );
};

const ChartCard = ({ title, subtitle, loading, height = 300, children }) => (
  <div className={`rounded-[24px] ${glass} p-5 sm:p-6`}>
    <div className="mb-5 flex items-center justify-between">
      <div>
        <p className="font-semibold text-white">{title}</p>
        {subtitle && <p className="text-sm text-white/45">{subtitle}</p>}
      </div>
      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Live</span>
    </div>
    {loading ? (
      <Skeleton variant="rounded" height={height} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
    ) : (
      <div style={{ height }}>{children}</div>
    )}
  </div>
);

const COURSE_COLORS = ["#22c55e", "#38bdf8", "#f97316", "#a78bfa", "#fde68a"];

const RevenueAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getRevenueAnalytics({ months: 6 })
      .then(({ data: res }) => setData(res.analytics))
      .catch(() => toast.error("Failed to load revenue analytics"))
      .finally(() => setLoading(false));
  }, []);

  const dailyChart = (data?.dailyRevenue || []).map((d) => ({
    name: `${d._id.month}/${d._id.day}`,
    revenue: d.revenue,
    sales: d.sales,
  }));

  const growth = data?.revenueGrowth ?? 0;
  const growthPositive = growth >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Revenue Analytics</h1>
            <p className="mt-2 text-white/60">Real-time revenue metrics, trends, and top-performing courses</p>
          </div>
          {!loading && data && (
            <div className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold ${growthPositive ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
              {growthPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(growth)}% vs last month
            </div>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Revenue (All Time)" raw={data?.totalRevenue || 0} prefix="$" color="rgba(34,197,94,0.2)" icon={DollarSign} loading={loading} />
        <KpiCard label="This Month" raw={data?.thisMonthRevenue || 0} prefix="$" color="rgba(56,189,248,0.2)" icon={TrendingUp}
          sub={Math.abs(growth)} subPositive={growthPositive} loading={loading} />
        <KpiCard label="Last Month" raw={data?.lastMonthRevenue || 0} prefix="$" color="rgba(249,115,22,0.2)" icon={DollarSign} loading={loading} />
        <KpiCard label="Total Sales" raw={data?.totalSales || 0} color="rgba(167,139,250,0.2)" icon={ShoppingCart} loading={loading} />
      </div>

      {/* This month vs last month comparison */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-6`}>
        <h3 className="mb-4 font-semibold">Month-over-Month Comparison</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "This Month Revenue", value: data?.thisMonthRevenue || 0, color: "#22c55e" },
            { label: "Last Month Revenue", value: data?.lastMonthRevenue || 0, color: "#38bdf8" },
          ].map((item) => {
            const max = Math.max(data?.thisMonthRevenue || 1, data?.lastMonthRevenue || 1);
            const pct = max > 0 ? ((item.value / max) * 100).toFixed(1) : 0;
            return (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-white/60">{item.label}</p>
                  {loading ? (
                    <Skeleton variant="text" width={70} height={28} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
                  ) : (
                    <p className="text-lg font-bold" style={{ color: item.color }}>{fmt(item.value)}</p>
                  )}
                </div>
                {loading ? (
                  <Skeleton variant="rounded" height={8} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: 99 }} />
                ) : (
                  <div className="h-2 rounded-full bg-white/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: item.color }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Monthly Revenue Chart (ComposedChart: bars + line) */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Monthly Revenue" subtitle="Revenue & sales volume over time" loading={loading} height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data?.chartData || []}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} />
              <ChartTooltip contentStyle={TOOLTIP_STYLE}
                formatter={(val, name) => name === "revenue" ? [`$${val.toLocaleString()}`, "Revenue"] : [val, "Sales"]} />
              <Bar yAxisId="left" dataKey="revenue" fill="url(#gradRevenue)" radius={[8, 8, 0, 0]} name="revenue" />
              <Line yAxisId="right" type="monotone" dataKey="sales" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: "#38bdf8", r: 4 }} name="sales" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Revenue (last 30 days) */}
        <ChartCard title="Daily Revenue" subtitle="Last 30 days revenue trend" loading={loading} height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyChart}>
              <defs>
                <linearGradient id="gradDaily" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false}
                interval={Math.floor(dailyChart.length / 6)} />
              <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <ChartTooltip contentStyle={TOOLTIP_STYLE}
                formatter={(val) => [`$${val.toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#a78bfa" fill="url(#gradDaily)" strokeWidth={2.5} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Courses by Revenue */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-6`}>
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl p-2.5" style={{ background: "rgba(251,191,36,0.2)" }}>
            <Award size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold">Top Courses by Revenue</p>
            <p className="text-sm text-white/45">Best-performing courses on the platform</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={52} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
            ))}
          </div>
        ) : (data?.topCourses || []).length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">No course revenue data yet</p>
        ) : (
          <div className="space-y-3">
            {(data.topCourses || []).map((course, i) => {
              const maxRevenue = data.topCourses[0]?.revenue || 1;
              const pct = ((course.revenue / maxRevenue) * 100).toFixed(1);
              return (
                <motion.div key={course.title || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold"
                    style={{ background: COURSE_COLORS[i % COURSE_COLORS.length] + "33", color: COURSE_COLORS[i % COURSE_COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{course.title}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.06 }}
                        className="h-full rounded-full" style={{ background: COURSE_COLORS[i % COURSE_COLORS.length] }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold" style={{ color: COURSE_COLORS[i % COURSE_COLORS.length] }}>{fmt(course.revenue)}</p>
                    <p className="text-xs text-white/40">{course.sales} sales</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Summary bottom row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Avg Revenue per Sale", value: data?.totalSales > 0 ? fmt(data.totalRevenue / data.totalSales) : "$0", desc: "Based on all completed payments", color: "#22c55e" },
          { label: "Revenue Growth", value: `${growthPositive ? "+" : ""}${growth}%`, desc: "This month vs last month", color: growthPositive ? "#22c55e" : "#ef4444" },
          { label: "Top Course Revenue", value: data?.topCourses?.[0] ? fmt(data.topCourses[0].revenue) : "$0", desc: data?.topCourses?.[0]?.title || "No data", color: "#fbbf24" },
        ].map((item) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-white/50">{item.label}</p>
            {loading ? (
              <Skeleton variant="text" width={80} height={36} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
            ) : (
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            )}
            <p className="mt-1 text-xs text-white/35 truncate">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RevenueAnalytics;
