import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, MenuItem, Select,
  Skeleton, TextField, Tooltip,
} from "@mui/material";
import { CheckCircle2, Eye, FileText, Trash2, X, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import blogApi from "../../services/blogApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const STATUS_MAP = {
  draft:     { label: "Draft",          color: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  pending:   { label: "Pending Review", color: "rgba(251,191,36,0.15)",  text: "#fbbf24" },
  approved:  { label: "Approved",       color: "rgba(34,197,94,0.15)",   text: "#86efac" },
  rejected:  { label: "Rejected",       color: "rgba(239,68,68,0.15)",   text: "#f87171" },
  published: { label: "Published",      color: "rgba(34,197,94,0.15)",   text: "#86efac" },
};

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionTarget, setActionTarget] = useState(null); // { blog, type: "reject" }
  const [rejectNote, setRejectNote] = useState("");
  const [acting, setActing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const fn = statusFilter === "pending"
      ? blogApi.getPendingBlogs()
      : blogApi.getAllBlogsAdmin({ status: statusFilter || undefined });
    fn
      .then(({ data }) => setBlogs(data.blogs || []))
      .catch(() => toast.error("Failed to load blogs"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (blog) => {
    setActing(blog._id);
    try {
      await blogApi.approveBlog(blog._id);
      setBlogs((prev) => prev.filter((b) => b._id !== blog._id));
      toast.success(`"${blog.title}" approved and published`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve");
    } finally {
      setActing(null);
    }
  };

  const openReject = (blog) => {
    setActionTarget({ blog, type: "reject" });
    setRejectNote("");
  };

  const handleReject = async () => {
    if (!actionTarget) return;
    setActing(actionTarget.blog._id);
    try {
      await blogApi.rejectBlog(actionTarget.blog._id, rejectNote);
      setBlogs((prev) => prev.filter((b) => b._id !== actionTarget.blog._id));
      toast.success("Blog rejected");
      setActionTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject");
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await blogApi.adminDeleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b._id !== id));
      toast.success("Blog deleted");
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeleting(null);
    }
  };

  const pending = blogs.filter((b) => b.status === "pending").length;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Blog Moderation</h2>
          <p className="text-white/50 text-sm mt-1">{blogs.length} blogs · {pending} pending</p>
        </div>
        <FormControl size="small" sx={{ minWidth: 160,
          "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.15)" } },
          "& .MuiSelect-icon": { color: "rgba(255,255,255,0.5)" },
        }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ color: "white", fontSize: 13 }}>
            <MenuItem value="pending">Pending Review</MenuItem>
            <MenuItem value="">All Blogs</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="draft">Drafts</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={100}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 3 }} />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && blogs.length === 0 && (
        <div className={`${glass} rounded-2xl p-14 text-center`}>
          <FileText size={44} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No blogs in this category</p>
        </div>
      )}

      {/* BLOG ROWS */}
      {!loading && blogs.length > 0 && (
        <div className="space-y-3">
          {blogs.map((blog, i) => {
            const s = STATUS_MAP[blog.status] || STATUS_MAP.draft;
            return (
              <motion.div
                key={blog._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`${glass} rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4`}
              >
                {/* Cover */}
                {blog.featuredImage && (
                  <img src={blog.featuredImage} alt={blog.title}
                    className="w-full sm:w-20 h-20 shrink-0 object-cover rounded-xl"
                    onError={(e) => { e.target.style.display = "none"; }} />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="text-white font-semibold text-sm leading-snug line-clamp-1 flex-1">
                      {blog.title}
                    </h3>
                    <span className="shrink-0 text-xs px-2.5 py-0.5 rounded-full font-semibold"
                      style={{ background: s.color, color: s.text }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/40">
                    <span>By {blog.author?.name || "Unknown"}</span>
                    <span>{blog.category}</span>
                    <span><Eye size={10} className="inline mr-0.5" />{blog.views ?? 0}</span>
                    <span>{new Date(blog.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {blog.status === "pending" && (
                    <>
                      <Tooltip title="Approve & Publish">
                        <IconButton size="small" onClick={() => handleApprove(blog)}
                          disabled={acting === blog._id}
                          sx={{ color: "#86efac", bgcolor: "rgba(34,197,94,0.1)", borderRadius: 1.5 }}>
                          {acting === blog._id
                            ? <CircularProgress size={14} sx={{ color: "#86efac" }} />
                            : <CheckCircle2 size={16} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" onClick={() => openReject(blog)}
                          sx={{ color: "#f87171", bgcolor: "rgba(239,68,68,0.1)", borderRadius: 1.5 }}>
                          <XCircle size={16} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(blog._id)}
                      disabled={deleting === blog._id}
                      sx={{ color: "rgba(239,68,68,0.5)", "&:hover": { color: "#ef4444" } }}>
                      {deleting === blog._id
                        ? <CircularProgress size={12} sx={{ color: "#ef4444" }} />
                        : <Trash2 size={14} />}
                    </IconButton>
                  </Tooltip>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* REJECT DIALOG */}
      <Dialog
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: "rgba(7,11,20,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              color: "white",
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="font-bold text-white">Reject Blog</span>
          <IconButton onClick={() => setActionTarget(null)} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <X size={16} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <p className="text-white/50 text-sm mb-4">
            Optionally provide feedback for the teacher:
          </p>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Rejection reason (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white", fontSize: 13,
                "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
                "&.Mui-focused fieldset": { borderColor: "#ef4444" },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setActionTarget(null)}
            sx={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>
            Cancel
          </Button>
          <Button onClick={handleReject} disabled={!!acting}
            sx={{ bgcolor: "rgba(239,68,68,0.15)", color: "#f87171", fontWeight: 700, borderRadius: 2,
              "&:hover": { bgcolor: "rgba(239,68,68,0.25)" } }}>
            {acting ? <CircularProgress size={16} sx={{ color: "#f87171" }} /> : "Reject Blog"}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
