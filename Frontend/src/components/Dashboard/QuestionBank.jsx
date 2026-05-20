import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Pagination, Select, Skeleton, TextField, Tooltip,
} from "@mui/material";
import { Edit, HelpCircle, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const DIFFICULTY_COLORS = {
  easy: { bg: "rgba(34,197,94,0.15)", color: "#86efac" },
  medium: { bg: "rgba(251,191,36,0.15)", color: "#fde68a" },
  hard: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5" },
};

const TYPE_LABELS = { mcq: "MCQ", true_false: "T/F", short_answer: "Short", long_answer: "Long" };

const EMPTY = { question: "", type: "mcq", options: ["", "", "", ""], correctAnswer: "", explanation: "", difficulty: "medium", subject: "", tags: "" };

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ type: "", difficulty: "", search: "" });
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filters.type) params.type = filters.type;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.search) params.search = filters.search;
      const { data } = await teacherApi.getQuestions(params);
      setQuestions(data.questions || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch { toast.error("Failed to load questions"); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
  useEffect(() => {
    teacherApi.getQuestionStats().then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (q) => {
    setEditing(q);
    setForm({ question: q.question, type: q.type, options: q.options?.length ? q.options : ["","","",""], correctAnswer: q.correctAnswer || "", explanation: q.explanation || "", difficulty: q.difficulty, subject: q.subject || "", tags: (q.tags || []).join(", ") });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) { toast.error("Question required"); return; }
    try {
      setSaving(true);
      const payload = { ...form, tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [] };
      if (editing) {
        await teacherApi.updateQuestion(editing._id, payload);
        toast.success("Question updated");
      } else {
        await teacherApi.createQuestion(payload);
        toast.success("Question added");
      }
      setDialog(false);
      fetchQuestions();
      teacherApi.getQuestionStats().then(({ data }) => setStats(data.stats)).catch(() => {});
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (q) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await teacherApi.deleteQuestion(q._id);
      toast.success("Question deleted");
      fetchQuestions();
    } catch { toast.error("Delete failed"); }
  };

  const updateOption = (oi, val) => { const opts = [...form.options]; opts[oi] = val; setForm((p) => ({ ...p, options: opts })); };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Question Bank</h1>
            <p className="mt-2 text-white/60">Reusable question repository for quizzes and exams</p>
          </div>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#38bdf8,#0284c7)", fontWeight: 700, whiteSpace: "nowrap" }}>
            Add Question
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm">
            Total: <span className="font-bold">{stats.total}</span>
          </div>
          {(stats.byType || []).map((t) => (
            <div key={t._id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm">
              {TYPE_LABELS[t._id] || t._id}: <span className="font-bold">{t.count}</span>
            </div>
          ))}
          {(stats.byDifficulty || []).map((d) => {
            const dc = DIFFICULTY_COLORS[d._id] || DIFFICULTY_COLORS.medium;
            return (
              <div key={d._id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm capitalize" style={{ color: dc.color }}>
                {d._id}: <span className="font-bold">{d.count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className={`rounded-[24px] ${glass} p-5`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField placeholder="Search questions..." value={filters.search}
            onChange={(e) => { setFilters((p) => ({ ...p, search: e.target.value })); setPage(1); }}
            size="small" InputProps={{ startAdornment: <Search size={14} className="mr-2 text-white/40" />, sx: { color: "white" } }} />
          <FormControl size="small">
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Type</InputLabel>
            <Select value={filters.type} onChange={(e) => { setFilters((p) => ({ ...p, type: e.target.value })); setPage(1); }} label="Type" sx={{ color: "white" }}>
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Difficulty</InputLabel>
            <Select value={filters.difficulty} onChange={(e) => { setFilters((p) => ({ ...p, difficulty: e.target.value })); setPage(1); }} label="Difficulty" sx={{ color: "white" }}>
              <MenuItem value="">All</MenuItem>
              {["easy","medium","hard"].map((d) => <MenuItem key={d} value={d} sx={{ textTransform: "capitalize" }}>{d}</MenuItem>)}
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : questions.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <HelpCircle size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No questions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => {
            const dc = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.medium;
            return (
              <motion.div key={q._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`rounded-[20px] ${glass} px-5 py-4`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Chip label={TYPE_LABELS[q.type] || q.type} size="small" sx={{ bgcolor: "rgba(56,189,248,0.15)", color: "#7dd3fc", fontSize: 10, fontWeight: 700 }} />
                      <Chip label={q.difficulty} size="small" sx={{ bgcolor: dc.bg, color: dc.color, fontSize: 10, fontWeight: 700, textTransform: "capitalize" }} />
                      {q.subject && <Chip label={q.subject} size="small" sx={{ bgcolor: "rgba(167,139,250,0.15)", color: "#c4b5fd", fontSize: 10 }} />}
                      {(q.tags || []).map((t) => <Chip key={t} label={t} size="small" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 10 }} />)}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(q)} sx={{ color: "rgba(255,255,255,0.6)" }}>
                        <Edit size={14} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(q)} sx={{ color: "rgba(239,68,68,0.6)" }}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </div>
      )}

      {/* Question Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Question" : "Add Question"}</DialogTitle>
        <DialogContent>
          <div className="mt-2 space-y-4">
            <TextField fullWidth multiline rows={3} label="Question *" value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <div className="grid grid-cols-2 gap-4">
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Type</InputLabel>
                <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} label="Type" sx={{ color: "white" }}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Difficulty</InputLabel>
                <Select value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))} label="Difficulty" sx={{ color: "white" }}>
                  {["easy","medium","hard"].map((d) => <MenuItem key={d} value={d} sx={{ textTransform: "capitalize" }}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            {form.type === "mcq" && (
              <div className="space-y-2">
                {form.options.map((o, oi) => (
                  <TextField key={oi} fullWidth label={`Option ${oi+1}`} value={o} onChange={(e) => updateOption(oi, e.target.value)}
                    size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
                ))}
              </div>
            )}
            {form.type !== "long_answer" && (
              <TextField fullWidth label="Correct Answer" value={form.correctAnswer} onChange={(e) => setForm((p) => ({ ...p, correctAnswer: e.target.value }))}
                size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            )}
            <TextField fullWidth label="Explanation (optional)" value={form.explanation} onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <div className="grid grid-cols-2 gap-4">
              <TextField fullWidth label="Subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              <TextField fullWidth label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#38bdf8,#0284c7)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "Update" : "Add Question"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuestionBank;
