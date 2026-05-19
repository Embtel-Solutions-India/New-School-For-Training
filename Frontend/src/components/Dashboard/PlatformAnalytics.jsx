import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, PieChart, Pie,
  ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis,
} from "recharts";
import { Activity, BookOpen, TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TOOLTIP_STYLE = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };
const PIE_COLORS = ["#22c55e", "#38bdf8", "#f97316", "#a78bfa", "#fde68a"];

const ChartCard = ({ title, subtitle, loading, height = 280, children }) => (
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

const KpiBox = ({ label, value, color, icon: Icon, loading }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[22px] ${glass} p-5`}>
    <div className="flex items-center justify-between">
      <div className="rounded-xl p-2.5" style={{ background: color }}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="mt-4 text-sm text-white/50">{label}</p>
    {loading ? (
      <Skeleton variant="text" width={80} height={36} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
    ) : (
      <p className="mt-1 text-2xl font-bold">{value}</p>
    )}
  </motion.div>
);

const PlatformAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getPlatformAnalytics({ months: 6 })
      .then(({ data: res }) => setData(res.analytics))
      .catch(() => toast.error("Failed to load platform analytics"))
      .finally(() => setLoading(false));
  }, []);

  const roleMap = {};
  (data?.roleBreakdown || []).forEach((r) => { roleMap[r._id] = r.count; });

  const courseStatusData = (data?.courseStatusBreakdown || []).map((c) => ({
    name: c._id?.replace("_", " ") || "unknown",
    value: c.count,
  }));

  const kpis = [
    { label: "Active Users (7 days)", value: (data?.activeUserCount || 0).toLocaleString(), color: "rgba(34,197,94,0.2)", icon: Activity },
    { label: "Total Students", value: (roleMap.student || 0).toLocaleString(), color: "rgba(56,189,248,0.2)", icon: Users },
    { label: "Total Teachers", value: (roleMap.teacher || 0).toLocaleString(), color: "rgba(249,115,22,0.2)", icon: Users },
    { label: "Retention Rate", value: `${data?.retentionRate || 0}%`, color: "rgba(167,139,250,0.2)", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Platform Analytics</h1>
          <p className="mt-2 text-white/60">User growth, enrollments, course performance, and retention metrics</p>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiBox key={k.label} {...k} loading={loading} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="User Growth" subtitle="Students & teachers registered over time" loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.userGrowthChart || []}>
              <defs>
                <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTeachers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
              <ChartTooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="students" stroke="#22c55e" fill="url(#gradStudents)" strokeWidth={2.5} name="Students" />
              <Area type="monotone" dataKey="teachers" stroke="#f97316" fill="url(#gradTeachers)" strokeWidth={2.5} name="Teachers" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Enrollment Trends" subtitle="New enrollments and completions over time" loading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.enrollmentChart || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
              <ChartTooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="enrollments" fill="#38bdf8" radius={[8, 8, 0, 0]} name="Enrollments" />
              <Bar dataKey="completed" fill="#22c55e" radius={[8, 8, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Course Status Distribution" subtitle="Breakdown of all courses by status" loading={loading} height={240}>
          <div className="flex items-center gap-6 h-full">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={courseStatusData} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {courseStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <ChartTooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {courseStatusData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="capitalize text-white/60">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Top Courses by Enrollment" subtitle="Best-performing courses on the platform" loading={loading} height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.topCoursesByEnrollment || []} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.07)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
              <YAxis dataKey="title" type="category" width={120} stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false}
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.55)" }} />
              <ChartTooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="enrollments" fill="#a78bfa" radius={[0, 8, 8, 0]} name="Enrollments" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Retention summary */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-6`}>
        <h3 className="mb-4 font-semibold">Completion & Retention</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Completion Rate", value: `${data?.retentionRate || 0}%`, desc: "Students who completed at least 1 course", color: "#22c55e" },
            { label: "Active Sessions (7d)", value: (data?.activeUserCount || 0).toLocaleString(), desc: "Users with recent login activity", color: "#38bdf8" },
            { label: "Total Enrollments", value: (data?.enrollmentChart?.reduce((a, c) => a + c.enrollments, 0) || 0).toLocaleString(), desc: "Cumulative enrollments in period", color: "#f97316" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-white/50">{item.label}</p>
              {loading ? (
                <Skeleton variant="text" width={80} height={36} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
              ) : (
                <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
              )}
              <p className="mt-1 text-xs text-white/35">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PlatformAnalytics;
