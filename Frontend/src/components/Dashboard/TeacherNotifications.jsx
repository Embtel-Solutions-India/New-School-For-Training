import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, TextField,
} from "@mui/material";
import { Bell, Send, Users } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const TYPES = ["info", "announcement", "reminder", "alert"];
const TARGET_OPTIONS = [
  { value: "all", label: "All My Students", desc: "Notify everyone enrolled in your courses", icon: "🌐", color: "rgba(34,197,94,0.15)" },
  { value: "students", label: "Students Only", desc: "Target student-role users in your courses", icon: "📚", color: "rgba(56,189,248,0.15)" },
  { value: "course", label: "Specific Course", desc: "Notify students of a specific course", icon: "🎯", color: "rgba(167,139,250,0.15)" },
];

const EMPTY = { title: "", message: "", target: "all", type: "announcement", courseId: "" };

const TeacherNotifications = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    teacherApi.getCourses().then(({ data }) => setCourses(data.courses || [])).catch(() => {});
  }, []);

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSend = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    if (!form.message.trim()) { toast.error("Message required"); return; }
    if (form.target === "course" && !form.courseId) { toast.error("Select a course"); return; }
    try {
      setSending(true);
      await teacherApi.sendNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        targetRole: form.target === "all" ? null : form.target === "students" ? "student" : null,
        courseId: form.target === "course" ? form.courseId : null,
        type: form.type,
      });
      toast.success("Notification sent!");
      setHistory((p) => [{ ...form, sentAt: new Date(), _id: Date.now() }, ...p]);
      setForm(EMPTY);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const remaining = 1000 - (form.message?.length || 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Send Notifications</h1>
          <p className="mt-2 text-white/60">Announce updates, reminders, and alerts to your enrolled students</p>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Compose Panel */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2.5"><Bell size={18} className="text-emerald-300" /></div>
            <p className="font-semibold">Compose Notification</p>
          </div>

          <div className="space-y-4">
            {/* Target Audience */}
            <div>
              <p className="mb-2 text-sm text-white/60">Target Audience</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {TARGET_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => f("target", opt.value)}
                    className={`rounded-2xl border p-3 text-left transition ${form.target === opt.value ? "border-white/30" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}
                    style={{ background: form.target === opt.value ? opt.color : undefined }}>
                    <span className="text-xl">{opt.icon}</span>
                    <p className="mt-1 text-xs font-semibold">{opt.label}</p>
                    <p className="text-xs text-white/45">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {form.target === "course" && (
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Select Course</InputLabel>
                <Select value={form.courseId} onChange={(e) => f("courseId", e.target.value)} label="Select Course" sx={{ color: "white" }}>
                  {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            <div className="grid grid-cols-2 gap-4">
              <TextField fullWidth label="Notification Title" value={form.title} onChange={(e) => f("title", e.target.value)}
                size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Type</InputLabel>
                <Select value={form.type} onChange={(e) => f("type", e.target.value)} label="Type" sx={{ color: "white" }}>
                  {TYPES.map((t) => <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </div>

            <div>
              <TextField fullWidth multiline rows={5} label="Message" value={form.message}
                onChange={(e) => e.target.value.length <= 1000 && f("message", e.target.value)}
                size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              <p className={`mt-1 text-right text-xs ${remaining < 50 ? "text-orange-400" : "text-white/30"}`}>{remaining} chars left</p>
            </div>

            <Button variant="contained" fullWidth startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
              disabled={sending} onClick={handleSend}
              sx={{ borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700, py: 1.5 }}>
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </motion.div>

        {/* History */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Recent Sent (This Session)</p>
          {history.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-white/30">
              <div className="text-center">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sent notifications appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((n) => (
                <div key={n._id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">{n.type}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/50 line-clamp-2">{n.message}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/30">
                    <span>→ {TARGET_OPTIONS.find((t) => t.value === n.target)?.label}</span>
                    <span>{new Date(n.sentAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Notification Templates */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-6`}>
        <p className="mb-4 font-semibold">Quick Templates</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Assignment Reminder", message: "Reminder: Your assignment is due soon. Please submit before the deadline.", type: "reminder" },
            { title: "New Lesson Published", message: "A new lesson has been added to your course. Log in to start learning!", type: "announcement" },
            { title: "Live Class Alert", message: "Your live class starts in 30 minutes. Join on time to get the most out of it!", type: "alert" },
          ].map((t) => (
            <button key={t.title} onClick={() => setForm((p) => ({ ...p, title: t.title, message: t.message, type: t.type }))}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07]">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="mt-1 text-xs text-white/40 line-clamp-2">{t.message}</p>
              <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">{t.type}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherNotifications;
