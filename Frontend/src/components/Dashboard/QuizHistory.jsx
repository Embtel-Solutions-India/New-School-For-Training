import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  LinearProgress, Pagination, Skeleton, Tab, Tabs, TextField,
} from "@mui/material";
import { BarChart, Bar, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CheckCircle2, ClipboardCheck, Clock, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TS = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };

// ── Quiz-taking modal ─────────────────────────────────────────────────────────

const QuizModal = ({ quiz, open, onClose, onDone }) => {
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open || !quiz) return;
    setResult(null);
    setAnswers([]);

    const load = async () => {
      try {
        setLoadingQ(true);
        const { data } = await studentApi.getCourseQuizzes(quiz.course._id);
        const found = (data.quizzes || []).find((q) => q._id === quiz._id || q._id?.toString() === quiz._id?.toString());
        const qs = found?.questions || [];
        setQuestions(qs);
        setAnswers(qs.map(() => ({ selected: "" })));
        if (quiz.timeLimit > 0) setTimeLeft(quiz.timeLimit * 60);
        else setTimeLeft(null);
      } catch {
        toast.error("Failed to load quiz questions");
      } finally {
        setLoadingQ(false);
      }
    };
    load();
  }, [open, quiz]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, result]);

  const handleSubmit = async (auto = false) => {
    if (!auto && !window.confirm("Submit quiz now?")) return;
    clearTimeout(timerRef.current);
    try {
      setSubmitting(true);
      const { data } = await studentApi.submitQuizAttempt(quiz.course._id, quiz._id, { answers, timeTaken: quiz.timeLimit > 0 ? quiz.timeLimit * 60 - (timeLeft || 0) : 0 });
      setResult(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (idx, val) => setAnswers((prev) => prev.map((a, i) => i === idx ? { selected: val } : a));

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const answered = answers.filter((a) => a.selected !== "").length;
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;

  return (
    <Dialog open={open} onClose={result ? onClose : undefined} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" } } }}>

      {result ? (
        <>
          <DialogTitle sx={{ fontWeight: 700 }}>Quiz Result</DialogTitle>
          <DialogContent sx={{ px: 3, pt: 3 }}>
            <div className="space-y-5">
              <div className={`rounded-[24px] p-6 text-center ${result.passed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                {result.passed
                  ? <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-400" />
                  : <XCircle size={48} className="mx-auto mb-3 text-red-400" />}
                <p className="text-4xl font-bold" style={{ color: result.passed ? "#22c55e" : "#ef4444" }}>{result.percentage}%</p>
                <p className="mt-1 text-white/60">{result.score}/{result.maxScore} correct</p>
                <p className="mt-2 text-lg font-semibold">{result.passed ? "Passed!" : "Not passed"}</p>
                <p className="text-xs text-white/40 mt-1">Passing score: {quiz.passingScore || 60}%</p>
              </div>

              {result.attempt?.answers?.length > 0 && (
                <div className="space-y-3">
                  <p className="font-semibold text-white/70">Review</p>
                  {questions.map((q, i) => {
                    const a = result.attempt.answers[i];
                    return (
                      <div key={i} className={`rounded-2xl border p-4 ${a?.correct ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                        <p className="text-sm font-semibold mb-1">{i + 1}. {q.prompt}</p>
                        <p className="text-xs text-white/50">Your answer: <span className="text-white">{a?.selected || "—"}</span></p>
                        {!a?.correct && q.answer && (
                          <p className="text-xs text-emerald-400">Correct: {q.answer}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => { onDone(); onClose(); }} variant="contained"
              sx={{ borderRadius: 3, background: "linear-gradient(135deg,#7dd3fc,#2563eb)", fontWeight: 700 }}>
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{quiz?.title}</span>
            {timeLeft !== null && (
              <span className={`flex items-center gap-1 text-base font-bold ${timeLeft < 60 ? "text-red-400" : "text-yellow-300"}`}>
                <Clock size={16} /> {fmt(timeLeft)}
              </span>
            )}
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: 1 }}>
            {loadingQ ? (
              <div className="space-y-3 pt-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={90} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
              </div>
            ) : (
              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>{answered}/{questions.length} answered</span>
                  <span>{quiz?.course?.title}</span>
                </div>
                <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4, bgcolor: "rgba(255,255,255,0.08)", "& .MuiLinearProgress-bar": { bgcolor: "#fbbf24" } }} />

                {questions.map((q, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
                    <p className="text-sm font-semibold">{i + 1}. {q.prompt}</p>

                    {q.type === "mcq" && (
                      <div className="space-y-2">
                        {(q.options || []).filter(Boolean).map((opt, oi) => (
                          <button key={oi} onClick={() => setAnswer(i, opt)}
                            className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition ${answers[i]?.selected === opt ? "bg-yellow-500/20 border border-yellow-400/40 text-yellow-200" : "bg-white/[0.03] border border-white/10 text-white/70 hover:bg-white/[0.07]"}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === "true_false" && (
                      <div className="flex gap-3">
                        {["true", "false"].map((val) => (
                          <button key={val} onClick={() => setAnswer(i, val)}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition ${answers[i]?.selected === val ? "bg-yellow-500/20 border border-yellow-400/40 text-yellow-200" : "bg-white/[0.03] border border-white/10 text-white/70 hover:bg-white/[0.07]"}`}>
                            {val}
                          </button>
                        ))}
                      </div>
                    )}

                    {(q.type === "short_answer" || q.type === "long_answer") && (
                      <TextField fullWidth size="small"
                        multiline={q.type === "long_answer"} rows={q.type === "long_answer" ? 3 : 1}
                        placeholder="Your answer..."
                        value={answers[i]?.selected || ""}
                        onChange={(e) => setAnswer(i, e.target.value)}
                        InputProps={{ sx: { color: "white" } }}
                        InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={onClose} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
            <Button onClick={() => handleSubmit(false)} variant="contained" disabled={submitting || loadingQ || questions.length === 0}
              sx={{ borderRadius: 3, background: "linear-gradient(135deg,#fbbf24,#d97706)", fontWeight: 700 }}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : "Submit Quiz"}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const QuizHistory = () => {
  const [tab, setTab] = useState("history");
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [takingQuiz, setTakingQuiz] = useState(null);

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

  const fetchAvailable = useCallback(async () => {
    try {
      setLoadingAvailable(true);
      const { data } = await studentApi.getAvailableQuizzes();
      setAvailableQuizzes(data.quizzes || []);
    } catch { toast.error("Failed to load available quizzes"); }
    finally { setLoadingAvailable(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { if (tab === "available") fetchAvailable(); }, [tab, fetchAvailable]);

  const chartData = attempts.slice(0, 10).map((a, i) => ({
    name: `Q${attempts.length - i}`,
    score: a.percentage,
  })).reverse();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Quizzes</h1>
            <p className="mt-2 text-white/60">Take quizzes and track your performance</p>
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

      <div className={`rounded-[28px] ${glass} overflow-hidden`}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", px: 3, "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontWeight: 600 }, "& .Mui-selected": { color: "white" }, "& .MuiTabs-indicator": { bgcolor: "#fbbf24" } }}>
          <Tab label="Quiz History" value="history" />
          <Tab label="Available Quizzes" value="available" />
        </Tabs>

        <div className="p-6">
          {tab === "history" ? (
            <>
              {!loading && chartData.length > 0 && (
                <div className="mb-6">
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

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
                </div>
              ) : attempts.length === 0 ? (
                <div className="py-12 text-center text-white/40">
                  <ClipboardCheck size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No quiz attempts yet. Take a quiz from the Available tab!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.map((attempt, i) => (
                    <motion.div key={attempt._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
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
                <div className="mt-6 flex justify-center">
                  <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
                </div>
              )}
            </>
          ) : (
            <>
              {loadingAvailable ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={88} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
                </div>
              ) : availableQuizzes.length === 0 ? (
                <div className="py-12 text-center text-white/40">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No quizzes available. Enroll in courses to see their quizzes here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableQuizzes.map((quiz, i) => (
                    <motion.div key={quiz._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-yellow-500/15">
                        <BookOpen size={18} className="text-yellow-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">{quiz.title}</p>
                        <p className="text-xs text-white/40">{quiz.course?.title}</p>
                        <div className="mt-1 flex gap-3 text-xs text-white/30">
                          <span>{quiz.questionCount} questions</span>
                          {quiz.timeLimit > 0 && (
                            <span className="flex items-center gap-1"><Clock size={10} /> {quiz.timeLimit} min</span>
                          )}
                          <span>Pass: {quiz.passingScore || 60}%</span>
                        </div>
                      </div>
                      <Button variant="contained" size="small" onClick={() => setTakingQuiz(quiz)}
                        sx={{ borderRadius: 2, background: "linear-gradient(135deg,#fbbf24,#d97706)", fontWeight: 700, whiteSpace: "nowrap" }}>
                        Start Quiz
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <QuizModal
        open={!!takingQuiz}
        quiz={takingQuiz}
        onClose={() => setTakingQuiz(null)}
        onDone={() => { fetchHistory(); setTab("history"); }}
      />
    </div>
  );
};

export default QuizHistory;
