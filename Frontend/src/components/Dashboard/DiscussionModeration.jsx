import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Pagination, Select, Skeleton,
  TextField, Tooltip,
} from "@mui/material";
import { CheckCircle2, HelpCircle, Lock, Megaphone, MessageSquare, Pin, Plus, Search, Trash2, Unlock } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const TABS = [
  { key: "posts", label: "Posts", icon: MessageSquare },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "questions", label: "Q&A", icon: HelpCircle },
];

const DiscussionModeration = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [tab, setTab] = useState("posts");

  // Posts state
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [replyDialog, setReplyDialog] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", content: "", isImportant: false });
  const [annCreating, setAnnCreating] = useState(false);
  const [annFormOpen, setAnnFormOpen] = useState(false);

  // Q&A state
  const [questions, setQuestions] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);

  useEffect(() => {
    teacherApi.getCourses().then(({ data }) => {
      const list = data.courses || [];
      setCourses(list);
      if (list.length > 0) setSelectedCourse(list[0]);
    }).catch(() => {});
  }, []);

  // Fetch discussions
  const fetchDiscussions = useCallback(async () => {
    if (!selectedCourse) return;
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (pinnedOnly) params.pinned = "true";
      const { data } = await teacherApi.getDiscussions(selectedCourse._id, params);
      setDiscussions(data.discussions || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch { toast.error("Failed to load discussions"); }
    finally { setLoading(false); }
  }, [selectedCourse, page, search, pinnedOnly]);

  useEffect(() => { if (tab === "posts") fetchDiscussions(); }, [tab, fetchDiscussions]);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    if (!selectedCourse) return;
    setAnnLoading(true);
    teacherApi.getCommunityAnnouncements(selectedCourse._id)
      .then(({ data }) => setAnnouncements(data.announcements || []))
      .catch(() => toast.error("Failed to load announcements"))
      .finally(() => setAnnLoading(false));
  }, [selectedCourse]);

  useEffect(() => { if (tab === "announcements") fetchAnnouncements(); }, [tab, fetchAnnouncements]);

  // Fetch pending Q&A
  const fetchQuestions = useCallback(async () => {
    if (!selectedCourse) return;
    setQaLoading(true);
    teacherApi.getPendingQuestions(selectedCourse._id)
      .then(({ data }) => setQuestions(data.questions || []))
      .catch(() => toast.error("Failed to load questions"))
      .finally(() => setQaLoading(false));
  }, [selectedCourse]);

  useEffect(() => { if (tab === "questions") fetchQuestions(); }, [tab, fetchQuestions]);

  // Course change
  const handleCourseSelect = (c) => {
    setSelectedCourse(c);
    setPage(1);
    setDiscussions([]);
    setAnnouncements([]);
    setQuestions([]);
  };

  // Post actions
  const handlePin = async (id) => {
    try {
      await teacherApi.pinDiscussion(id);
      toast.success("Pin status updated");
      fetchDiscussions();
    } catch { toast.error("Pin failed"); }
  };

  const handleLock = async (id, isLocked) => {
    try {
      await teacherApi.lockDiscussion(id);
      toast.success(isLocked ? "Thread unlocked" : "Thread locked");
      fetchDiscussions();
    } catch { toast.error("Failed to update lock status"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this post?")) return;
    try {
      await teacherApi.deleteDiscussion(id);
      toast.success("Post removed");
      fetchDiscussions();
    } catch { toast.error("Delete failed"); }
  };

  const openReply = (post) => { setReplyDialog(post); setReplyText(""); };
  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSaving(true);
      await teacherApi.replyToDiscussion(replyDialog._id, replyText.trim());
      toast.success("Reply posted");
      setReplyDialog(null);
      fetchDiscussions();
    } catch { toast.error("Reply failed"); }
    finally { setSaving(false); }
  };

  // Announcement actions
  const handleCreateAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.content.trim()) { toast.error("Title and content are required"); return; }
    try {
      setAnnCreating(true);
      await teacherApi.createAnnouncement(selectedCourse._id, annForm);
      toast.success("Announcement posted!");
      setAnnForm({ title: "", content: "", isImportant: false });
      setAnnFormOpen(false);
      fetchAnnouncements();
    } catch { toast.error("Failed to post announcement"); }
    finally { setAnnCreating(false); }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await teacherApi.deleteAnnouncement(id);
      toast.success("Announcement deleted");
      fetchAnnouncements();
    } catch { toast.error("Delete failed"); }
  };

  // Q&A resolve
  const handleResolve = async (id) => {
    try {
      await teacherApi.resolveQuestion(id);
      toast.success("Marked as resolved");
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch { toast.error("Failed to resolve"); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Discussion Moderation</h1>
            <p className="mt-2 text-white/60">Moderate posts, post announcements, and answer student questions</p>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${tab === key ? "bg-indigo-500/20 text-indigo-200" : "text-white/50 hover:text-white/80"}`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Course Selector */}
        <div className={`rounded-[24px] ${glass} p-4`}>
          <p className="mb-3 text-sm font-semibold text-white/60">Select Course</p>
          <div className="space-y-1">
            {courses.map((c) => (
              <button key={c._id} onClick={() => handleCourseSelect(c)}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedCourse?._id === c._id ? "bg-indigo-500/20 text-indigo-200 font-semibold" : "text-white/60 hover:bg-white/[0.06]"}`}>
                <p className="truncate">{c.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content panel */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          {!selectedCourse ? (
            <p className="py-12 text-center text-white/40">Select a course to get started</p>
          ) : (
            <>
              {/* ── POSTS TAB ── */}
              {tab === "posts" && (
                <>
                  <div className="mb-5 flex flex-wrap gap-3">
                    <TextField placeholder="Search discussions..." value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }} size="small"
                      InputProps={{ startAdornment: <Search size={14} className="mr-2 text-white/40" />, sx: { color: "white" } }}
                      sx={{ flex: 1, minWidth: 200 }} />
                    <button onClick={() => { setPinnedOnly((v) => !v); setPage(1); }}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${pinnedOnly ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-300" : "border-white/10 text-white/50 hover:text-white"}`}>
                      <Pin size={12} /> Pinned Only
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
                    </div>
                  ) : discussions.length === 0 ? (
                    <div className="py-12 text-center text-white/40">
                      <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
                      <p>No discussions found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {discussions.map((post, i) => (
                        <motion.div key={post._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className={`rounded-2xl border p-4 transition ${post.isPinned ? "border-indigo-400/30 bg-indigo-400/5" : "border-white/10 bg-white/[0.03]"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold">
                                {post.author?.name?.[0] || "?"}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">{post.author?.name}</p>
                                  {post.isPinned && <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300 font-bold">Pinned</span>}
                                  {post.isLocked && <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300 font-bold">Locked</span>}
                                  {post.isQuestion && <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300 font-bold">Q&A</span>}
                                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40 capitalize">{post.author?.role}</span>
                                </div>
                                <p className="text-xs text-white/35">{new Date(post.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Tooltip title={post.isPinned ? "Unpin" : "Pin"}>
                                <IconButton size="small" onClick={() => handlePin(post._id)}
                                  sx={{ color: post.isPinned ? "rgba(129,140,248,0.8)" : "rgba(255,255,255,0.4)" }}>
                                  <Pin size={13} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={post.isLocked ? "Unlock thread" : "Lock thread"}>
                                <IconButton size="small" onClick={() => handleLock(post._id, post.isLocked)}
                                  sx={{ color: post.isLocked ? "rgba(251,191,36,0.8)" : "rgba(255,255,255,0.3)" }}>
                                  {post.isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove Post">
                                <IconButton size="small" onClick={() => handleDelete(post._id)} sx={{ color: "rgba(239,68,68,0.6)" }}>
                                  <Trash2 size={13} />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </div>
                          {post.title && <p className="mt-2 text-sm font-semibold">{post.title}</p>}
                          <p className="mt-1 text-sm text-white/70 leading-relaxed">{post.content}</p>

                          {(post.replies || []).length > 0 && (
                            <div className="mt-3 space-y-2 border-l-2 border-white/10 pl-4">
                              {post.replies.map((reply) => (
                                <div key={reply._id} className="rounded-xl bg-white/[0.04] p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-semibold">{reply.author?.name}</p>
                                    <span className="text-xs text-white/30 capitalize">{reply.author?.role}</span>
                                  </div>
                                  <p className="text-xs text-white/60">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-2">
                            <Button size="small" variant="outlined" onClick={() => openReply(post)}
                              sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                              Reply
                            </Button>
                            <span className="text-xs text-white/30">{post.replyCount || 0} replies</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="mt-4 flex justify-center">
                      <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
                    </div>
                  )}
                </>
              )}

              {/* ── ANNOUNCEMENTS TAB ── */}
              {tab === "announcements" && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold">Course Announcements</p>
                    <Button onClick={() => setAnnFormOpen((v) => !v)} variant="contained" size="small" startIcon={<Plus size={14} />}
                      sx={{ borderRadius: 2, background: "linear-gradient(135deg,#6366f1,#4f46e5)", fontWeight: 700 }}>
                      New Announcement
                    </Button>
                  </div>

                  {annFormOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="mb-4 overflow-hidden rounded-2xl border border-indigo-400/20 bg-indigo-400/[0.05] p-4 space-y-3">
                      <TextField fullWidth size="small" label="Title" value={annForm.title}
                        onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))}
                        InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} />
                      <TextField fullWidth size="small" label="Content" multiline rows={3} value={annForm.content}
                        onChange={(e) => setAnnForm((f) => ({ ...f, content: e.target.value }))}
                        InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.5)" } }} />
                      <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                        <input type="checkbox" checked={annForm.isImportant}
                          onChange={(e) => setAnnForm((f) => ({ ...f, isImportant: e.target.checked }))} />
                        📌 Mark as Important
                      </label>
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => setAnnFormOpen(false)} size="small" variant="outlined"
                          sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>Cancel</Button>
                        <Button onClick={handleCreateAnnouncement} disabled={annCreating} variant="contained" size="small"
                          sx={{ borderRadius: 2, background: "linear-gradient(135deg,#6366f1,#4f46e5)", fontWeight: 700 }}>
                          {annCreating ? <CircularProgress size={14} color="inherit" /> : "Post"}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {annLoading ? (
                    <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={100} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}</div>
                  ) : announcements.length === 0 ? (
                    <div className="py-12 text-center text-white/40">
                      <Megaphone size={36} className="mx-auto mb-2 opacity-30" />
                      <p>No announcements yet — post one above</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((a) => (
                        <motion.div key={a._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl border p-4 ${a.isImportant ? "border-yellow-400/30 bg-yellow-400/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {a.isImportant && <span className="text-yellow-300">📌</span>}
                              <p className="text-sm font-semibold">{a.title}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/30">{new Date(a.createdAt).toLocaleDateString()}</span>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDeleteAnnouncement(a._id)} sx={{ color: "rgba(239,68,68,0.6)" }}>
                                  <Trash2 size={13} />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-white/60">{a.content}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Q&A TAB ── */}
              {tab === "questions" && (
                <>
                  <p className="mb-4 font-semibold">Pending Student Questions</p>
                  {qaLoading ? (
                    <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={80} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}</div>
                  ) : questions.length === 0 ? (
                    <div className="py-12 text-center text-white/40">
                      <CheckCircle2 size={36} className="mx-auto mb-2 opacity-30" />
                      <p>All questions resolved!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q) => (
                        <motion.div key={q._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-purple-400/20 bg-purple-400/[0.04] p-4">
                          <div className="flex items-start gap-3">
                            <HelpCircle size={16} className="text-purple-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-semibold">{q.author?.name}</p>
                                <span className="text-xs text-white/30">{new Date(q.createdAt).toLocaleDateString()}</span>
                              </div>
                              {q.title && <p className="text-sm font-semibold mb-1">{q.title}</p>}
                              <p className="text-sm text-white/60">{q.content}</p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button onClick={() => openReply(q)} size="small" variant="outlined"
                                sx={{ borderRadius: 2, borderColor: "rgba(129,140,248,0.4)", color: "#a78bfa", fontSize: 11 }}>
                                Answer
                              </Button>
                              <Button onClick={() => handleResolve(q._id)} size="small" variant="outlined"
                                sx={{ borderRadius: 2, borderColor: "rgba(34,197,94,0.3)", color: "#86efac", fontSize: 11 }}>
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={!!replyDialog} onClose={() => setReplyDialog(null)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {replyDialog?.isQuestion ? "Answer Question" : "Reply to Discussion"}
        </DialogTitle>
        <DialogContent>
          {replyDialog && <p className="mb-4 text-sm text-white/50 italic line-clamp-3">"{replyDialog.content}"</p>}
          <TextField fullWidth multiline rows={4} label={replyDialog?.isQuestion ? "Your Answer" : "Your Reply"}
            value={replyText} onChange={(e) => setReplyText(e.target.value)}
            size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setReplyDialog(null)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleReply} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#6366f1,#4f46e5)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Post Reply"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DiscussionModeration;
