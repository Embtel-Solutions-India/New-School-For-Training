import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import {
  Activity,
  BookOpen,
  DollarSign,
  GraduationCap,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const useCountUp = (target, duration = 1200, enabled = true) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);

  return value;
};

const KpiCard = ({ label, value, rawValue, trend, color, icon: Icon, prefix = "", suffix = "", delay = 0, loading }) => {
  const animated = useCountUp(rawValue, 1400, !loading);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-[26px] ${glass} p-6 flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <div className={`rounded-2xl bg-gradient-to-br ${color} p-3`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/70">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-white/50">{label}</p>
        {loading ? (
          <Skeleton variant="text" width={100} height={44} sx={{ bgcolor: "rgba(255,255,255,0.07)", mt: 0.5 }} />
        ) : (
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {prefix}{animated.toLocaleString()}{suffix}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const RecentEnrollmentRow = ({ enrollment, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.05 * index }}
    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
  >
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-white">
      {enrollment.user?.name?.[0] || "?"}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-white">{enrollment.user?.name || "Unknown"}</p>
      <p className="truncate text-xs text-white/45">{enrollment.course?.title || "—"}</p>
    </div>
    <div className="text-right">
      <p className="text-xs font-semibold text-emerald-300">
        ${enrollment.payment?.amount?.toLocaleString() || 0}
      </p>
    </div>
  </motion.div>
);

const AdminOverview = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getDashboardSummary()
      .then(({ data }) => {
        if (mounted) setSummary(data.summary);
      })
      .catch(() => {
        if (mounted) setError("Failed to load dashboard metrics");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const kpis = [
    {
      label: "Total Registered Students",
      rawValue: summary?.totalStudents || 0,
      trend: `+${summary?.newUsersThisWeek || 0} this week`,
      color: "from-emerald-400 to-teal-500",
      icon: Users,
    },
    {
      label: "Students Enrolled in Courses",
      rawValue: summary?.studentsEnrolled || 0,
      trend: `${summary?.totalCourseSales || 0} sales`,
      color: "from-cyan-400 to-blue-500",
      icon: UserCheck,
    },
    {
      label: "Total Teachers",
      rawValue: summary?.totalTeachers || 0,
      trend: "Active",
      color: "from-orange-400 to-amber-500",
      icon: GraduationCap,
    },
    {
      label: "Total Courses",
      rawValue: summary?.totalCourses || 0,
      trend: `${summary?.publishedCourses || 0} published`,
      color: "from-violet-400 to-purple-500",
      icon: BookOpen,
    },
    {
      label: "Total Revenue",
      rawValue: summary?.totalRevenue || 0,
      prefix: "$",
      trend: "All time",
      color: "from-rose-400 to-pink-500",
      icon: DollarSign,
    },
    {
      label: "Active Users (7 days)",
      rawValue: summary?.activeUsers || 0,
      trend: "Last 7 days",
      color: "from-lime-400 to-green-500",
      icon: Activity,
    },
    {
      label: "Total Course Sales",
      rawValue: summary?.totalCourseSales || 0,
      trend: "Completed",
      color: "from-sky-400 to-indigo-500",
      icon: ShoppingCart,
    },
    {
      label: "Pending Approvals",
      rawValue: summary?.pendingApprovals || 0,
      trend: "Needs review",
      color: "from-yellow-400 to-orange-500",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Platform control
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Dashboard Overview</h1>
            <p className="mt-2 text-white/60">Real-time platform metrics from MongoDB</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
            {loading ? (
              <Skeleton variant="text" width={120} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
            ) : (
              <>
                <p className="text-xs text-white/45">Total Platform Users</p>
                <p className="text-2xl font-bold">{(summary?.totalUsers || 0).toLocaleString()}</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} delay={i * 0.07} loading={loading} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`rounded-[28px] ${glass} p-6`}>
          <h3 className="mb-4 text-lg font-semibold">Recent Enrollments</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={56} sx={{ bgcolor: "rgba(255,255,255,0.07)", borderRadius: 3 }} />
              ))}
            </div>
          ) : (summary?.recentEnrollments?.length || 0) > 0 ? (
            <div className="space-y-3">
              {summary.recentEnrollments.map((e, i) => (
                <RecentEnrollmentRow key={e._id || i} enrollment={e} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-white/40">No recent enrollments</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className={`rounded-[28px] ${glass} p-6`}>
          <h3 className="mb-4 text-lg font-semibold">Platform Status</h3>
          <div className="space-y-4">
            {[
              { label: "Published Courses", value: summary?.publishedCourses || 0, max: summary?.totalCourses || 1, color: "#22c55e" },
              { label: "Active Users", value: summary?.activeUsers || 0, max: summary?.totalUsers || 1, color: "#38bdf8" },
              { label: "Students Enrolled", value: summary?.studentsEnrolled || 0, max: summary?.totalStudents || 1, color: "#f97316" },
            ].map((item) => {
              const pct = Math.min(100, Math.round((item.value / item.max) * 100)) || 0;
              return (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-white/60">{item.label}</span>
                    {loading ? (
                      <Skeleton variant="text" width={60} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
                    ) : (
                      <span className="font-semibold">{item.value.toLocaleString()} <span className="text-white/40">({pct}%)</span></span>
                    )}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: loading ? "0%" : `${pct}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 space-y-3">
            {[
              { label: "Total Users", value: summary?.totalUsers || 0 },
              { label: "Suspended Users", value: summary?.suspendedUsers || 0 },
              { label: "New Users (7 days)", value: summary?.newUsersThisWeek || 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-sm text-white/60">{item.label}</span>
                {loading ? (
                  <Skeleton variant="text" width={50} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
                ) : (
                  <span className="font-bold">{item.value.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOverview;
