import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputLabel, MenuItem, Pagination, Select, Skeleton, TextField, Tooltip,
} from "@mui/material";
import { MessageSquare, Pin, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const DiscussionModeration = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [replyDialog, setReplyDialog] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    teacherApi.getCourses().then(({ data }) => {
      const list = data.courses || [];
      setCourses(list);
      if (list.length > 0) setSelectedCourse(list[0]);
    }).catch(() => {});
  }, []);

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

  useEffect(() => { fetchDiscussions(); }, [fetchDiscussions]);

  const handlePin = async (id) => {
    try {
      await teacherApi.pinDiscussion(id);
      toast.success("Pinned status updated");
      fetchDiscussions();
    } catch { toast.error("Pin failed"); }
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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Discussion Moderation</h1>
          <p className="mt-2 text-white/60">View, reply, pin, and moderate course discussions</p>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Course Selector */}
        <div className={`rounded-[24px] ${glass} p-4`}>
          <p className="mb-3 text-sm font-semibold text-white/60">Select Course</p>
          <div className="space-y-1">
            {courses.map((c) => (
              <button key={c._id} onClick={() => { setSelectedCourse(c); setPage(1); }}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedCourse?._id === c._id ? "bg-indigo-500/20 text-indigo-200 font-semibold" : "text-white/60 hover:bg-white/[0.06]"}`}>
                <p className="truncate">{c.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Discussions */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          {/* Filters */}
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

          {!selectedCourse ? (
            <p className="py-12 text-center text-white/40">Select a course to moderate</p>
          ) : loading ? (
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{post.author?.name}</p>
                          {post.isPinned && <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300 font-bold">Pinned</span>}
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40 capitalize">{post.author?.role}</span>
                        </div>
                        <p className="text-xs text-white/35">{new Date(post.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip title={post.isPinned ? "Unpin" : "Pin"}>
                        <IconButton size="small" onClick={() => handlePin(post._id)}
                          sx={{ color: post.isPinned ? "rgba(129,140,248,0.8)" : "rgba(255,255,255,0.4)" }}>
                          <Pin size={13} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove Post">
                        <IconButton size="small" onClick={() => handleDelete(post._id)} sx={{ color: "rgba(239,68,68,0.6)" }}>
                          <Trash2 size={13} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed">{post.content}</p>

                  {/* Replies */}
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
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={!!replyDialog} onClose={() => setReplyDialog(null)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reply to Discussion</DialogTitle>
        <DialogContent>
          {replyDialog && <p className="mb-4 text-sm text-white/50 italic line-clamp-3">"{replyDialog.content}"</p>}
          <TextField fullWidth multiline rows={4} label="Your Reply" value={replyText} onChange={(e) => setReplyText(e.target.value)}
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
