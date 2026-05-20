import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Pagination, Select, Skeleton,
  Tab, Tabs, TextField, Tooltip,
} from "@mui/material";
import { Archive, BookOpen, ChevronDown, ChevronUp, Edit, Globe, ImagePlus, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";
import { requestPresignedUrl, uploadToS3 } from "../../services/uploadService";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& input": { padding: "11px 14px" },
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
    "&.Mui-focused fieldset": { borderColor: "#22c55e" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#22c55e" },
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.5)" },
};
const slotSx = { input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } };

const STATUS_MAP = {
  draft: { label: "Draft", color: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  pending_review: { label: "In Review", color: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  published: { label: "Published", color: "rgba(34,197,94,0.15)", text: "#86efac" },
  rejected: { label: "Rejected", color: "rgba(239,68,68,0.15)", text: "#fca5a5" },
  archived: { label: "Archived", color: "rgba(100,116,139,0.15)", text: "#64748b" },
  unpublished: { label: "Unpublished", color: "rgba(148,163,184,0.12)", text: "#94a3b8" },
};

const CATEGORIES = ["AI & Data", "Cloud & Security", "Development", "Enterprise", "Youth STEM", "Certifications"];

const BLANK_WEEK = () => ({
  weekNo: 1, title: "", objective: "", lectures: [], lecturesText: "", lab: "", caseStudy: "", duration: "",
});

const EMPTY_FORM = {
  title: "", description: "", thumbnail: "",
  category: "Development", tags: "",
  pricing: { price: 0, currency: "USD", discountPercent: 0 },
  status: "draft",
  duration: "", estimatedHours: 0,
  skills: [], objectives: [],
  weeklyPlan: [],
  capstone: { title: "", description: "", requirements: [], deliverables: [] },
};

const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [dialogTab, setDialogTab] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [skillInput, setSkillInput] = useState("");
  const [objInput, setObjInput] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const PER_PAGE = 12;

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await teacherApi.getCourses();
      setCourses(data.courses || []);
    } catch { toast.error("Failed to load courses"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filtered = filterStatus ? courses.filter((c) => c.status === filterStatus) : courses;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setDialogTab(0);
    setSkillInput(""); setObjInput(""); setDialog(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      title: c.title || "", description: c.description || "", thumbnail: c.thumbnail || "",
      category: c.category || "Development", tags: (c.tags || []).join(", "),
      pricing: c.pricing || { price: 0, currency: "USD", discountPercent: 0 },
      status: c.status || "draft",
      duration: c.duration || "", estimatedHours: c.estimatedHours || 0,
      skills: c.skills || [], objectives: c.objectives || [],
      weeklyPlan: (c.weeklyPlan || []).map((w) => ({ ...w, lecturesText: (w.lectures || []).join(", ") })),
      capstone: c.capstone || { title: "", description: "", requirements: [], deliverables: [] },
    });
    setDialogTab(0); setSkillInput(""); setObjInput(""); setDialog(true);
  };

  const f = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploading(true);
    try {
      const courseId = editing?._id || "tmp";
      const { presignedUrl, fileUrl } = await requestPresignedUrl({
        fileName: file.name, fileType: file.type, fileSize: file.size, courseId,
      });
      await uploadToS3({ presignedUrl, file });
      f("thumbnail", fileUrl);
      toast.success("Thumbnail uploaded");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thumbnail upload failed");
    } finally {
      setThumbnailUploading(false);
      e.target.value = "";
    }
  };

  // Skills
  const addSkill = () => {
    if (!skillInput.trim()) return;
    f("skills", [...form.skills, skillInput.trim()]);
    setSkillInput("");
  };
  const removeSkill = (i) => f("skills", form.skills.filter((_, idx) => idx !== i));

  // Objectives
  const addObjective = () => {
    if (!objInput.trim()) return;
    f("objectives", [...form.objectives, objInput.trim()]);
    setObjInput("");
  };
  const removeObjective = (i) => f("objectives", form.objectives.filter((_, idx) => idx !== i));

  // Weekly plan
  const addWeek = () => {
    const next = [...form.weeklyPlan, { ...BLANK_WEEK(), weekNo: form.weeklyPlan.length + 1 }];
    f("weeklyPlan", next);
  };
  const removeWeek = (i) => {
    const updated = form.weeklyPlan.filter((_, idx) => idx !== i).map((w, idx) => ({ ...w, weekNo: idx + 1 }));
    f("weeklyPlan", updated);
  };
  const updateWeek = (i, key, value) => {
    const updated = [...form.weeklyPlan];
    updated[i] = { ...updated[i], [key]: value };
    f("weeklyPlan", updated);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    try {
      setSaving(true);
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        weeklyPlan: form.weeklyPlan.map(({ lecturesText, ...w }) => ({
          ...w,
          lectures: lecturesText ? lecturesText.split(",").map((l) => l.trim()).filter(Boolean) : w.lectures || [],
        })),
      };
      if (editing) {
        await teacherApi.updateCourse(editing._id, payload);
        toast.success(payload.status === "published" ? "Course updated and published!" : "Course updated.");
      } else {
        await teacherApi.createCourse(payload);
        toast.success(payload.status === "published" ? "Course published! Now visible to students." : "Course saved as draft.");
      }
      setDialog(false);
      fetchCourses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    try { await teacherApi.deleteCourse(c._id); toast.success("Deleted"); fetchCourses(); }
    catch { toast.error("Delete failed"); }
  };

  const handleTogglePublish = async (c) => {
    const willPublish = c.status !== "published";
    try {
      await teacherApi.publishCourse(c._id, willPublish);
      toast.success(willPublish ? "Course published! Now visible to students." : "Course unpublished.");
      fetchCourses();
    } catch { toast.error("Action failed"); }
  };

  const handleArchive = async (c) => {
    try { await teacherApi.updateCourse(c._id, { status: "archived" }); toast.success("Archived"); fetchCourses(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-4xl ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">My Courses</h1>
            <p className="mt-2 text-white/60">Create, manage, publish, and build rich course syllabuses</p>
          </div>
          <div className="flex items-center gap-3">
            <FormControl size="small" sx={{ minWidth: 150, ...inputSx }}>
              <InputLabel>Filter Status</InputLabel>
              <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} label="Filter Status">
                <MenuItem value="">All Courses</MenuItem>
                {Object.entries(STATUS_MAP).map(([v, { label }]) => <MenuItem key={v} value={v}>{label}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}
              sx={{ borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700, whiteSpace: "nowrap" }}>
              New Course
            </Button>
          </div>
        </div>
      </motion.div>

      {!loading && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_MAP).map(([key, { label, text }]) => {
            const count = courses.filter((c) => c.status === key).length;
            if (!count) return null;
            return (
              <button key={key} onClick={() => { setFilterStatus(filterStatus === key ? "" : key); setPage(1); }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filterStatus === key ? "border-white/30 bg-white/10" : "border-white/10 bg-white/4"}`}
                style={{ color: text }}>
                {label} · {count}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={240} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className={`rounded-3xl ${glass} py-16 text-center`}>
          <BookOpen size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No courses yet. Create your first course!</p>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}
            sx={{ mt: 4, borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700 }}>
            Create Course
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.map((course, i) => {
            const st = STATUS_MAP[course.status] || STATUS_MAP.draft;
            const isPublished = course.status === "published";
            return (
              <motion.div key={course._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} className={`rounded-[22px] ${glass} overflow-hidden transition hover:-translate-y-0.5`}>
                {course.thumbnail
                  ? <div className="h-36 overflow-hidden"><img src={course.thumbnail} alt="" className="h-full w-full object-cover" /></div>
                  : <div className="flex h-36 items-center justify-center bg-white/4"><BookOpen size={32} className="text-white/20" /></div>}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 font-semibold text-white leading-snug">{course.title}</p>
                    <Chip label={st.label} size="small" sx={{ bgcolor: st.color, color: st.text, fontWeight: 700, fontSize: 10, flexShrink: 0 }} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/40">
                    <span>{course.curriculum?.lessons?.length || 0} lessons</span>
                    <span>{course.weeklyPlan?.length || 0} weeks</span>
                    <span>{course.skills?.length || 0} skills</span>
                    {course.duration && <span>{course.duration}</span>}
                  </div>
                  {!isPublished && (
                    <p className="mt-2 text-xs text-amber-400/80">⚠ Not visible to students — click Publish to go live</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-1">
                      <Tooltip title="Edit Course & Curriculum">
                        <IconButton size="small" onClick={() => openEdit(course)} sx={{ color: "rgba(255,255,255,0.6)" }}><Edit size={14} /></IconButton>
                      </Tooltip>
                      <Tooltip title={isPublished ? "Unpublish Course" : "Publish Course"}>
                        <IconButton size="small" onClick={() => handleTogglePublish(course)}
                          sx={{ color: isPublished ? "rgba(34,197,94,0.8)" : "rgba(255,255,255,0.5)" }}><Globe size={14} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Archive">
                        <IconButton size="small" onClick={() => handleArchive(course)} sx={{ color: "rgba(255,255,255,0.4)" }}><Archive size={14} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(course)} sx={{ color: "rgba(239,68,68,0.6)" }}><Trash2 size={14} /></IconButton>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-white/35">{new Date(course.updatedAt).toLocaleDateString()}</p>
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

      {/* ── Dialog ── */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>{editing ? "Edit Course" : "Create New Course"}</DialogTitle>

        <Tabs value={dialogTab} onChange={(_, v) => setDialogTab(v)} sx={{ px: 3, borderBottom: "1px solid rgba(255,255,255,0.08)", "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontWeight: 600 }, "& .Mui-selected": { color: "#22c55e !important" }, "& .MuiTabs-indicator": { bgcolor: "#22c55e" } }}>
          <Tab label="Basic Info" />
          <Tab label="Curriculum Builder" />
        </Tabs>

        <DialogContent sx={{ pt: 3 }}>
          {/* ── TAB 0: Basic Info ── */}
          {dialogTab === 0 && (
            <div className="space-y-5">
              <TextField fullWidth label="Course Title *" value={form.title}
                onChange={(e) => f("title", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
              <TextField fullWidth multiline rows={4} label="Description" value={form.description}
                onChange={(e) => f("description", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
              <div className="grid grid-cols-2 gap-5">
                <div className="flex items-center gap-1.5">
                  <TextField fullWidth label="Thumbnail URL" value={form.thumbnail}
                    onChange={(e) => f("thumbnail", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
                  <Tooltip title="Upload image">
                    <IconButton component="label" disabled={thumbnailUploading}
                      sx={{ color: thumbnailUploading ? "#22c55e" : "rgba(255,255,255,0.4)", flexShrink: 0, "&:hover": { color: "#22c55e" } }}>
                      {thumbnailUploading ? <CircularProgress size={16} color="inherit" /> : <ImagePlus size={16} />}
                      <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailUpload} />
                    </IconButton>
                  </Tooltip>
                </div>
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Category</InputLabel>
                  <Select value={form.category} onChange={(e) => f("category", e.target.value)} label="Category">
                    {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth label="Price (USD)" type="number" value={form.pricing?.price ?? 0}
                  onChange={(e) => f("pricing", { ...form.pricing, price: parseFloat(e.target.value) || 0 })}
                  size="small" slotProps={{ htmlInput: { min: 0 }, input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={inputSx} />
                <TextField fullWidth label="Discount %" type="number" value={form.pricing?.discountPercent ?? 0}
                  onChange={(e) => f("pricing", { ...form.pricing, discountPercent: parseFloat(e.target.value) || 0 })}
                  size="small" slotProps={{ htmlInput: { min: 0, max: 100 }, input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={inputSx} />
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Publish Status</InputLabel>
                  <Select value={form.status} onChange={(e) => f("status", e.target.value)} label="Publish Status">
                    <MenuItem value="draft">Draft – Not visible to students</MenuItem>
                    <MenuItem value="published">Published – Live for all students</MenuItem>
                    <MenuItem value="unpublished">Unpublished – Hidden from catalog</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label="Tags (comma separated)" value={form.tags}
                  onChange={(e) => f("tags", e.target.value)} size="small" placeholder="react, aws, cloud"
                  sx={inputSx} slotProps={slotSx} />
              </div>
              {form.status === "published" && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <p className="text-sm text-emerald-300 font-semibold">✓ This course will be immediately visible to all students.</p>
                </div>
              )}
              {form.status === "draft" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <p className="text-sm text-amber-300">Draft courses are only visible to you. Switch to "Published" to make live.</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 1: Curriculum Builder ── */}
          {dialogTab === 1 && (
            <div className="space-y-6">
              {/* Duration */}
              <div>
                <p className="text-sm font-semibold text-white/70 mb-3">Course Duration</p>
                <div className="grid grid-cols-2 gap-4">
                  <TextField fullWidth label='Duration (e.g. "10 Weeks")' value={form.duration}
                    onChange={(e) => f("duration", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
                  <TextField fullWidth label="Estimated Hours" type="number" value={form.estimatedHours}
                    onChange={(e) => f("estimatedHours", parseInt(e.target.value) || 0)} size="small"
                    slotProps={{ htmlInput: { min: 0 }, input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} sx={inputSx} />
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-sm font-semibold text-white/70 mb-3">Skills Covered</p>
                <div className="flex gap-2">
                  <TextField fullWidth size="small" placeholder="Add a skill (e.g. AWS, Docker)" value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    sx={inputSx} slotProps={slotSx} />
                  <Button variant="outlined" onClick={addSkill}
                    sx={{ borderRadius: 2, borderColor: "rgba(34,197,94,0.4)", color: "#22c55e", whiteSpace: "nowrap", minWidth: 80 }}>
                    Add
                  </Button>
                </div>
                {form.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.skills.map((s, i) => (
                      <Chip key={i} label={s} size="small" onDelete={() => removeSkill(i)}
                        sx={{ bgcolor: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)",
                          "& .MuiChip-deleteIcon": { color: "rgba(134,239,172,0.6)", "&:hover": { color: "#86efac" } } }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Objectives */}
              <div>
                <p className="text-sm font-semibold text-white/70 mb-3">Learning Objectives</p>
                <div className="flex gap-2">
                  <TextField fullWidth size="small" placeholder="e.g. Build scalable cloud architectures" value={objInput}
                    onChange={(e) => setObjInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addObjective(); } }}
                    sx={inputSx} slotProps={slotSx} />
                  <Button variant="outlined" onClick={addObjective}
                    sx={{ borderRadius: 2, borderColor: "rgba(56,189,248,0.4)", color: "#38bdf8", whiteSpace: "nowrap", minWidth: 80 }}>
                    Add
                  </Button>
                </div>
                {form.objectives.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {form.objectives.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/4 px-3 py-2">
                        <span className="mt-0.5 text-xs text-sky-400">✓</span>
                        <span className="flex-1 text-sm text-white/80">{o}</span>
                        <button onClick={() => removeObjective(i)} className="text-white/30 hover:text-red-400 transition"><X size={12} /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Weekly Plan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white/70">Weekly Curriculum</p>
                  <Button size="small" variant="outlined" startIcon={<Plus size={14} />} onClick={addWeek}
                    sx={{ borderRadius: 2, borderColor: "rgba(251,191,36,0.4)", color: "#fbbf24", fontSize: 12 }}>
                    Add Week
                  </Button>
                </div>
                {form.weeklyPlan.length === 0 && (
                  <p className="text-xs text-white/30 italic">No weeks added yet. Click "Add Week" to build your course roadmap.</p>
                )}
                <div className="space-y-3">
                  {form.weeklyPlan.map((week, i) => (
                    <WeekEditor key={i} week={week} index={i} onUpdate={updateWeek} onRemove={removeWeek} inputSx={inputSx} slotSx={slotSx} />
                  ))}
                </div>
              </div>

              {/* Capstone */}
              <div>
                <p className="text-sm font-semibold text-white/70 mb-3">Capstone Project</p>
                <div className="space-y-4 rounded-xl border border-white/10 bg-white/3 p-4">
                  <TextField fullWidth label="Capstone Title" value={form.capstone?.title || ""}
                    onChange={(e) => f("capstone", { ...form.capstone, title: e.target.value })}
                    size="small" sx={inputSx} slotProps={slotSx} />
                  <TextField fullWidth multiline rows={3} label="Description / Deliverables" value={form.capstone?.description || ""}
                    onChange={(e) => f("capstone", { ...form.capstone, description: e.target.value })}
                    size="small" sx={inputSx} slotProps={slotSx} />
                  <TextField fullWidth label="Requirements (comma separated)" value={(form.capstone?.requirements || []).join(", ")}
                    onChange={(e) => f("capstone", { ...form.capstone, requirements: e.target.value.split(",").map((r) => r.trim()).filter(Boolean) })}
                    size="small" placeholder="Git, Docker, Basic Python" sx={inputSx} slotProps={slotSx} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          {dialogTab === 0 && (
            <Button variant="outlined" onClick={() => setDialogTab(1)}
              sx={{ borderRadius: 3, borderColor: "rgba(251,191,36,0.4)", color: "#fbbf24", fontWeight: 600 }}>
              Next: Curriculum →
            </Button>
          )}
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "Update Course" : "Create Course"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

/* ── Week Editor (inline accordion) ── */
const WeekEditor = ({ week, index, onUpdate, onRemove, inputSx, slotSx }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-white/10 bg-white/4 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
          {week.weekNo}
        </span>
        <span className="flex-1 text-sm font-semibold text-white/80">{week.title || `Week ${week.weekNo}`}</span>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="rounded-lg p-1 text-white/30 hover:text-red-400 transition">
            <Trash2 size={13} />
          </button>
          {open ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/6 pt-3">
          <div className="grid grid-cols-2 gap-4">
            <TextField fullWidth label="Week Title" value={week.title}
              onChange={(e) => onUpdate(index, "title", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
            <TextField fullWidth label='Duration (e.g. "3 hours")' value={week.duration}
              onChange={(e) => onUpdate(index, "duration", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
          </div>
          <TextField fullWidth label="Strategic Objective" value={week.objective}
            onChange={(e) => onUpdate(index, "objective", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
          <TextField fullWidth label="Core Lectures (comma separated)" value={week.lecturesText ?? (week.lectures || []).join(", ")}
            onChange={(e) => onUpdate(index, "lecturesText", e.target.value)}
            placeholder="Intro to EC2, VPC Setup, IAM Roles" size="small" sx={inputSx} slotProps={slotSx} />
          <TextField fullWidth label="Industrial Lab / Hands-on Task" value={week.lab}
            onChange={(e) => onUpdate(index, "lab", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
          <TextField fullWidth label="Industry Case Study" value={week.caseStudy}
            onChange={(e) => onUpdate(index, "caseStudy", e.target.value)} size="small" sx={inputSx} slotProps={slotSx} />
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
