import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, CircularProgress, Skeleton, TextField, Tooltip } from "@mui/material";
import {
  ArrowLeft, Bookmark, ChevronDown, ChevronRight, Flame, HelpCircle,
  Megaphone, MessageSquare, Pin, Plus, Search, Send, Sparkles, ThumbsUp, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";
import { getSocket } from "../../services/socketClient";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
    "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.5)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#38bdf8" },
};

const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Post card used in feed
const PostCard = ({ post, onLike, onExpand, onSummarize }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-bold">
        {post.author?.avatar
          ? <img src={post.author.avatar} alt="" className="h-full w-full rounded-xl object-cover" />
          : post.author?.name?.[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold">{post.author?.name}</span>
          {post.author?.role === "teacher" && (
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">Teacher</span>
          )}
          {post.isQuestion && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">Q&A</span>
          )}
          {post.isPinned && <Pin size={11} className="text-yellow-400" />}
          {post.isLocked && <span className="text-[10px] text-white/30">🔒 Locked</span>}
          <span className="ml-auto text-[10px] text-white/30">{timeAgo(post.createdAt)}</span>
        </div>
        {post.title && <p className="mt-1 text-sm font-semibold">{post.title}</p>}
        <p className="mt-1 text-sm text-white/70 line-clamp-3">{post.content}</p>
        {post.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.tags.map((t) => (
              <span key={t} className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
    <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] pt-3">
      <button onClick={() => onLike(post._id)}
        className={`flex items-center gap-1.5 text-xs transition ${post.likedByMe ? "text-sky-400" : "text-white/40 hover:text-sky-400"}`}>
        <ThumbsUp size={13} /> {post.likeCount || 0}
      </button>
      <button onClick={() => onExpand(post)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition">
        <MessageSquare size={13} /> {post.replyCount || 0} replies
      </button>
      <button onClick={() => onSummarize(post._id)}
        className="ml-auto flex items-center gap-1 text-[10px] text-purple-400/70 hover:text-purple-300 transition">
        <Sparkles size={11} /> AI Summary
      </button>
    </div>
  </motion.div>
);

// ── Announcement card
const AnnouncementCard = ({ ann }) => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl border p-4 ${ann.isImportant ? "border-yellow-400/30 bg-yellow-400/[0.06]" : "border-white/10 bg-white/[0.04]"}`}>
    <div className="flex items-center gap-2 mb-2">
      {ann.isImportant && <span className="text-yellow-300 text-sm">📌</span>}
      <p className="text-sm font-semibold">{ann.title}</p>
      <span className="ml-auto text-[10px] text-white/30">{timeAgo(ann.createdAt)}</span>
    </div>
    <p className="text-sm text-white/60">{ann.content}</p>
    <p className="mt-2 text-[10px] text-white/30">Posted by {ann.teacher?.name}</p>
  </motion.div>
);

// ── Thread drawer (post + replies)
const ThreadDrawer = ({ post: initPost, courseId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: d } = await studentApi.getPostReplies(initPost._id);
      setData(d);
    } catch { toast.error("Failed to load thread"); }
    finally { setLoading(false); }
  }, [initPost._id]);

  useEffect(() => { load(); }, [load]);

  // Real-time reply
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (payload) => {
      if (payload.postId === initPost._id) {
        setData((prev) => prev ? { ...prev, replies: [...(prev.replies || []), payload.reply] } : prev);
      }
    };
    socket.on("new-reply", handler);
    return () => socket.off("new-reply", handler);
  }, [initPost._id]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      setSending(true);
      const { data: r } = await studentApi.replyToPost(initPost._id, { content: replyText.trim() });
      setData((prev) => prev ? { ...prev, replies: [...(prev.replies || []), r.reply] } : prev);
      setReplyText("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send reply");
    } finally { setSending(false); }
  };

  const handleSummarize = async () => {
    try {
      setSummarizing(true);
      const { data: s } = await studentApi.summarizePost(initPost._id);
      setSummary(s.summary);
    } catch { toast.error("AI summarization failed"); }
    finally { setSummarizing(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className={`h-full w-full max-w-lg overflow-y-auto ${glass} p-6 flex flex-col gap-4`}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/[0.05] p-1.5 text-white/50 hover:text-white transition">
            <ArrowLeft size={16} />
          </button>
          <p className="font-semibold truncate">{initPost.title || "Discussion Thread"}</p>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={72} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}</div>
        ) : !data ? null : (
          <>
            {/* Original post */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-xs font-bold">
                  {data.post?.author?.name?.[0]}
                </div>
                <span className="text-xs font-semibold">{data.post?.author?.name}</span>
                {data.post?.author?.role === "teacher" && (
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">Teacher</span>
                )}
                <span className="ml-auto text-[10px] text-white/30">{timeAgo(data.post?.createdAt)}</span>
              </div>
              {data.post?.title && <p className="text-sm font-semibold mb-1">{data.post.title}</p>}
              <p className="text-sm text-white/70">{data.post?.content}</p>
            </div>

            {/* AI Summary */}
            {summary ? (
              <div className="rounded-2xl border border-purple-400/20 bg-purple-400/[0.06] p-4">
                <p className="text-xs font-semibold text-purple-300 mb-1">AI Summary</p>
                <p className="text-sm text-white/70">{summary}</p>
              </div>
            ) : (
              <button onClick={handleSummarize} disabled={summarizing}
                className="flex items-center gap-2 self-start rounded-xl border border-purple-400/20 bg-purple-400/[0.06] px-3 py-2 text-xs text-purple-300 hover:bg-purple-400/[0.12] transition disabled:opacity-50">
                {summarizing ? <CircularProgress size={11} color="inherit" /> : <Sparkles size={12} />}
                {summarizing ? "Summarizing..." : "AI Summarize Thread"}
              </button>
            )}

            {/* Replies */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/50">{(data.replies || []).length} replies</p>
              {(data.replies || []).map((r) => (
                <div key={r._id} className="ml-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{r.author?.name}</span>
                    {r.author?.role === "teacher" && (
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">Teacher</span>
                    )}
                    <span className="ml-auto text-[10px] text-white/30">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-white/60">{r.content}</p>
                </div>
              ))}
            </div>

            {/* Reply input */}
            {!data.post?.isLocked && (
              <div className="flex gap-2 mt-auto pt-4 border-t border-white/[0.06]">
                <TextField size="small" multiline maxRows={4} placeholder="Write a reply..." value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  sx={{ ...inputSx, flex: 1 }} />
                <Button onClick={handleReply} disabled={sending || !replyText.trim()} variant="contained" size="small"
                  sx={{ borderRadius: 2, minWidth: 40, background: "linear-gradient(135deg,#38bdf8,#0ea5e9)" }}>
                  {sending ? <CircularProgress size={14} color="inherit" /> : <Send size={14} />}
                </Button>
              </div>
            )}
            {data.post?.isLocked && (
              <p className="text-xs text-white/30 text-center pt-4 border-t border-white/[0.06]">🔒 This thread is locked</p>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

// ── Main component
const CourseCommunity = () => {
  const [view, setView] = useState("communities"); // "communities" | "course"
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [tab, setTab] = useState("discussions"); // "discussions" | "announcements" | "trending"
  const [communities, setCommunities] = useState([]);
  const [commLoading, setCommLoading] = useState(true);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);

  const [trending, setTrending] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const [expandedPost, setExpandedPost] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", tags: "", isQuestion: false });
  const [creating, setCreating] = useState(false);

  // Load communities on mount
  useEffect(() => {
    studentApi.getMyCommunities()
      .then(({ data }) => setCommunities(data.communities || []))
      .catch(() => toast.error("Failed to load communities"))
      .finally(() => setCommLoading(false));
  }, []);

  // Load trending on mount
  useEffect(() => {
    if (tab === "trending") {
      setTrendLoading(true);
      studentApi.getTrendingPosts()
        .then(({ data }) => setTrending(data.posts || []))
        .catch(() => {})
        .finally(() => setTrendLoading(false));
    }
  }, [tab]);

  // Load posts when in course view
  const fetchPosts = useCallback(async () => {
    if (!selectedCourse) return;
    try {
      setPostsLoading(true);
      const { data } = await studentApi.getCoursePosts(selectedCourse.courseId, { page: postsPage, limit: 15, search: search || undefined, filter });
      setPosts(data.posts || []);
      setPostsTotal(data.pagination?.total || 0);
    } catch { toast.error("Failed to load posts"); }
    finally { setPostsLoading(false); }
  }, [selectedCourse, postsPage, search, filter]);

  useEffect(() => { if (view === "course" && tab === "discussions") fetchPosts(); }, [view, tab, fetchPosts]);

  // Load announcements
  const fetchAnnouncements = useCallback(async () => {
    if (!selectedCourse) return;
    setAnnLoading(true);
    studentApi.getCourseAnnouncements(selectedCourse.courseId)
      .then(({ data }) => setAnnouncements(data.announcements || []))
      .catch(() => {})
      .finally(() => setAnnLoading(false));
  }, [selectedCourse]);

  useEffect(() => { if (view === "course" && tab === "announcements") fetchAnnouncements(); }, [view, tab, fetchAnnouncements]);

  // Socket: join community room + listen for real-time events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedCourse) return;
    socket.emit("join-community", selectedCourse.courseId.toString());

    const onNewPost = (payload) => {
      setPosts((prev) => [payload.post, ...prev]);
    };
    const onAnnouncement = (payload) => {
      if (payload.courseId?.toString() === selectedCourse.courseId?.toString()) {
        toast(`📢 New announcement: ${payload.announcementTitle}`, { duration: 5000 });
        if (tab === "announcements") fetchAnnouncements();
      }
    };

    socket.on("new-post", onNewPost);
    socket.on("announcement-created", onAnnouncement);

    return () => {
      socket.emit("leave-community", selectedCourse.courseId.toString());
      socket.off("new-post", onNewPost);
      socket.off("announcement-created", onAnnouncement);
    };
  }, [selectedCourse, tab, fetchAnnouncements]);

  const enterCourse = (community) => {
    setSelectedCourse(community);
    setView("course");
    setTab("discussions");
    setPosts([]);
    setPostsPage(1);
    setSearch("");
    setFilter("all");
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await studentApi.likePost(postId);
      setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, likedByMe: data.liked, likeCount: data.likeCount } : p));
      setTrending((prev) => prev.map((p) => p._id === postId ? { ...p, likedByMe: data.liked, likeCount: data.likeCount } : p));
    } catch { toast.error("Failed to update like"); }
  };

  const handleSummarize = async (postId) => {
    setExpandedPost(posts.find((p) => p._id === postId) || trending.find((p) => p._id === postId));
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) { toast.error("Content is required"); return; }
    try {
      setCreating(true);
      const tags = newPost.tags.split(",").map((t) => t.trim()).filter(Boolean);
      const { data } = await studentApi.createCommunityPost(selectedCourse.courseId, {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        tags,
        isQuestion: newPost.isQuestion,
      });
      setPosts((prev) => [data.post, ...prev]);
      setNewPost({ title: "", content: "", tags: "", isQuestion: false });
      setCreateOpen(false);
      toast.success("Post created!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create post");
    } finally { setCreating(false); }
  };

  // ── Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {view === "course" && (
              <button onClick={() => setView("communities")}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-2 text-white/50 hover:text-white transition">
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {view === "communities" ? "Course Communities" : selectedCourse?.title}
              </h1>
              <p className="mt-1 text-white/60">
                {view === "communities"
                  ? "Join the conversation with your course communities"
                  : `Community · ${selectedCourse?.memberCount || 0} members`}
              </p>
            </div>
          </div>
          {view === "communities" && (
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-center">
              <p className="text-lg font-bold text-sky-300">{communities.length}</p>
              <p className="text-xs text-white/50">Communities</p>
            </div>
          )}
        </div>

        {/* Tabs (course view) */}
        {view === "course" && (
          <div className="mt-4 flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 w-fit">
            {[
              { key: "discussions", label: "Discussions", icon: MessageSquare },
              { key: "announcements", label: "Announcements", icon: Megaphone },
              { key: "trending", label: "Trending", icon: Flame },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${tab === key ? "bg-sky-500/20 text-sky-200" : "text-white/50 hover:text-white/80"}`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Communities list */}
      {view === "communities" && (
        <div>
          {commLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={140} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
            </div>
          ) : communities.length === 0 ? (
            <div className={`rounded-[24px] ${glass} p-12 text-center`}>
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-white/40">No communities yet — enroll in a course to join its community</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {communities.map((c) => (
                <motion.div key={c.courseId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => enterCourse(c)}
                  className={`rounded-[24px] ${glass} p-5 cursor-pointer hover:border-sky-400/30 transition group`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 overflow-hidden shrink-0">
                      {c.thumbnail
                        ? <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">{c.title?.[0]}</div>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.title}</p>
                      <p className="text-xs text-white/40">{c.memberCount} members · {c.postCount} posts</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-white/30 group-hover:text-sky-400 transition" />
                  </div>
                  {c.latest && (
                    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <p className="text-xs text-white/40">Latest: <span className="text-white/60">{c.latest.title || c.latest.content?.slice(0, 60)}</span></p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Trending section on communities page */}
          <div className={`mt-4 rounded-[24px] ${glass} p-6`}>
            <div className="mb-4 flex items-center gap-2">
              <Flame size={16} className="text-orange-400" />
              <p className="font-semibold">Trending This Week</p>
            </div>
            {trendLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={56} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}</div>
            ) : trending.length === 0 ? (
              <p className="text-sm text-white/30 py-4 text-center">No trending discussions yet</p>
            ) : (
              <div className="space-y-2">
                {trending.map((p) => (
                  <div key={p._id} onClick={() => { setExpandedPost(p); }}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 cursor-pointer hover:border-sky-400/20 transition">
                    <Flame size={13} className="text-orange-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{p.title || p.content?.slice(0, 60)}</p>
                      <p className="text-[10px] text-white/30">{p.course?.title}</p>
                    </div>
                    <div className="shrink-0 flex gap-2 text-[10px] text-white/40">
                      <span>{p.likeCount} ❤</span>
                      <span>{p.replyCount} 💬</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course view: Discussions tab */}
      {view === "course" && tab === "discussions" && (
        <div className={`rounded-[24px] ${glass} p-6`}>
          {/* Controls */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 min-w-[180px]">
              <Search size={14} className="text-white/30 shrink-0" />
              <input placeholder="Search discussions..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPostsPage(1); }}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
            </div>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
              {["all", "questions", "pinned"].map((f) => (
                <button key={f} onClick={() => { setFilter(f); setPostsPage(1); }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${filter === f ? "bg-sky-500/20 text-sky-200" : "text-white/40 hover:text-white/70"}`}>
                  {f}
                </button>
              ))}
            </div>
            <Button onClick={() => setCreateOpen(true)} variant="contained" size="small" startIcon={<Plus size={14} />}
              sx={{ borderRadius: 2, background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", fontWeight: 700 }}>
              New Post
            </Button>
          </div>

          {/* Create post form */}
          <AnimatePresence>
            {createOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden rounded-2xl border border-sky-400/20 bg-sky-400/[0.05] p-4">
                <div className="space-y-3">
                  <TextField fullWidth size="small" label="Title (optional)" value={newPost.title}
                    onChange={(e) => setNewPost((f) => ({ ...f, title: e.target.value }))} sx={inputSx} />
                  <TextField fullWidth size="small" label="Content *" multiline rows={3} value={newPost.content}
                    onChange={(e) => setNewPost((f) => ({ ...f, content: e.target.value }))} sx={inputSx} />
                  <div className="flex flex-wrap gap-3 items-center">
                    <TextField size="small" label="Tags (comma separated)" value={newPost.tags}
                      onChange={(e) => setNewPost((f) => ({ ...f, tags: e.target.value }))} sx={{ ...inputSx, flex: 1, minWidth: 160 }} />
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                      <input type="checkbox" checked={newPost.isQuestion}
                        onChange={(e) => setNewPost((f) => ({ ...f, isQuestion: e.target.checked }))}
                        className="rounded" />
                      <HelpCircle size={14} /> Mark as Q&A
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => setCreateOpen(false)} size="small" variant="outlined"
                      sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>Cancel</Button>
                    <Button onClick={handleCreatePost} disabled={creating} variant="contained" size="small"
                      sx={{ borderRadius: 2, background: "linear-gradient(135deg,#38bdf8,#0ea5e9)", fontWeight: 700 }}>
                      {creating ? <CircularProgress size={14} color="inherit" /> : "Post"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts list */}
          {postsLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={100} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}</div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p>No discussions yet — be the first to post!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <PostCard key={p._id} post={p} onLike={handleLike} onExpand={setExpandedPost} onSummarize={handleSummarize} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {postsTotal > 15 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => setPostsPage((p) => Math.max(1, p - 1))} disabled={postsPage === 1}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/50 hover:text-white disabled:opacity-30 transition">Prev</button>
              <span className="text-xs text-white/40">Page {postsPage}</span>
              <button onClick={() => setPostsPage((p) => p + 1)} disabled={posts.length < 15}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/50 hover:text-white disabled:opacity-30 transition">Next</button>
            </div>
          )}
        </div>
      )}

      {/* Course view: Announcements tab */}
      {view === "course" && tab === "announcements" && (
        <div className={`rounded-[24px] ${glass} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <Megaphone size={16} className="text-sky-400" />
            <p className="font-semibold">Announcements</p>
          </div>
          {annLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={100} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}</div>
          ) : announcements.length === 0 ? (
            <p className="py-12 text-center text-white/40">No announcements for this course yet</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => <AnnouncementCard key={a._id} ann={a} />)}
            </div>
          )}
        </div>
      )}

      {/* Course view: Trending tab */}
      {view === "course" && tab === "trending" && (
        <div className={`rounded-[24px] ${glass} p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <Flame size={16} className="text-orange-400" />
            <p className="font-semibold">Trending This Week</p>
          </div>
          {trendLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={100} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}</div>
          ) : trending.length === 0 ? (
            <p className="py-12 text-center text-white/40">No trending discussions this week</p>
          ) : (
            <div className="space-y-3">
              {trending.map((p) => (
                <PostCard key={p._id} post={p} onLike={handleLike} onExpand={setExpandedPost} onSummarize={() => setExpandedPost(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Thread drawer */}
      <AnimatePresence>
        {expandedPost && (
          <ThreadDrawer post={expandedPost} courseId={selectedCourse?.courseId || expandedPost.course?._id} onClose={() => setExpandedPost(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// Load trending on communities tab mount
const CourseCommunityWithTrending = () => {
  const [trending, setTrending] = useState([]);
  useEffect(() => {
    studentApi.getTrendingPosts()
      .then(({ data }) => setTrending(data.posts || []))
      .catch(() => {});
  }, []);
  return <CourseCommunity _trending={trending} />;
};

export default CourseCommunity;
