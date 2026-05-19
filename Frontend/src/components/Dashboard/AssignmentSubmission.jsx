import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Skeleton, TextField,
} from "@mui/material";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const STATUS_MAP = {
  submitted: { bg: "rgba(56,189,248,0.15)", color: "#7dd3fc", label: "Submitted" },
  graded: { bg: "rgba(34,197,94,0.15)", color: "#86efac", label: "Graded" },
  resubmit: { bg: "rgba(251,191,36,0.15)", color: "#fde68a", label: "Resubmit" },
};

const AssignmentSubmission = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitDialog, setSubmitDialog] = useState(null);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("pending");

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await studentApi.getMyAssignments();
      setAssignments(data.assignments || []);
    } catch { toast.error("Failed to load assignments"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const handleSubmit = async () => {
    if (!content.trim() && !fileUrl.trim()) { toast.error("Add content or file URL"); return; }
    try {
      setSaving(true);
      await studentApi.submitAssignment(submitDialog.course._id, submitDialog._id, { content, fileUrl });
      toast.success("Assignment submitted!");
      setSubmitDialog(null);
      fetchAssignments();
    } catch { toast.error("Submission failed"); }
    finally { setSaving(false); }
  };

  const pending = assignments.filter((a) => !a.submission);
  const submitted = assignments.filter((a) => a.submission);
  const displayed = tab === "pending" ? pending : submitted;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Assignments</h1>
            <p className="mt-2 text-white/60">Submit assignments from your enrolled courses</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-center">
              <p className="text-lg font-bold text-orange-300">{pending.length}</p>
              <p className="text-xs text-white/50">Pending</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-center">
              <p className="text-lg font-bold text-emerald-300">{submitted.length}</p>
              <p className="text-xs text-white/50">Submitted</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 w-fit">
        {["pending", "submitted"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition capitalize ${tab === t ? "bg-white text-[#0c1220]" : "text-white/60 hover:text-white"}`}>
            {t} ({t === "pending" ? pending.length : submitted.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={100} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <FileText size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">{tab === "pending" ? "No pending assignments!" : "No submitted assignments yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((a, i) => {
            const sub = a.submission;
            const sc = sub ? (STATUS_MAP[sub.status] || STATUS_MAP.submitted) : null;
            return (
              <motion.div key={`${a._id}-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`rounded-[20px] ${glass} p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${a.isOverdue ? "bg-red-500/20" : "bg-orange-500/20"}`}>
                      <FileText size={18} className={a.isOverdue ? "text-red-400" : "text-orange-400"} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-white/40">{a.course?.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {sub && <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: sc?.bg, color: sc?.color }}>{sc?.label}</span>}
                    {a.isOverdue && !sub && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-300">Overdue</span>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/40">
                  {a.dueDate && (
                    <div className="flex items-center gap-1"><Clock size={12} /> Due: {new Date(a.dueDate).toLocaleDateString()}</div>
                  )}
                  <div className="flex items-center gap-1"><CheckCircle2 size={12} /> Max: {a.maxScore} pts</div>
                  {sub?.score !== null && sub?.score !== undefined && (
                    <div className="flex items-center gap-1 text-emerald-300 font-semibold">Score: {sub.score}/{sub.maxScore}</div>
                  )}
                </div>
                {sub?.feedback && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs text-white/50">Feedback: <span className="text-white/70">{sub.feedback}</span></p>
                  </div>
                )}
                {!sub && (
                  <div className="mt-3 flex justify-end">
                    <Button size="small" variant="contained" onClick={() => { setSubmitDialog(a); setContent(""); setFileUrl(""); }}
                      sx={{ borderRadius: 2, background: "linear-gradient(135deg,#f97316,#ea580c)", fontSize: 11, fontWeight: 700 }}>
                      Submit Assignment
                    </Button>
                  </div>
                )}
                {sub?.status === "resubmit" && (
                  <div className="mt-3 flex justify-end">
                    <Button size="small" variant="outlined" onClick={() => { setSubmitDialog(a); setContent(sub.content || ""); setFileUrl(sub.fileUrl || ""); }}
                      sx={{ borderRadius: 2, borderColor: "rgba(251,191,36,0.4)", color: "#fde68a", fontSize: 11 }}>
                      Resubmit
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!submitDialog} onClose={() => setSubmitDialog(null)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Assignment</DialogTitle>
        <DialogContent>
          {submitDialog && (
            <p className="mb-4 text-sm text-white/50">{submitDialog.title} — {submitDialog.course?.title}</p>
          )}
          <div className="space-y-4 mt-2">
            <TextField fullWidth multiline rows={5} label="Your Answer / Explanation" value={content}
              onChange={(e) => setContent(e.target.value)} size="small"
              slotProps={{ input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} />
            <TextField fullWidth label="File URL (optional)" value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)} size="small" placeholder="https://..."
              slotProps={{ input: { sx: { color: "white" } }, inputLabel: { sx: { color: "rgba(255,255,255,0.6)" } } }} />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setSubmitDialog(null)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#f97316,#ea580c)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AssignmentSubmission;
