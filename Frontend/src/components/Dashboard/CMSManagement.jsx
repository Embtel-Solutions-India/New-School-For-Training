import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Pagination,
  Select, Skeleton, Switch, Tab, Tabs, TextField, Tooltip,
} from "@mui/material";
import { Edit, FileText, Image, MessageSquare, Plus, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const CMS_TYPES = [
  { value: "banner", label: "Banners", icon: Image },
  { value: "faq", label: "FAQs", icon: MessageSquare },
  { value: "testimonial", label: "Testimonials", icon: Star },
  { value: "blog", label: "Blog Posts", icon: FileText },
  { value: "category", label: "Categories", icon: FileText },
];

const EMPTY_FORM = { type: "banner", title: "", content: "", image: "", author: "", order: 0, active: true, tags: "" };

const CMSManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("banner");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [summary, setSummary] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getCmsContent({ type: tab, page, limit: 10 });
      setItems(data.items || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
      if (data.summary) setSummary(data.summary);
    } catch {
      toast.error("Failed to load CMS content");
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const getCount = (type) => summary.find((s) => s._id === type)?.count || 0;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, type: tab });
    setDialog(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      type: item.type,
      title: item.title,
      content: item.content || "",
      image: item.image || "",
      author: item.author || "",
      order: item.order || 0,
      active: item.active !== false,
      tags: (item.tags || []).join(", "),
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await adminApi.updateCmsItem(editing._id, payload);
        toast.success("Item updated");
      } else {
        await adminApi.createCmsItem(payload);
        toast.success("Item created");
      }
      setDialog(false);
      fetchItems();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await adminApi.deleteCmsItem(id);
      toast.success("Item deleted");
      fetchItems();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">CMS Management</h1>
            <p className="mt-2 text-white/60">Manage banners, FAQs, testimonials, blogs, and categories</p>
          </div>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={openCreate}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", fontWeight: 700, whiteSpace: "nowrap" }}>
            Add Content
          </Button>
        </div>
      </motion.div>

      {/* Type summary cards */}
      <div className="grid gap-3 sm:grid-cols-5">
        {CMS_TYPES.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => { setTab(value); setPage(1); }}
            className={`rounded-[20px] border p-4 text-left transition hover:-translate-y-0.5 ${tab === value ? "border-violet-400/40 bg-violet-400/10" : "border-white/10 bg-white/[0.04]"}`}>
            <Icon size={18} className={tab === value ? "text-violet-300" : "text-white/40"} />
            <p className={`mt-2 text-sm font-semibold ${tab === value ? "text-violet-200" : "text-white/70"}`}>{label}</p>
            <p className={`text-xl font-bold ${tab === value ? "text-white" : "text-white/50"}`}>{getCount(value)}</p>
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[28px] ${glass} overflow-hidden`}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }}
          sx={{ borderBottom: "1px solid rgba(255,255,255,0.08)", px: 3, "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontWeight: 600 }, "& .Mui-selected": { color: "white" }, "& .MuiTabs-indicator": { bgcolor: "#a78bfa" } }}>
          {CMS_TYPES.map((t) => <Tab key={t.value} label={t.label} value={t.value} />)}
        </Tabs>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={72} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <FileText size={36} className="mx-auto mb-3 opacity-30" />
              <p>No {tab} content yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <motion.div key={item._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]">
                  {item.image && (
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white truncate">{item.title}</p>
                      <Chip label={item.active ? "Active" : "Inactive"} size="small"
                        sx={{ bgcolor: item.active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)", color: item.active ? "#86efac" : "#94a3b8", fontWeight: 700, fontSize: 10 }} />
                    </div>
                    {item.content && <p className="mt-1 text-sm text-white/50 line-clamp-1">{item.content}</p>}
                    <div className="mt-1 flex gap-3 text-xs text-white/35">
                      {item.author && <span>By {item.author}</span>}
                      <span>Order: {item.order}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(item)} sx={{ color: "rgba(255,255,255,0.6)" }}><Edit size={15} /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(item._id, item.title)} sx={{ color: "rgba(239,68,68,0.6)" }}><Trash2 size={15} /></IconButton></Tooltip>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination count={pagination.pages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? "Edit Content" : "Add Content"}</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 3 }}>
          <div className="space-y-5">
            <FormControl fullWidth size="small" disabled={!!editing}>
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Content Type</InputLabel>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} label="Content Type" sx={{ color: "white" }}>
                {CMS_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth multiline rows={4} label="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <div className="grid grid-cols-2 gap-5">
              <TextField fullWidth label="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              <TextField fullWidth label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              <TextField fullWidth label="Display Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
              <TextField fullWidth label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} color="success" />
              <span className="text-sm text-white/70">Active / Visible</span>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CMSManagement;
