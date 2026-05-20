import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import {
  BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip as ChartTooltip, XAxis, YAxis, AreaChart, Area,
} from "recharts";
import { BarChart3, BookOpen, TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TOOLTIP_STYLE = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };
const BAR_COLORS = ["#22c55e", "#38bdf8", "#f97316", "#a78bfa", "#fde68a"];

const ContentAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getContentAnalytics()
      .then(({ data: res }) => setData(res.analytics))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {};
  const topCourses = data?.topCourses || [];
  const lessonAnalytics = data?.lessonAnalytics || [];
  const weeklyTrend = data?.weeklyTrend || [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Content Analytics</h1>
          <p className="mt-2 text-white/60">Lesson performance, enrollment trends, and course engagement</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Courses", value: summary.totalCourses || 0, color: "rgba(34,197,94,0.2)", icon: BookOpen },
          { label: "Published Courses", value: summary.publishedCourses || 0, color: "rgba(56,189,248,0.2)", icon: TrendingUp },
          { label: "Total Lessons", value: summary.totalLessons || 0, color: "rgba(167,139,250,0.2)", icon: BarChart3 },
          { label: "Total Enrollments", value: summary.totalEnrollments || 0, color: "rgba(249,115,22,0.2)", icon: Users },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-[22px] ${glass} p-5`}>
              <div className="rounded-xl p-2.5 w-fit" style={{ background: s.color }}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="mt-3 text-sm text-white/50">{s.label}</p>
              {loading ? <Skeleton variant="text" width={80} height={36} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} /> : (
                <p className="mt-1 text-2xl font-bold">{s.value.toLocaleString()}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Top Courses by Enrollment */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Top Courses by Enrollment</p>
          {loading ? <Skeleton variant="rounded" height={240} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} /> : (
            <div style={{ height: 240 }} className="w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCourses.map((c) => ({ name: c.title?.slice(0, 18) + (c.title?.length > 18 ? "…" : ""), enrollments: c.totalStudents }))} layout="vertical">
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={130} stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false}
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} />
                  <ChartTooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="enrollments" radius={[0, 6, 6, 0]} name="Enrollments">
                    {topCourses.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Weekly Enrollment Trend */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Weekly Enrollment Trend</p>
          {loading ? <Skeleton variant="rounded" height={240} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} /> : (
            <div style={{ height: 240 }} className="w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="caGradEnroll" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="caGradComplete" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={10}
                    tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="enrollments" stroke="#38bdf8" fill="url(#caGradEnroll)" strokeWidth={2.5} name="Enrollments" />
                  <Area type="monotone" dataKey="completions" stroke="#22c55e" fill="url(#caGradComplete)" strokeWidth={2} name="Completions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Course Performance Table */}
      <div className={`rounded-[24px] ${glass} p-6`}>
        <p className="mb-4 font-semibold">Course Performance</p>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={52} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
          </div>
        ) : (data?.courses || []).length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">No course data yet</p>
        ) : (
          <div className="space-y-2">
            {(data.courses || []).slice(0, 10).map((c, i) => (
              <motion.div key={c._id || i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <div className="flex gap-3 text-xs text-white/40">
                    <span>{c.lessonCount} lessons</span>
                    <span>{c.quizCount} quizzes</span>
                    <span className={c.status === "published" ? "text-emerald-400" : "text-white/30"}>{c.status}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm shrink-0">
                  <div className="text-center">
                    <p className="font-bold text-sky-300">{c.totalStudents}</p>
                    <p className="text-xs text-white/35">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-violet-300">{c.avgProgress}%</p>
                    <p className="text-xs text-white/35">Avg Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-emerald-300">{c.completionRate}%</p>
                    <p className="text-xs text-white/35">Completion</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Top Lessons */}
      {lessonAnalytics.length > 0 && (
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Top Lessons by Estimated Views</p>
          <div className="space-y-2">
            {lessonAnalytics.slice(0, 10).map((l, i) => (
              <div key={l.lessonId || i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <span className="w-5 text-center text-xs text-white/30">{i+1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{l.lessonTitle}</p>
                  <p className="truncate text-xs text-white/35">{l.courseTitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold" style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>{l.estimatedViews}</p>
                  <p className="text-xs text-white/35">est. views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentAnalytics;
