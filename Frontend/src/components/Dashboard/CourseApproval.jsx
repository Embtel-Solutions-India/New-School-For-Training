import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Avatar, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Pagination, Skeleton,
  Tab, Tabs, TextField, Tooltip,
} from "@mui/material";
import { BookOpen, Check, ChevronRight, Flag, MessageSquare, RotateCcw, Star, X } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const STATUS_TABS = [
  { label: "Pending", value: "pending_review" },
  { label: "Published", value: "published" },
  { label: "Rejected", value: "rejected" },
  { label: "All Courses", value: "all" },
];

const statusColor = (status) => {
  const map = {
    pending_review: { bg: "rgba(251,191,36,0.15)", color: "#fde68a" },
    published: { bg: "rgba(34,197,94,0.15)", color: "#86efac" },
    rejected: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5" },
    draft: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" },
    archived: { bg: "rgba(148,163,184,0.12)", color: "#64748b" },
  };
  return map[status] || { bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" };
};

const CourseApproval = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending_review");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [actionDialog, setActionDialog] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getCourses({ status: tab, page, limit: 10 });
      setCourses(data.courses || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const openAction = (course, type) => {
    setActionDialog({ course, type });
    setNoteText("");
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    const { course, type } = actionDialog;
    if ((type === "reject" || type === "changes") && !noteText.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      setSaving(true);
      if (type === "approve") await adminApi.approveCourse(course._id, noteText);
      else if (type === "reject") await adminApi.rejectCourse(course._id, noteText);
      else if (type === "feature") await adminApi.featureCourse(course._id);
      else if (type === "changes") await adminApi.requestCourseChanges(course._id, noteText);
      toast.success(`Course ${type === "approve" ? "approved" : type === "reject" ? "rejected" : type === "feature" ? "featured" : "sent back for changes"}`);
      setActionDialog(null);
      fetchCourses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const actionMeta = {
    approve: { label: "Approve Course", color: "linear-gradient(135deg,#22c55e,#16a34a)", icon: Check },
    reject: { label: "Reject Course", color: "linear-gradient(135deg,#ef4444,#dc2626)", icon: X },
    feature: { label: "Toggle Featured", color: "linear-gradient(135deg,#f97316,#ea580c)", icon: Flag },
    changes: { label: "Request Changes", color: "linear-gradient(135deg,#38bdf8,#0284c7)", icon: RotateCcw },
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Course Approval</h1>
            <p className="mt-2 text-white/60">Review, approve, reject, and feature courses</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2">
            <BookOpen size={16} className="text-yellow-300" />
            <span className="text-sm font-semibold text-yellow-200">
              {loading ? "…" : pagination.total} courses
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[28px] ${glass} overflow-hidden`}>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setPage(1); }}
          sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", px: 3, "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontWeight: 600 }, "& .Mui-selected": { color: "white" }, "& .MuiTabs-indicator": { bgcolor: "#22c55e" } }}
        >
          {STATUS_TABS.map((t) => <Tab key={t.value} label={t.label} value={t.value} />)}
        </Tabs>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={90} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="py-16 text-center text-white/40">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p>No courses in this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course, i) => {
                const sc = statusColor(course.status);
                return (
                  <motion.div key={course._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <BookOpen size={20} className="text-white/30" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white truncate max-w-xs">{course.title}</p>
                            <Chip label={course.status?.replace("_", " ")} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 10 }} />
                            {course.isFeatured && <Chip label="Featured" size="small" sx={{ bgcolor: "rgba(249,115,22,0.15)", color: "#fdba74", fontWeight: 700, fontSize: 10 }} />}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/50">
                            <span className="flex items-center gap-1">
                              <Avatar src={course.teacher?.avatar} sx={{ width: 16, height: 16, fontSize: 10 }}>{course.teacher?.name?.[0]}</Avatar>
                              {course.teacher?.name || "Unknown"}
                            </span>
                            {course.category && <span className="rounded-full bg-white/10 px-2 py-0.5">{course.category}</span>}
                            {course.pricing?.price > 0 && <span className="text-emerald-300 font-semibold">${course.pricing.price}</span>}
                            <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                          </div>
                          {course.approvalNote && (
                            <p className="mt-1 text-xs text-white/40 italic truncate max-w-sm">Note: {course.approvalNote}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {course.status !== "published" && (
                          <Tooltip title="Approve">
                            <IconButton size="small" onClick={() => openAction(course, "approve")} sx={{ bgcolor: "rgba(34,197,94,0.1)", color: "#86efac", "&:hover": { bgcolor: "rgba(34,197,94,0.2)" } }}>
                              <Check size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {course.status !== "rejected" && (
                          <Tooltip title="Reject">
                            <IconButton size="small" onClick={() => openAction(course, "reject")} sx={{ bgcolor: "rgba(239,68,68,0.1)", color: "#fca5a5", "&:hover": { bgcolor: "rgba(239,68,68,0.2)" } }}>
                              <X size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Request changes">
                          <IconButton size="small" onClick={() => openAction(course, "changes")} sx={{ bgcolor: "rgba(56,189,248,0.1)", color: "#7dd3fc", "&:hover": { bgcolor: "rgba(56,189,248,0.2)" } }}>
                            <MessageSquare size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={course.isFeatured ? "Unfeature" : "Feature course"}>
                          <IconButton size="small" onClick={() => openAction(course, "feature")} sx={{ bgcolor: course.isFeatured ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.08)", color: "#fdba74", "&:hover": { bgcolor: "rgba(249,115,22,0.2)" } }}>
                            <Star size={16} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination count={pagination.pages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={Boolean(actionDialog)} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } }}>
        {actionDialog && (() => {
          const meta = actionMeta[actionDialog.type];
          const Icon = meta.icon;
          const needsNote = actionDialog.type === "reject" || actionDialog.type === "changes";
          return (
            <>
              <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Icon size={20} /> {meta.label}
              </DialogTitle>
              <DialogContent>
                <p className="mb-4 text-sm text-white/60">
                  Course: <span className="font-semibold text-white">{actionDialog.course.title}</span>
                </p>
                {(needsNote || actionDialog.type === "approve") && (
                  <TextField fullWidth multiline rows={3} label={needsNote ? "Reason (required)" : "Note (optional)"}
                    value={noteText} onChange={(e) => setNoteText(e.target.value)} size="small"
                    InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
                )}
                {actionDialog.type === "feature" && (
                  <p className="text-sm text-white/60">
                    This will {actionDialog.course.isFeatured ? "remove the course from" : "add the course to"} the featured section.
                  </p>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                <Button onClick={() => setActionDialog(null)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
                <Button onClick={handleAction} variant="contained" disabled={saving}
                  sx={{ borderRadius: 3, background: meta.color, fontWeight: 700 }}>
                  {saving ? <CircularProgress size={18} color="inherit" /> : "Confirm"}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </div>
  );
};

export default CourseApproval;
