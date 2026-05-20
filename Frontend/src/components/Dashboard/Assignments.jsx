import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Skeleton, TextField, Tooltip, FormControl, InputLabel, MenuItem, Select,
} from "@mui/material";
import { Edit, FileText, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const EMPTY = { title: "", instructions: "", dueDate: "", maxScore: 100 };

const Assignments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
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

  const assignments = selectedCourse?.curriculum?.assignments || [];

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (a) => {
    setEditing(a);
    const due = a.dueDate ? new Date(a.dueDate).toISOString().split("T")[0] : "";
    setForm({ title: a.title, instructions: a.instructions || "", dueDate: due, maxScore: a.maxScore || 100 });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    if (!selectedCourse) return;
    try {
      setSaving(true);
      if (editing) {
        await teacherApi.updateAssignment(selectedCourse._id, editing._id, form);
        toast.success("Assignment updated");
      } else {
        await teacherApi.createAssignment(selectedCourse._id, form);
        toast.success("Assignment created");
      }
      setDialog(false);
      const { data } = await teacherApi.getCourses();
      const updated = (data.courses || []).find((c) => c._id === selectedCourse._id);
      if (updated) { setSelectedCourse(updated); setCourses(data.courses || []); }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete assignment "${a.title}"?`)) return;
    try {
      await teacherApi.deleteAssignment(selectedCourse._id, a._id);
      toast.success("Deleted");
      const { data } = await teacherApi.getCourses();
      const updated = (data.courses || []).find((c) => c._id === selectedCourse._id);
      if (updated) { setSelectedCourse(updated); setCourses(data.courses || []); }
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Assignments</h1>
            <p className="mt-2 text-white/60">Create and manage course assignments with deadlines</p>
          </div>
          {selectedCourse && (
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}
              sx={{ borderRadius: 3, background: "linear-gradient(135deg,#fbbf24,#d97706)", fontWeight: 700, whiteSpace: "nowrap" }}>
              New Assignment
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
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedCourse?._id === c._id ? "bg-yellow-500/20 text-yellow-200 font-semibold" : "text-white/60 hover:bg-white/[0.06]"}`}>
                  <p className="truncate">{c.title}</p>
                  <p className="text-xs text-white/35">{c.curriculum?.assignments?.length || 0} assignments</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignments */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          {!selectedCourse ? (
            <p className="py-12 text-center text-white/40">Select a course</p>
          ) : assignments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText size={36} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/40">No assignments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((a, i) => {
                const overdue = a.dueDate && new Date(a.dueDate) < new Date();
                return (
                  <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{a.title}</p>
                          {a.dueDate && (
                            <Chip label={overdue ? "Overdue" : `Due: ${new Date(a.dueDate).toLocaleDateString()}`}
                              size="small" sx={{ bgcolor: overdue ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)", color: overdue ? "#fca5a5" : "#fde68a", fontWeight: 700, fontSize: 10 }} />
                          )}
                        </div>
                        {a.instructions && <p className="mt-1 text-sm text-white/50 line-clamp-2">{a.instructions}</p>}
                        <p className="mt-1 text-xs text-white/35">Max Score: {a.maxScore || 100}</p>
                      </div>
                      <div className="flex gap-1">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(a)} sx={{ color: "rgba(255,255,255,0.6)" }}>
                            <Edit size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(a)} sx={{ color: "rgba(239,68,68,0.6)" }}>
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
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Assignment" : "Create Assignment"}</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 3 }}>
          <div className="space-y-5">
            <TextField fullWidth label="Assignment Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth multiline rows={4} label="Instructions" value={form.instructions} onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <div className="grid grid-cols-2 gap-5">
              <TextField fullWidth label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                size="small" InputLabelProps={{ shrink: true, sx: { color: "rgba(255,255,255,0.6)" } }} InputProps={{ sx: { color: "white" } }} />
              <TextField fullWidth label="Max Score" type="number" value={form.maxScore} onChange={(e) => setForm((p) => ({ ...p, maxScore: parseInt(e.target.value) || 100 }))}
                size="small" inputProps={{ min: 1 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#fbbf24,#d97706)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Assignments;
