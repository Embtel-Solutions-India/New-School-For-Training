import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LinearProgress, Skeleton } from "@mui/material";
import {
  Award, BookOpen, CalendarClock, CheckCircle2, FileText, Flame, Star, TrendingUp,
} from "lucide-react";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";
import useAuthStore from "../../store/authStore";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TOOLTIP_STYLE = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };

const useCountUp = (target, duration = 1200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
};

const KpiCard = ({ icon: Icon, label, value, suffix = "", color, delay }) => {
  const count = useCountUp(typeof value === "number" ? value : 0);
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`rounded-[22px] ${glass} p-5`}>
      <div className="rounded-xl p-2.5 w-fit" style={{ background: color }}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="mt-3 text-sm text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {typeof value === "number" ? count : value}{suffix}
      </p>
    </motion.div>
  );
};

const StudentOverview = () => {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getOverview()
      .then(({ data: res }) => setData(res.overview))
      .catch(() => toast.error("Failed to load overview"))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data ? [
    { label: "Enrolled Courses", value: data.totalEnrolled, color: "rgba(56,189,248,0.2)", icon: BookOpen },
    { label: "Completed Courses", value: data.completedCourses, color: "rgba(34,197,94,0.2)", icon: CheckCircle2 },
    { label: "Avg Progress", value: data.avgProgress, suffix: "%", color: "rgba(167,139,250,0.2)", icon: TrendingUp },
    { label: "Certificates Earned", value: data.certificates, color: "rgba(251,191,36,0.2)", icon: Award },
    { label: "Upcoming Classes", value: data.upcomingClasses, color: "rgba(249,115,22,0.2)", icon: CalendarClock },
    { label: "Pending Assignments", value: data.pendingAssignments, color: "rgba(239,68,68,0.2)", icon: FileText },
    { label: "Learning Streak", value: data.learningStreak, suffix: "d", color: "rgba(251,146,60,0.2)", icon: Flame },
    { label: "Achievement Points", value: data.achievementPoints, color: "rgba(52,211,153,0.2)", icon: Star },
  ] : [];

  const weeklyChart = (data?.weeklyProgress || []).map((w, i) => ({
    name: `Wk ${i + 1}`,
    lessons: w.lessons,
  }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Learning Command Center</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome back, {user?.name?.split(" ")[0]}!</h1>
            <p className="mt-2 text-white/60">Track your progress, stay on streak, and keep learning.</p>
          </div>
          {data && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <p className="text-3xl font-bold text-orange-300">{data.learningStreak}d</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Flame size={14} className="text-orange-400" />
                <p className="text-xs text-white/50">Learning Streak</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={110} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
          ))
          : kpis.map((k, i) => <KpiCard key={k.label} {...k} delay={i * 0.05} />)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Weekly Progress Chart */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Weekly Learning Activity</p>
          {loading ? (
            <Skeleton variant="rounded" height={220} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
          ) : weeklyChart.length === 0 ? (
            <div className="py-16 text-center text-white/40">
              <TrendingUp size={36} className="mx-auto mb-2 opacity-30" />
              <p>Start completing lessons to see your progress!</p>
            </div>
          ) : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChart}>
                  <defs>
                    <linearGradient id="lessonGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="lessons" stroke="#22c55e" fill="url(#lessonGrad)" strokeWidth={2.5} name="Lessons" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Courses */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Continue Learning</p>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={72} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
            </div>
          ) : (data?.recentCourses || []).length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
              <p>No enrolled courses yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data.recentCourses || []).map((e, i) => (
                <motion.div key={e._id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center gap-3">
                    {e.course?.thumbnail && (
                      <img src={e.course.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.course?.title}</p>
                      <p className="text-xs text-white/40">{e.progress || 0}% complete</p>
                    </div>
                  </div>
                  <LinearProgress variant="determinate" value={e.progress || 0} className="!mt-2 !h-1.5 !rounded-full !bg-white/10" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Live Classes */}
      {(data?.upcomingLive || []).length > 0 && (
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Upcoming Live Classes</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {data.upcomingLive.map((cls) => (
              <div key={cls._id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-2 w-2 rounded-full ${cls.status === "live" ? "bg-red-400 animate-pulse" : "bg-emerald-400"}`} />
                  <span className="text-xs capitalize font-semibold text-white/60">{cls.status}</span>
                </div>
                <p className="text-sm font-medium">{cls.title}</p>
                <p className="text-xs text-white/40 mt-1">{cls.course?.title}</p>
                <p className="text-xs text-white/40">{new Date(cls.scheduledAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {(data?.recentActivity || []).length > 0 && (
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Recent Activity</p>
          <div className="space-y-2">
            {data.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{a.title}</p>
                  <p className="text-xs text-white/40">{a.meta}</p>
                </div>
                <p className="shrink-0 text-xs text-white/30">{new Date(a.time).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOverview;
