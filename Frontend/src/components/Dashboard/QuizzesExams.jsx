import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Select, Skeleton, TextField, Tooltip,
} from "@mui/material";
import { ClipboardCheck, Edit, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const QTYPES = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
];

const EMPTY_QUESTION = { prompt: "", type: "mcq", options: ["", "", "", ""], answer: "", points: 1 };
const EMPTY_QUIZ = { title: "", description: "", timeLimit: 0, passingScore: 60, questions: [] };

const QuizQuestion = ({ q, idx, onChange, onRemove }) => {
  const update = (field, val) => onChange(idx, { ...q, [field]: val });
  const updateOption = (oi, val) => { const opts = [...q.options]; opts[oi] = val; onChange(idx, { ...q, options: opts }); };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start gap-2">
        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{idx + 1}</span>
        <div className="flex-1 space-y-3">
          <TextField fullWidth label="Question *" value={q.prompt} onChange={(e) => update("prompt", e.target.value)}
            size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          <div className="grid grid-cols-2 gap-3">
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Type</InputLabel>
              <Select value={q.type} onChange={(e) => update("type", e.target.value)} label="Type" sx={{ color: "white" }}>
                {QTYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Points" type="number" value={q.points} onChange={(e) => update("points", parseInt(e.target.value) || 1)}
              size="small" inputProps={{ min: 1 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          </div>
          {q.type === "mcq" && (
            <div className="space-y-2">
              <p className="text-xs text-white/50">Options (enter the correct answer in the Answer field below)</p>
              {q.options.map((opt, oi) => (
                <TextField key={oi} fullWidth label={`Option ${oi + 1}`} value={opt} onChange={(e) => updateOption(oi, e.target.value)}
                  size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              ))}
            </div>
          )}
          {q.type === "true_false" && (
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Correct Answer</InputLabel>
              <Select value={q.answer} onChange={(e) => update("answer", e.target.value)} label="Correct Answer" sx={{ color: "white" }}>
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </Select>
            </FormControl>
          )}
          {(q.type === "mcq" || q.type === "short_answer") && (
            <TextField fullWidth label="Correct Answer" value={q.answer} onChange={(e) => update("answer", e.target.value)}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          )}
          {q.type === "long_answer" && (
            <p className="text-xs text-white/40 italic">Long answer — will require manual grading</p>
          )}
        </div>
        <IconButton size="small" onClick={() => onRemove(idx)} sx={{ color: "rgba(239,68,68,0.6)" }}>
          <Trash2 size={13} />
        </IconButton>
      </div>
    </div>
  );
};

const QuizzesExams = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [form, setForm] = useState(EMPTY_QUIZ);
  const [saving, setSaving] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await teacherApi.getCourses();
      const list = data.courses || [];
      setCourses(list);
      if (list.length > 0 && !selectedCourse) setSelectedCourse(list[0]);
    } catch { toast.error("Failed to load courses"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const quizzes = selectedCourse?.curriculum?.quizzes || [];

  const openCreate = () => { setEditingQuiz(null); setForm(EMPTY_QUIZ); setDialog(true); };
  const openEdit = (quiz) => {
    setEditingQuiz(quiz);
    setForm({ title: quiz.title, description: quiz.description || "", timeLimit: quiz.timeLimit || 0, passingScore: quiz.passingScore || 60, questions: quiz.questions || [] });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Quiz title required"); return; }
    if (!selectedCourse) { toast.error("Select a course"); return; }
    if (form.questions.length === 0) { toast.error("Add at least one question"); return; }
    try {
      setSaving(true);
      if (editingQuiz) {
        await teacherApi.updateQuiz(selectedCourse._id, editingQuiz._id, form);
        toast.success("Quiz updated");
      } else {
        await teacherApi.createQuiz(selectedCourse._id, form);
        toast.success("Quiz created");
      }
      setDialog(false);
      const { data } = await teacherApi.getCourses();
      const updated = (data.courses || []).find((c) => c._id === selectedCourse._id);
      if (updated) { setSelectedCourse(updated); setCourses(data.courses || []); }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (quiz) => {
    if (!window.confirm(`Delete quiz "${quiz.title}"?`)) return;
    try {
      await teacherApi.deleteQuiz(selectedCourse._id, quiz._id);
      toast.success("Quiz deleted");
      const { data } = await teacherApi.getCourses();
      const updated = (data.courses || []).find((c) => c._id === selectedCourse._id);
      if (updated) { setSelectedCourse(updated); setCourses(data.courses || []); }
    } catch { toast.error("Delete failed"); }
  };

  const addQuestion = () => setForm((p) => ({ ...p, questions: [...p.questions, { ...EMPTY_QUESTION }] }));
  const removeQuestion = (idx) => setForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== idx) }));
  const updateQuestion = (idx, q) => setForm((p) => { const qs = [...p.questions]; qs[idx] = q; return { ...p, questions: qs }; });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Quizzes & Exams</h1>
            <p className="mt-2 text-white/60">Create assessments with multiple question types</p>
          </div>
          {selectedCourse && (
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}
              sx={{ borderRadius: 3, background: "linear-gradient(135deg,#f97316,#ea580c)", fontWeight: 700, whiteSpace: "nowrap" }}>
              New Quiz
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Course Selector */}
        <div className={`rounded-[24px] ${glass} p-4`}>
          <p className="mb-3 text-sm font-semibold text-white/60">Select Course</p>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={44} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
            </div>
          ) : (
            <div className="space-y-1">
              {courses.map((c) => (
                <button key={c._id} onClick={() => setSelectedCourse(c)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedCourse?._id === c._id ? "bg-orange-500/20 text-orange-200 font-semibold" : "text-white/60 hover:bg-white/[0.06]"}`}>
                  <p className="truncate">{c.title}</p>
                  <p className="text-xs text-white/35">{c.curriculum?.quizzes?.length || 0} quizzes</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quizzes List */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          {!selectedCourse ? (
            <p className="py-12 text-center text-white/40">Select a course to manage quizzes</p>
          ) : quizzes.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardCheck size={36} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/40">No quizzes yet. Create your first quiz!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz, i) => (
                <motion.div key={quiz._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{quiz.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/40">
                        <span>{(quiz.questions || []).length} questions</span>
                        {quiz.timeLimit > 0 && <span>{quiz.timeLimit} min limit</span>}
                        {quiz.passingScore && <span>Pass: {quiz.passingScore}%</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {QTYPES.filter((t) => quiz.questions?.some((q) => q.type === t.value)).map((t) => (
                          <Chip key={t.value} label={t.label} size="small"
                            sx={{ bgcolor: "rgba(249,115,22,0.15)", color: "#fdba74", fontSize: 10, fontWeight: 700 }} />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(quiz)} sx={{ color: "rgba(255,255,255,0.6)" }}>
                          <Edit size={14} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(quiz)} sx={{ color: "rgba(239,68,68,0.6)" }}>
                          <Trash2 size={14} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingQuiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
        <DialogContent>
          <div className="mt-2 space-y-4">
            <TextField fullWidth label="Quiz Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <div className="grid grid-cols-2 gap-4">
              <TextField fullWidth label="Time Limit (min, 0 = no limit)" type="number" value={form.timeLimit}
                onChange={(e) => setForm((p) => ({ ...p, timeLimit: parseInt(e.target.value) || 0 }))}
                size="small" inputProps={{ min: 0 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              <TextField fullWidth label="Passing Score (%)" type="number" value={form.passingScore}
                onChange={(e) => setForm((p) => ({ ...p, passingScore: parseInt(e.target.value) || 60 }))}
                size="small" inputProps={{ min: 0, max: 100 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Questions ({form.questions.length})</p>
              <Button size="small" startIcon={<Plus size={14} />} onClick={addQuestion} variant="outlined"
                sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.2)", color: "white", fontSize: 12 }}>
                Add Question
              </Button>
            </div>
            {form.questions.length === 0 && (
              <p className="text-center text-sm text-white/40 py-4">No questions yet. Click "Add Question" to begin.</p>
            )}
            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
              {form.questions.map((q, idx) => (
                <QuizQuestion key={idx} q={q} idx={idx} onChange={updateQuestion} onRemove={removeQuestion} />
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#f97316,#ea580c)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editingQuiz ? "Update" : "Create Quiz"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default QuizzesExams;
