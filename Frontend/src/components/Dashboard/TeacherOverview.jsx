import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import {
  Area, AreaChart, CartesianGrid, ComposedChart, Bar, Line,
  ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis,
} from "recharts";
import {
  BookOpen, CheckCircle2, DollarSign, Star, TrendingUp, Users, Video, FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TOOLTIP_STYLE = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };

function useCountUp(target, active = true) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!active || !target) return;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / 1200, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active]);
  return val;
}

const fmt = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return n?.toLocaleString() || "0";
};

const KpiCard = ({ label, raw = 0, prefix = "", suffix = "", color, icon: Icon, loading, delay = 0 }) => {
  const count = useCountUp(raw, !loading);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`rounded-[22px] ${glass} p-5`}>
      <div className="flex items-center justify-between">
        <div className="rounded-xl p-2.5" style={{ background: color }}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="mt-4 text-sm text-white/50">{label}</p>
      {loading ? (
        <Skeleton variant="text" width={90} height={40} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
      ) : (
        <p className="mt-1 text-2xl font-bold">{prefix}{raw >= 1000 && prefix === "$" ? fmt(count).replace("$","") : count.toLocaleString()}{suffix}</p>
      )}
    </motion.div>
  );
};

const STATUS_COLORS = { draft: "#94a3b8", pending_review: "#fbbf24", published: "#22c55e", rejected: "#ef4444", archived: "#64748b" };

const TeacherOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getOverview()
      .then(({ data: res }) => setData(res.overview))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Total Courses", raw: data?.totalCourses || 0, color: "rgba(34,197,94,0.2)", icon: BookOpen },
    { label: "Total Students", raw: data?.totalStudents || 0, color: "rgba(56,189,248,0.2)", icon: Users },
    { label: "Active Students", raw: data?.activeStudents || 0, color: "rgba(249,115,22,0.2)", icon: TrendingUp },
    { label: "Total Lessons", raw: data?.totalLessons || 0, color: "rgba(167,139,250,0.2)", icon: FileText },
    { label: "Total Enrollments", raw: data?.totalStudents || 0, color: "rgba(251,191,36,0.2)", icon: CheckCircle2 },
    { label: "Revenue Generated", raw: data?.totalRevenue || 0, prefix: "$", color: "rgba(34,197,94,0.2)", icon: DollarSign },
    { label: "Pending Assignments", raw: data?.pendingAssignments || 0, color: "rgba(239,68,68,0.2)", icon: FileText },
    { label: "Live Sessions", raw: data?.totalSessions || 0, color: "rgba(99,102,241,0.2)", icon: Video },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Teacher Dashboard</h1>
            <p className="mt-2 text-white/60">Real-time metrics across your courses, students, and content</p>
          </div>
          {!loading && data && (
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <p className="text-xs text-white/50">Avg Rating</p>
                <p className="text-xl font-bold text-yellow-300 flex items-center gap-1">
                  <Star size={14} className="fill-yellow-300" />{data.avgRating || "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <p className="text-xs text-white/50">Reviews</p>
                <p className="text-xl font-bold">{(data.totalReviews || 0).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 8 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} loading={loading} delay={i * 0.04} />)}
      </div>

      {/* Revenue & Enrollment Chart */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className={`rounded-[24px] ${glass} p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Revenue & Enrollments</p>
              <p className="text-sm text-white/45">Last 6 months trend</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">Live</span>
          </div>
          {loading ? (
            <Skeleton variant="rounded" height={260} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
          ) : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.revenueChart || []}>
                  <defs>
                    <linearGradient id="tGradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false}
                    tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.2)" tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v, n) => n === "revenue" ? [`$${v.toLocaleString()}`, "Revenue"] : [v, "Enrollments"]} />
                  <Bar yAxisId="left" dataKey="revenue" fill="url(#tGradRev)" radius={[6,6,0,0]} name="revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="enrollments" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: "#38bdf8", r: 3 }} name="enrollments" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Course Status Summary */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Course Overview</p>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={52} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Published", value: data?.publishedCourses || 0, color: "#22c55e" },
                { label: "Draft", value: data?.draftCourses || 0, color: "#94a3b8" },
                { label: "Upcoming Sessions", value: data?.upcomingSessions || 0, color: "#f97316" },
                { label: "Students Active (7d)", value: data?.activeStudents7d || 0, color: "#38bdf8" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-white/70">{item.label}</span>
                  </div>
                  <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Enrollments */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-6`}>
        <p className="mb-4 font-semibold">Recent Enrollments</p>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={56} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
            ))}
          </div>
        ) : (data?.recentEnrollments || []).length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">No enrollments yet</p>
        ) : (
          <div className="space-y-2">
            {(data.recentEnrollments || []).map((e, i) => (
              <motion.div key={e._id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold text-white">
                  {e.user?.name?.[0] || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e.user?.name || "Unknown"}</p>
                  <p className="truncate text-xs text-white/45">{e.course?.title || "—"}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-emerald-300">
                    {e.payment?.amount > 0 ? `$${e.payment.amount.toLocaleString()}` : "Free"}
                  </p>
                  <p className="text-xs text-white/35">{new Date(e.createdAt).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TeacherOverview;
