import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Pagination,
  Select, Skeleton, Tab, Tabs, TextField, Tooltip,
} from "@mui/material";
import { Edit, Eye, FileText, Globe, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import blogApi from "../../services/blogApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& input": { padding: "13px 16px" },
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
    "&.Mui-focused fieldset": { borderColor: "#22c55e" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#22c55e" },
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.5)" },
};

const STATUS_MAP = {
  draft: { label: "Draft", color: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  published: { label: "Published", color: "rgba(34,197,94,0.15)", text: "#86efac" },
};

const BLOG_CATEGORIES = [
  "AI & Data", "Cloud & Security", "Development", "Career",
  "Technology", "Certifications", "Student Stories", "Industry Trends",
];

const TOOLBAR = [
  { label: "B", title: "Bold", open: "<strong>", close: "</strong>", cls: "font-bold" },
  { label: "I", title: "Italic", open: "<em>", close: "</em>", cls: "italic" },
  { label: "H2", title: "Heading 2", open: "<h2>", close: "</h2>", cls: "" },
  { label: "H3", title: "Heading 3", open: "<h3>", close: "</h3>", cls: "" },
  { label: "• List", title: "Bullet List", open: "<ul>\n  <li>", close: "</li>\n</ul>", cls: "" },
  { label: "1. List", title: "Numbered List", open: "<ol>\n  <li>", close: "</li>\n</ol>", cls: "" },
  { label: "</>", title: "Code Block", open: "<pre><code>", close: "</code></pre>", cls: "font-mono" },
  { label: '"', title: "Blockquote", open: "<blockquote>", close: "</blockquote>", cls: "" },
  { label: "Link", title: "Hyperlink", open: '<a href="URL">', close: "</a>", cls: "" },
];

const EMPTY_FORM = {
  title: "", subtitle: "", slug: "", shortDescription: "",
  content: "", featuredImage: "", category: "Technology",
  tags: "", status: "draft",
};

const buildSlug = (t = "") =>
  t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function TeacherBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const contentRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    blogApi.getMyBlogs()
      .then(({ data }) => setBlogs(data.blogs || []))
      .catch(() => toast.error("Failed to load blogs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setActiveTab(0);
    setDialogOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b._id);
    setForm({
      title: b.title || "",
      subtitle: b.subtitle || "",
      slug: b.slug || "",
      shortDescription: b.shortDescription || "",
      content: b.content || "",
      featuredImage: b.featuredImage || "",
      category: b.category || "Technology",
      tags: (b.tags || []).join(", "),
      status: b.status || "draft",
    });
    setActiveTab(0);
    setDialogOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === "title" && !editing) next.slug = buildSlug(value);
      return next;
    });
  };

  // Insert HTML tag at cursor in the content textarea
  const insertTag = (open, close) => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const newVal = ta.value.slice(0, start) + open + selected + close + ta.value.slice(end);
    setForm((f) => ({ ...f, content: newVal }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + open.length, start + open.length + selected.length);
    }, 0);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        const { data } = await blogApi.updateBlog(editing, payload);
        setBlogs((prev) => prev.map((b) => (b._id === editing ? data.blog : b)));
        toast.success(
          data.blog.status === "published"
            ? "Blog published! Now visible to readers."
            : "Blog saved as draft."
        );
      } else {
        const { data } = await blogApi.createBlog(payload);
        setBlogs((prev) => [data.blog, ...prev]);
        toast.success(
          data.blog.status === "published"
            ? "Blog published! Now visible to readers."
            : "Blog saved as draft."
        );
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (blog) => {
    const next = blog.status === "published" ? "draft" : "published";
    try {
      const { data } = await blogApi.updateBlog(blog._id, { status: next });
      setBlogs((prev) => prev.map((b) => (b._id === blog._id ? data.blog : b)));
      toast.success(
        next === "published"
          ? "Blog published! Now visible to readers."
          : "Blog unpublished."
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await blogApi.deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b._id !== id));
      toast.success("Blog deleted");
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeleting(null);
    }
  };

  const published = blogs.filter((b) => b.status === "published").length;
  const drafts = blogs.filter((b) => b.status === "draft").length;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Blog Management</h2>
          <p className="text-white/50 text-sm mt-1">
            {published} published · {drafts} draft
          </p>
        </div>
        <Button
          onClick={openCreate}
          startIcon={<Plus size={16} />}
          className="bg-green-600! text-white! hover:bg-orange-500! rounded-xl! font-semibold!"
        >
          New Blog
        </Button>
      </div>

      {/* STATS */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Posts", value: blogs.length, color: "text-white" },
          { label: "Published", value: published, color: "text-green-400" },
          { label: "Drafts", value: drafts, color: "text-slate-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${glass} rounded-2xl p-5`}>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={140}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 3 }} />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && blogs.length === 0 && (
        <div className={`${glass} rounded-2xl p-14 text-center`}>
          <FileText size={44} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 mb-4">No blogs yet. Share your knowledge!</p>
          <Button onClick={openCreate} startIcon={<Plus size={16} />}
            className="bg-green-600! text-white! hover:bg-orange-500! rounded-xl! font-semibold!">
            Create First Blog
          </Button>
        </div>
      )}

      {/* BLOG CARDS */}
      {!loading && blogs.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {blogs.map((blog, i) => {
            const s = STATUS_MAP[blog.status] || STATUS_MAP.draft;
            return (
              <motion.div
                key={blog._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`${glass} rounded-2xl p-5 flex flex-col gap-3`}
              >
                {/* Image preview */}
                {blog.featuredImage && (
                  <img src={blog.featuredImage} alt={blog.title}
                    className="w-full h-32 object-cover rounded-xl"
                    onError={(e) => { e.target.style.display = "none"; }} />
                )}

                {/* Title + Status */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
                    {blog.title}
                  </h3>
                  <span className="shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: s.color, color: s.text }}>
                    {s.label}
                  </span>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/60">{blog.category}</span>
                  <span>{blog.readTime ?? 1} min read</span>
                  <span className="flex items-center gap-1"><Eye size={11} />{blog.views ?? 0}</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Draft warning */}
                {blog.status === "draft" && (
                  <p className="text-xs text-amber-400/80 flex items-center gap-1">
                    ⚠ Draft — not visible to readers. Click Publish to go live.
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <Tooltip title={blog.status === "published" ? "Unpublish" : "Publish"}>
                    <IconButton size="small" onClick={() => togglePublish(blog)}
                      sx={{ color: blog.status === "published" ? "#86efac" : "rgba(255,255,255,0.4)" }}>
                      <Globe size={14} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(blog)}
                      sx={{ color: "rgba(255,255,255,0.6)" }}>
                      <Edit size={14} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(blog._id)}
                      disabled={deleting === blog._id}
                      sx={{ color: "rgba(239,68,68,0.6)", "&:hover": { color: "#ef4444" } }}>
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

      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: "rgba(7,11,20,0.97)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "24px",
              color: "white",
              maxHeight: "90vh",
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0 }}>
          <span className="text-white font-bold text-lg">
            {editing ? "Edit Blog" : "New Blog"}
          </span>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 3, pt: 1,
            "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600 },
            "& .Mui-selected": { color: "#22c55e !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#22c55e" },
          }}
        >
          <Tab label="Basic Info" />
          <Tab label="Content" />
          <Tab label="Preview" />
        </Tabs>

        <DialogContent sx={{ pt: 2 }}>

          {/* TAB 0: BASIC INFO */}
          {activeTab === 0 && (
            <div className="flex flex-col gap-5">

              <div className="grid sm:grid-cols-2 gap-5">
                <TextField label="Title *" name="title" value={form.title}
                  onChange={handleChange} fullWidth sx={inputSx} />
                <TextField label="Subtitle" name="subtitle" value={form.subtitle}
                  onChange={handleChange} fullWidth sx={inputSx} />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <TextField label="Slug" name="slug" value={form.slug}
                  onChange={handleChange} fullWidth sx={inputSx}
                  helperText={<span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Auto-generated from title</span>} />
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Category</InputLabel>
                  <Select name="category" value={form.category} onChange={handleChange} label="Category">
                    {BLOG_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>

              <TextField label="Short Description" name="shortDescription"
                value={form.shortDescription} onChange={handleChange}
                multiline rows={2} fullWidth sx={inputSx} />

              <TextField label="Featured Image URL" name="featuredImage"
                value={form.featuredImage} onChange={handleChange} fullWidth sx={inputSx}
                helperText={<span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Paste any image URL (e.g. from Unsplash)</span>} />

              <TextField label="Tags (comma-separated)" name="tags"
                value={form.tags} onChange={handleChange} fullWidth sx={inputSx}
                helperText={<span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>e.g. python, machine learning, AI</span>} />

              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={form.status} onChange={handleChange} label="Status">
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>

            </div>
          )}

          {/* TAB 1: CONTENT */}
          {activeTab === 1 && (
            <div className="flex flex-col gap-3">

              {/* HTML TOOLBAR */}
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10">
                {TOOLBAR.map(({ label, title, open, close, cls }) => (
                  <Tooltip key={label} title={title}>
                    <button
                      type="button"
                      onClick={() => insertTag(open, close)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold text-white/70 bg-white/5 hover:bg-green-600/30 hover:text-green-300 transition-colors border border-white/10 ${cls}`}
                    >
                      {label}
                    </button>
                  </Tooltip>
                ))}
              </div>

              <TextField
                name="content"
                value={form.content}
                onChange={handleChange}
                inputRef={contentRef}
                multiline
                minRows={18}
                fullWidth
                placeholder="Write your blog content in HTML... Use the toolbar above for formatting."
                sx={{
                  ...inputSx,
                  "& .MuiOutlinedInput-root": {
                    ...inputSx["& .MuiOutlinedInput-root"],
                    fontFamily: "monospace",
                    fontSize: 13,
                    lineHeight: 1.6,
                  },
                }}
              />

              <p className="text-xs text-white/30">
                Estimated read time: {Math.max(1, Math.ceil(form.content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length / 200))} min
              </p>
            </div>
          )}

          {/* TAB 2: PREVIEW */}
          {activeTab === 2 && (
            <div>
              <style>{BLOG_PREVIEW_STYLES}</style>
              {form.featuredImage && (
                <img src={form.featuredImage} alt="Preview"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                  onError={(e) => { e.target.style.display = "none"; }} />
              )}
              <h1 className="text-white text-2xl font-bold mb-1">{form.title || "Blog Title"}</h1>
              {form.subtitle && <p className="text-white/60 text-sm mb-4">{form.subtitle}</p>}
              <div
                className="blog-preview text-white/70 text-sm leading-relaxed max-h-105 overflow-y-auto border border-white/10 rounded-xl p-4"
                dangerouslySetInnerHTML={{ __html: form.content || "<p style='color:rgba(255,255,255,0.3)'>No content yet...</p>" }}
              />
            </div>
          )}

        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)}
            sx={{ color: "rgba(255,255,255,0.5)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.1)" }}>
            Cancel
          </Button>
          <Button onClick={() => {
            setForm((f) => ({ ...f, status: "draft" }));
            setTimeout(handleSave, 0);
          }} disabled={saving}
            sx={{ color: "#94a3b8", bgcolor: "rgba(148,163,184,0.1)", borderRadius: 2, fontWeight: 600 }}>
            Save Draft
          </Button>
          <Button onClick={() => {
            setForm((f) => ({ ...f, status: "published" }));
            setTimeout(handleSave, 0);
          }} disabled={saving}
            className="bg-green-600! hover:bg-orange-500! text-white! rounded-lg! font-semibold!">
            {saving ? <CircularProgress size={16} sx={{ color: "white" }} /> : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}

const BLOG_PREVIEW_STYLES = `
  .blog-preview h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; color: rgba(255,255,255,0.9); }
  .blog-preview h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: rgba(255,255,255,0.9); }
  .blog-preview h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.4rem; color: rgba(255,255,255,0.85); }
  .blog-preview p { margin-bottom: 0.75rem; }
  .blog-preview ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
  .blog-preview ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
  .blog-preview li { margin-bottom: 0.2rem; }
  .blog-preview code { background: rgba(0,0,0,0.4); padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-size: 0.8rem; font-family: monospace; color: #86efac; }
  .blog-preview pre { background: rgba(0,0,0,0.5); padding: 0.75rem 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 0.75rem; }
  .blog-preview blockquote { border-left: 3px solid #22c55e; padding: 0.4rem 0.75rem; background: rgba(34,197,94,0.08); margin: 0.75rem 0; border-radius: 0 0.5rem 0.5rem 0; }
  .blog-preview a { color: #22c55e; text-decoration: underline; }
  .blog-preview strong { color: rgba(255,255,255,0.9); }
  .blog-preview em { color: rgba(255,255,255,0.75); }
`;
