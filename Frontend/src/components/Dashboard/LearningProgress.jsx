import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LinearProgress, Skeleton } from "@mui/material";
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from "recharts";
import { BookOpen, CheckCircle2, Flame, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TS = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };
const DAY_COLORS = ["#22c55e", "#38bdf8", "#a78bfa", "#f97316", "#fde68a", "#f43f5e", "#34d399"];

const LearningProgress = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getLearningProgress()
      .then(({ data: res }) => setData(res.progress))
      .catch(() => toast.error("Failed to load progress"))
      .finally(() => setLoading(false));
  }, []);

  const stats = data ? [
    { label: "Total Enrolled", value: data.totalEnrolled, color: "rgba(56,189,248,0.2)", icon: BookOpen },
    { label: "Completed Courses", value: data.completedCourses, color: "rgba(34,197,94,0.2)", icon: CheckCircle2 },
    { label: "Avg Progress", value: `${data.avgProgress}%`, color: "rgba(167,139,250,0.2)", icon: TrendingUp },
    { label: "Day Streak", value: `${data.learningStreak}d`, color: "rgba(251,146,60,0.2)", icon: Flame },
  ] : [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <h1 className="text-3xl font-bold sm:text-4xl">Learning Progress</h1>
        <p className="mt-2 text-white/60">Track your study patterns, streaks, and course completion rates</p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={100} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)
          : stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-[22px] ${glass} p-5`}>
                <div className="rounded-xl p-2.5 w-fit" style={{ background: s.color }}>
                  <Icon size={18} className="text-white" />
                </div>
                <p className="mt-3 text-sm text-white/50">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </motion.div>
            );
          })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Daily Activity */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Daily Activity (Last 7 Days)</p>
          {loading ? <Skeleton variant="rounded" height={220} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} /> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.dailyActivity || []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TS} />
                  <Bar dataKey="lessons" radius={[6, 6, 0, 0]} name="Lessons">
                    {(data?.dailyActivity || []).map((_, i) => <Cell key={i} fill={DAY_COLORS[i % DAY_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Weekly Trend */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Weekly Learning Trend</p>
          {loading ? <Skeleton variant="rounded" height={220} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} /> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(data?.weeklyLessons || []).map((w, i) => ({ week: `Wk ${i + 1}`, lessons: w.lessons }))}>
                  <defs>
                    <linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TS} />
                  <Area type="monotone" dataKey="lessons" stroke="#38bdf8" fill="url(#wkGrad)" strokeWidth={2.5} name="Lessons" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Course Progress Breakdown */}
      <div className={`rounded-[24px] ${glass} p-6`}>
        <p className="mb-4 font-semibold">Course Progress Breakdown</p>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
          </div>
        ) : (data?.courseProgress || []).length === 0 ? (
          <p className="text-center py-8 text-white/40">No enrolled courses</p>
        ) : (
          <div className="space-y-3">
            {(data.courseProgress || []).map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium truncate max-w-[60%]">{c.title}</p>
                  <div className="flex items-center gap-2">
                    {c.isCompleted && <CheckCircle2 size={14} className="text-emerald-400" />}
                    <span className="text-sm font-bold" style={{ color: c.isCompleted ? "#22c55e" : "#38bdf8" }}>{c.progress}%</span>
                  </div>
                </div>
                <LinearProgress variant="determinate" value={c.progress}
                  sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { bgcolor: c.isCompleted ? "#22c55e" : "#38bdf8" } }} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Stats */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Quiz Attempts", value: data.quizAttempts, color: "rgba(167,139,250,0.15)", textColor: "#c4b5fd" },
            { label: "Avg Quiz Score", value: `${data.quizAvgScore}%`, color: "rgba(56,189,248,0.15)", textColor: "#7dd3fc" },
            { label: "Quizzes Passed", value: data.quizPassed, color: "rgba(34,197,94,0.15)", textColor: "#86efac" },
          ].map((s) => (
            <div key={s.label} className={`rounded-[20px] ${glass} p-5 text-center`}>
              <p className="text-2xl font-bold" style={{ color: s.textColor }}>{s.value}</p>
              <p className="text-sm text-white/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningProgress;
