import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Select, Skeleton, TextField, Tooltip,
} from "@mui/material";
import { BookOpen, Edit, FileText, GripVertical, Layers, Plus, Trash2, Video } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";
import DragDropUploader from "../upload/DragDropUploader";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
    "&.Mui-focused fieldset": { borderColor: "#a78bfa" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#a78bfa" },
};

const EMPTY_LESSON = { title: "", description: "", chapter: "Module 1", videoUrl: "", richText: "", order: 0, resources: [] };

const LessonsModules = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form, setForm] = useState(EMPTY_LESSON);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await teacherApi.getCourses();
      const list = data.courses || [];
      setCourses(list);
      if (list.length > 0 && !selectedCourse) setSelectedCourse(list[0]);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const lessons = selectedCourse?.curriculum?.lessons || [];
  const chapters = [...new Set(lessons.map((l) => l.chapter || "Module 1"))];

  const openCreate = () => {
    setEditingLesson(null);
    setForm({ ...EMPTY_LESSON, order: lessons.length, chapter: chapters[0] || "Module 1" });
    setDialog(true);
  };

  const openEdit = (lesson) => {
    setEditingLesson(lesson);
    setForm({ title: lesson.title, description: lesson.description || "", chapter: lesson.chapter || "Module 1", videoUrl: lesson.videoUrl || "", richText: lesson.richText || "", order: lesson.order || 0, resources: lesson.resources || [] });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Lesson title required"); return; }
    if (!selectedCourse) { toast.error("Select a course first"); return; }
    try {
      setSaving(true);
      if (editingLesson) {
        await teacherApi.updateLesson(selectedCourse._id, editingLesson._id, form);
        toast.success("Lesson updated");
      } else {
        await teacherApi.createLesson(selectedCourse._id, form);
        toast.success("Lesson added");
      }
      setDialog(false);
      const { data } = await teacherApi.getCourses();
      const updated = (data.courses || []).find((c) => c._id === selectedCourse._id);
      if (updated) setSelectedCourse(updated);
      setCourses(data.courses || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lesson) => {
    if (!window.confirm(`Delete "${lesson.title}"?`)) return;
    try {
      await teacherApi.deleteLesson(selectedCourse._id, lesson._id);
      toast.success("Lesson deleted");
      const { data } = await teacherApi.getCourses();
      const updated = (data.courses || []).find((c) => c._id === selectedCourse._id);
      if (updated) setSelectedCourse(updated);
      setCourses(data.courses || []);
    } catch { toast.error("Delete failed"); }
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDrop = async (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...lessons];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const order = reordered.map((l) => l._id);
    try {
      await teacherApi.reorderLessons(selectedCourse._id, order);
      const { data } = await teacherApi.getCourses();
      const updated = (data.courses || []).find((c) => c._id === selectedCourse._id);
      if (updated) setSelectedCourse(updated);
      setCourses(data.courses || []);
    } catch { toast.error("Reorder failed"); }
    setDragIdx(null);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Lessons & Modules</h1>
            <p className="mt-2 text-white/60">Build curriculum, upload content, reorder lessons</p>
          </div>
          {selectedCourse && (
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}
              sx={{ borderRadius: 3, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", fontWeight: 700, whiteSpace: "nowrap" }}>
              Add Lesson
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
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={48} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
            </div>
          ) : courses.length === 0 ? (
            <p className="text-xs text-white/40">No courses yet</p>
          ) : (
            <div className="space-y-1">
              {courses.map((c) => (
                <button key={c._id} onClick={() => setSelectedCourse(c)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedCourse?._id === c._id ? "bg-violet-500/20 text-violet-200 font-semibold" : "text-white/60 hover:bg-white/[0.06]"}`}>
                  <p className="truncate">{c.title}</p>
                  <p className="text-xs text-white/35">{c.curriculum?.lessons?.length || 0} lessons</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lessons List */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          {!selectedCourse ? (
            <div className="flex h-48 items-center justify-center text-white/40">
              <div className="text-center">
                <Layers size={32} className="mx-auto mb-2 opacity-30" />
                <p>Select a course to manage its curriculum</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedCourse.title}</p>
                  <p className="text-sm text-white/45">{lessons.length} lessons across {chapters.length} modules</p>
                </div>
              </div>

              {/* Chapter groups */}
              {chapters.length === 0 ? (
                <div className="py-12 text-center text-white/40">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No lessons yet. Add your first lesson!</p>
                </div>
              ) : (
                chapters.map((chapter) => {
                  const chapterLessons = lessons.filter((l) => (l.chapter || "Module 1") === chapter);
                  const chapterStart = lessons.indexOf(chapterLessons[0]);
                  return (
                    <div key={chapter} className="mb-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Layers size={14} className="text-violet-400" />
                        <p className="text-sm font-bold text-violet-300">{chapter}</p>
                        <span className="text-xs text-white/30">({chapterLessons.length} lessons)</span>
                      </div>
                      <div className="space-y-2">
                        {chapterLessons.map((lesson, localIdx) => {
                          const globalIdx = lessons.findIndex((l) => l._id === lesson._id);
                          return (
                            <div key={lesson._id} draggable
                              onDragStart={() => handleDragStart(globalIdx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => handleDrop(globalIdx)}
                              className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition cursor-grab active:cursor-grabbing ${dragIdx === globalIdx ? "opacity-50" : ""}`}>
                              <GripVertical size={14} className="shrink-0 text-white/25" />
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500/15">
                                {lesson.videoUrl ? <Video size={13} className="text-violet-300" /> : <FileText size={13} className="text-violet-300" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{lesson.title}</p>
                                <div className="flex gap-3 text-xs text-white/35">
                                  {lesson.videoUrl && <span className="text-emerald-400">Video</span>}
                                  {lesson.richText && <span>Rich text</span>}
                                  {(lesson.resources?.length || 0) > 0 && <span>{lesson.resources.length} resources</span>}
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => openEdit(lesson)} sx={{ color: "rgba(255,255,255,0.6)" }}>
                                    <Edit size={13} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" onClick={() => handleDelete(lesson)} sx={{ color: "rgba(239,68,68,0.6)" }}>
                                    <Trash2 size={13} />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {/* Lesson Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingLesson ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
        <DialogContent>
          <div className="mt-2 space-y-5">
            <TextField fullWidth label="Lesson Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              slotProps={{ input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={fieldSx} />
            <TextField fullWidth label="Module / Chapter" value={form.chapter} onChange={(e) => setForm((p) => ({ ...p, chapter: e.target.value }))}
              slotProps={{ input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={fieldSx} />
            <TextField fullWidth multiline rows={3} label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              slotProps={{ input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={fieldSx} />
            <TextField fullWidth label="Video URL" value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
              placeholder="Paste URL or upload a file below" slotProps={{ input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={fieldSx} />

            {/* ── S3 UPLOAD SECTION ─────────────────────────── */}
            <div className="rounded-xl border border-white/10 bg-white/2 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                Upload Files to S3
              </p>
              <DragDropUploader
                courseId={selectedCourse?._id}
                lessonId={editingLesson?._id}
                savedResources={form.resources}
                onVideoUploaded={(url) =>
                  setForm((p) => ({ ...p, videoUrl: url || p.videoUrl }))
                }
                onResourceUploaded={(resource) =>
                  setForm((p) => ({ ...p, resources: [...(p.resources || []), resource] }))
                }
                onResourceRemoved={(url) =>
                  setForm((p) => ({ ...p, resources: (p.resources || []).filter((r) => r.url !== url) }))
                }
              />
            </div>
            {/* ──────────────────────────────────────────────── */}

            <TextField fullWidth multiline rows={4} label="Rich Text / Notes" value={form.richText} onChange={(e) => setForm((p) => ({ ...p, richText: e.target.value }))}
              slotProps={{ input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={fieldSx} />
            <TextField fullWidth label="Order" type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
              slotProps={{ htmlInput: { min: 0 }, input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={fieldSx} />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editingLesson ? "Update" : "Add Lesson"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LessonsModules;
