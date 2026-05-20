import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pagination, Skeleton } from "@mui/material";
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TS = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };

const QuizHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await studentApi.getQuizHistory({ page, limit: 15 });
      setAttempts(data.attempts || []);
      setTotalPages(data.pagination?.pages || 1);
      if (data.stats) setStats(data.stats);
    } catch { toast.error("Failed to load quiz history"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const chartData = attempts.slice(0, 10).map((a, i) => ({
    name: `Q${attempts.length - i}`,
    score: a.percentage,
  })).reverse();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Quiz History</h1>
            <p className="mt-2 text-white/60">Your quiz attempts, scores, and performance trends</p>
          </div>
          {stats && (
            <div className="flex gap-3">
              {[
                { label: "Attempts", value: stats.total || 0, color: "#7dd3fc" },
                { label: "Avg Score", value: `${Math.round(stats.avgScore || 0)}%`, color: "#86efac" },
                { label: "Best Score", value: `${Math.round(stats.best || 0)}%`, color: "#fde68a" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                  <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Score trend chart */}
      {!loading && chartData.length > 0 && (
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Recent Score Trend</p>
          <div style={{ height: 200 }} className="w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={TS} formatter={(v) => [`${v}%`, "Score"]} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.score >= 60 ? "#22c55e" : "#ef4444"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Attempts List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : attempts.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <ClipboardCheck size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No quiz attempts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt, i) => (
            <motion.div key={attempt._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`rounded-[20px] ${glass} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${attempt.passed ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                    {attempt.passed
                      ? <CheckCircle2 size={18} className="text-emerald-400" />
                      : <XCircle size={18} className="text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{attempt.quizTitle || "Quiz"}</p>
                    <p className="text-xs text-white/40">{attempt.course?.title}</p>
                    <p className="text-xs text-white/30">{new Date(attempt.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: attempt.passed ? "#22c55e" : "#ef4444" }}>{attempt.percentage}%</p>
                  <p className="text-xs text-white/40">{attempt.score}/{attempt.maxScore} pts</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${attempt.passed ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}>
                    {attempt.passed ? "Passed" : "Failed"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </div>
      )}
    </div>
  );
};

export default QuizHistory;
