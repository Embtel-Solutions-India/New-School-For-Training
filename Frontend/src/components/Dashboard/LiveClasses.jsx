import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Pagination, Select, Skeleton, TextField, Tooltip,
} from "@mui/material";
import { Ban, Calendar, Edit, Film, Plus, Radio, Square, Trash2, Users, Video } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const STATUS = {
  scheduled: { label: "Scheduled", color: "rgba(56,189,248,0.15)", text: "#7dd3fc" },
  live: { label: "Live Now", color: "rgba(239,68,68,0.15)", text: "#fca5a5" },
  ended: { label: "Ended", color: "rgba(34,197,94,0.12)", text: "#86efac" },
  cancelled: { label: "Cancelled", color: "rgba(148,163,184,0.12)", text: "#94a3b8" },
};

const EMPTY = { title: "", description: "", scheduledAt: "", durationMinutes: 60, meetingLink: "", courseId: "" };
const REC_EMPTY = { url: "", title: "", platform: "other", durationMinutes: 0 };

const LiveClasses = () => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [attendanceDialog, setAttendanceDialog] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [recordingDialog, setRecordingDialog] = useState(null);
  const [recForm, setRecForm] = useState(REC_EMPTY);
  const [recSaving, setRecSaving] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await teacherApi.getLiveClasses({ page, limit: 12, ...(statusFilter ? { status: statusFilter } : {}) });
      setClasses(data.classes || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useEffect(() => {
    teacherApi.getCourses().then(({ data }) => setCourses(data.courses || [])).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (c) => {
    setEditing(c);
    const dt = new Date(c.scheduledAt);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({ title: c.title, description: c.description || "", scheduledAt: local, durationMinutes: c.durationMinutes, meetingLink: c.meetingLink || "", courseId: c.course?._id || "" });
    setDialog(true);
  };

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    if (!form.scheduledAt) { toast.error("Schedule date required"); return; }
    try {
      setSaving(true);
      const payload = { ...form, courseId: form.courseId || null };
      if (editing) {
        await teacherApi.updateLiveClass(editing._id, payload);
        toast.success("Session updated");
      } else {
        await teacherApi.createLiveClass(payload);
        toast.success("Session scheduled");
      }
      setDialog(false);
      fetchClasses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async (cls) => {
    try {
      await teacherApi.startLiveClass(cls._id);
      toast.success("Class started!");
      fetchClasses();
    } catch { toast.error("Failed to start"); }
  };

  const handleEnd = async (cls) => {
    if (!window.confirm("End this live class?")) return;
    try {
      await teacherApi.endLiveClass(cls._id, {});
      toast.success("Class ended");
      fetchClasses();
    } catch { toast.error("Failed to end class"); }
  };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete "${cls.title}"?`)) return;
    try {
      await teacherApi.deleteLiveClass(cls._id);
      toast.success("Session deleted");
      fetchClasses();
    } catch { toast.error("Delete failed"); }
  };

  const handleCancel = async (cls) => {
    if (!window.confirm(`Cancel "${cls.title}"? Students will be notified.`)) return;
    try {
      await teacherApi.cancelLiveClass(cls._id);
      toast.success("Class cancelled");
      fetchClasses();
    } catch (err) { toast.error(err?.response?.data?.message || "Cancel failed"); }
  };

  const openAttendance = async (cls) => {
    try {
      const { data } = await teacherApi.getSessionAttendance(cls._id);
      setAttendance(data.attendance || []);
      setAttendanceDialog(cls);
    } catch { toast.error("Failed to load attendance"); }
  };

  const openRecording = (cls) => {
    setRecForm({ ...REC_EMPTY, title: cls.title });
    setRecordingDialog(cls);
  };

  const handleSaveRecording = async () => {
    if (!recForm.url.trim()) { toast.error("Recording URL required"); return; }
    try {
      setRecSaving(true);
      await teacherApi.attachRecording(recordingDialog._id, recForm);
      toast.success("Recording attached");
      setRecordingDialog(null);
      fetchClasses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to attach recording");
    } finally {
      setRecSaving(false);
    }
  };

  const upcoming = classes.filter((c) => c.status === "scheduled");
  const live = classes.filter((c) => c.status === "live");

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Live Classes</h1>
            <p className="mt-2 text-white/60">Schedule, start, and manage your live teaching sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Filter</InputLabel>
              <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} label="Filter" sx={{ color: "white" }}>
                <MenuItem value="">All Sessions</MenuItem>
                {Object.entries(STATUS).map(([v, { label }]) => <MenuItem key={v} value={v}>{label}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate}
              sx={{ borderRadius: 3, background: "linear-gradient(135deg,#38bdf8,#0284c7)", fontWeight: 700, whiteSpace: "nowrap" }}>
              Schedule Class
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Upcoming Sessions", value: upcoming.length, color: "#38bdf8" },
          { label: "Live Now", value: live.length, color: "#ef4444" },
          { label: "Total Sessions", value: classes.length, color: "#22c55e" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-white/50">{s.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={160} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <Video size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No sessions yet. Schedule your first live class!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((cls, i) => {
            const st = STATUS[cls.status] || STATUS.scheduled;
            return (
              <motion.div key={cls._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-[22px] ${glass} p-5 ${cls.status === "live" ? "ring-1 ring-red-500/40" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {cls.status === "live" && <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />}
                    <p className="font-semibold line-clamp-1">{cls.title}</p>
                  </div>
                  <Chip label={st.label} size="small" sx={{ bgcolor: st.color, color: st.text, fontWeight: 700, fontSize: 10 }} />
                </div>
                {cls.description && <p className="mt-1 text-sm text-white/50 line-clamp-2">{cls.description}</p>}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Calendar size={11} />{new Date(cls.scheduledAt).toLocaleString()}</span>
                  <span>{cls.durationMinutes} min</span>
                  {cls.course?.title && <span className="text-violet-300">{cls.course.title}</span>}
                </div>
                {cls.meetingLink && (
                  <div className="mt-2 flex items-center gap-2">
                    {cls.meetingLink.includes("meet.google.com") && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Google Meet</span>
                    )}
                    <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-sky-400 underline truncate max-w-[220px]">
                      {cls.meetingLink}
                    </a>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {cls.status === "scheduled" && (
                      <Button size="small" variant="contained" onClick={() => handleStart(cls)}
                        sx={{ borderRadius: 2, background: "rgba(239,68,68,0.8)", fontSize: 11, px: 2, py: 0.5 }}>
                        <Radio size={11} className="mr-1" /> Start
                      </Button>
                    )}
                    {cls.status === "live" && (
                      <Button size="small" variant="contained" onClick={() => handleEnd(cls)}
                        sx={{ borderRadius: 2, background: "rgba(148,163,184,0.3)", fontSize: 11, px: 2, py: 0.5 }}>
                        <Square size={11} className="mr-1" /> End
                      </Button>
                    )}
                    <Tooltip title="View Attendance">
                      <IconButton size="small" onClick={() => openAttendance(cls)} sx={{ color: "rgba(255,255,255,0.5)" }}>
                        <Users size={13} />
                      </IconButton>
                    </Tooltip>
                    {cls.status === "ended" && (
                      <Tooltip title="Attach Recording">
                        <IconButton size="small" onClick={() => openRecording(cls)} sx={{ color: "rgba(167,139,250,0.7)" }}>
                          <Film size={13} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(cls.status === "scheduled" || cls.status === "live") && (
                      <Tooltip title="Cancel Class">
                        <IconButton size="small" onClick={() => handleCancel(cls)} sx={{ color: "rgba(251,191,36,0.7)" }}>
                          <Ban size={13} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {cls.status !== "live" && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(cls)} sx={{ color: "rgba(255,255,255,0.5)" }}>
                          <Edit size={13} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(cls)} sx={{ color: "rgba(239,68,68,0.5)" }}>
                        <Trash2 size={13} />
                      </IconButton>
                    </Tooltip>
                  </div>
                  <span className="text-xs text-white/30">{cls.attendanceCount || 0} attended</span>
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

      {/* Schedule Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Session" : "Schedule Live Class"}</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 3 }}>
          <div className="space-y-5">
            <TextField fullWidth label="Session Title *" value={form.title} onChange={(e) => f("title", e.target.value)}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={(e) => f("description", e.target.value)}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth label="Schedule Date & Time *" type="datetime-local" value={form.scheduledAt} onChange={(e) => f("scheduledAt", e.target.value)}
              size="small" InputLabelProps={{ shrink: true, sx: { color: "rgba(255,255,255,0.6)" } }} InputProps={{ sx: { color: "white" } }} />
            <div className="grid grid-cols-2 gap-5">
              <TextField fullWidth label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={(e) => f("durationMinutes", parseInt(e.target.value) || 60)}
                size="small" inputProps={{ min: 15 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Course (optional)</InputLabel>
                <Select value={form.courseId} onChange={(e) => f("courseId", e.target.value)} label="Course (optional)" sx={{ color: "white" }}>
                  <MenuItem value="">None</MenuItem>
                  {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            <TextField fullWidth label="Meeting Link" value={form.meetingLink} onChange={(e) => f("meetingLink", e.target.value)}
              size="small" placeholder="https://zoom.us/j/..." InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#38bdf8,#0284c7)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "Update" : "Schedule"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={!!attendanceDialog} onClose={() => setAttendanceDialog(null)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Session Attendance — {attendanceDialog?.title}</DialogTitle>
        <DialogContent>
          {attendance.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No attendance records for this session</p>
          ) : (
            <div className="mt-2 space-y-2">
              {attendance.map((r) => (
                <div key={r._id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-xs font-bold">
                      {r.student?.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.student?.name}</p>
                      <p className="text-xs text-white/40">{r.student?.email}</p>
                    </div>
                  </div>
                  <Chip label={r.status} size="small"
                    sx={{ bgcolor: r.status === "present" ? "rgba(34,197,94,0.15)" : r.status === "late" ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)",
                      color: r.status === "present" ? "#86efac" : r.status === "late" ? "#fde68a" : "#fca5a5", fontWeight: 700, fontSize: 10 }} />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAttendanceDialog(null)} sx={{ color: "rgba(255,255,255,0.6)" }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Attach Recording Dialog */}
      <Dialog open={!!recordingDialog} onClose={() => setRecordingDialog(null)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Attach Recording — {recordingDialog?.title}</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 3 }}>
          <div className="space-y-5">
            <TextField fullWidth label="Recording URL *" value={recForm.url}
              onChange={(e) => setRecForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://drive.google.com/... or https://youtube.com/..."
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth label="Recording Title" value={recForm.title}
              onChange={(e) => setRecForm((p) => ({ ...p, title: e.target.value }))}
              size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <div className="grid grid-cols-2 gap-5">
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Platform</InputLabel>
                <Select value={recForm.platform} onChange={(e) => setRecForm((p) => ({ ...p, platform: e.target.value }))} label="Platform" sx={{ color: "white" }}>
                  <MenuItem value="google_drive">Google Drive</MenuItem>
                  <MenuItem value="youtube">YouTube</MenuItem>
                  <MenuItem value="s3">S3 / CDN</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth label="Duration (min)" type="number" value={recForm.durationMinutes}
                onChange={(e) => setRecForm((p) => ({ ...p, durationMinutes: parseInt(e.target.value) || 0 }))}
                size="small" inputProps={{ min: 0 }} InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setRecordingDialog(null)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSaveRecording} variant="contained" disabled={recSaving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", fontWeight: 700 }}>
            {recSaving ? <CircularProgress size={18} color="inherit" /> : "Attach"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LiveClasses;
