import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, InputLabel, MenuItem,
  Pagination, Select, Skeleton, TextField, Tooltip,
} from "@mui/material";
import { Bell, GraduationCap, Send, Trash2, Users, Globe } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users", icon: Globe, color: "rgba(34,197,94,0.15)", textColor: "#86efac" },
  { value: "students", label: "Students Only", icon: Users, color: "rgba(56,189,248,0.15)", textColor: "#7dd3fc" },
  { value: "teachers", label: "Teachers Only", icon: GraduationCap, color: "rgba(249,115,22,0.15)", textColor: "#fdba74" },
];

const TYPE_OPTIONS = ["announcement", "alert", "info", "warning", "success"];
const typeColor = (type) => {
  const m = { announcement: "#86efac", alert: "#fca5a5", info: "#7dd3fc", warning: "#fde68a", success: "#86efac" };
  return m[type] || "#ffffff80";
};

const EMPTY_FORM = { title: "", message: "", type: "announcement", targetAudience: "all" };

const BroadcastNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.getNotifications({ page, limit: 10 });
      setNotifications(data.notifications || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    try {
      setSending(true);
      await adminApi.sendNotification(form);
      toast.success("Notification sent successfully");
      setDialog(false);
      setForm(EMPTY_FORM);
      fetchNotifications();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await adminApi.deleteNotification(id);
      toast.success("Notification deleted");
      fetchNotifications();
    } catch {
      toast.error("Delete failed");
    }
  };

  const audienceConfig = (audience) => AUDIENCE_OPTIONS.find((o) => o.value === audience) || AUDIENCE_OPTIONS[0];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Broadcast Notifications</h1>
            <p className="mt-2 text-white/60">Send announcements to students, teachers, or all users</p>
          </div>
          <Button variant="contained" startIcon={<Send size={18} />} onClick={() => { setForm(EMPTY_FORM); setDialog(true); }}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#38bdf8,#0284c7)", fontWeight: 700, whiteSpace: "nowrap" }}>
            New Broadcast
          </Button>
        </div>
      </motion.div>

      {/* Audience quick-select cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {AUDIENCE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <motion.button key={opt.value} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => { setForm({ ...EMPTY_FORM, targetAudience: opt.value }); setDialog(true); }}
              className={`rounded-[22px] ${glass} p-5 text-left transition hover:-translate-y-1`}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5" style={{ background: opt.color }}>
                  <Icon size={20} style={{ color: opt.textColor }} />
                </div>
                <div>
                  <p className="font-semibold text-white">Broadcast to</p>
                  <p className="text-sm" style={{ color: opt.textColor }}>{opt.label}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[28px] ${glass} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notification History</h3>
          <span className="text-sm text-white/40">{pagination.total} total</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={80} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <Bell size={36} className="mx-auto mb-3 opacity-30" />
            <p>No notifications sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => {
              const aud = audienceConfig(n.targetAudience);
              const AudIcon = aud.icon;
              return (
                <motion.div key={n._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10">
                    <Bell size={18} className="text-white/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{n.title}</p>
                      <Chip label={n.type} size="small" sx={{ bgcolor: "rgba(255,255,255,0.08)", color: typeColor(n.type), fontWeight: 700, fontSize: 10 }} />
                      <Chip icon={<AudIcon size={12} />} label={aud.label} size="small"
                        sx={{ bgcolor: aud.color, color: aud.textColor, fontWeight: 600, fontSize: 10, "& .MuiChip-icon": { color: aud.textColor } }} />
                    </div>
                    <p className="mt-1 text-sm text-white/60 line-clamp-2">{n.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/35">
                      <span>By {n.sentBy?.name || "Admin"}</span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      <span>{n.readBy?.length || 0} reads</span>
                    </div>
                  </div>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(n._id)} sx={{ color: "rgba(239,68,68,0.6)" }}>
                      <Trash2 size={15} />
                    </IconButton>
                  </Tooltip>
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
      </motion.div>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } } }}>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Send size={20} /> New Broadcast Notification
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 3 }}>
          <div className="space-y-5">
            <TextField fullWidth label="Notification Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              size="small" inputProps={{ maxLength: 120 }}
              InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
            <TextField fullWidth multiline rows={4} label="Message" value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })} size="small" inputProps={{ maxLength: 1000 }}
              InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }}
              helperText={`${form.message.length}/1000`} FormHelperTextProps={{ sx: { color: "rgba(255,255,255,0.3)", textAlign: "right" } }} />
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Target Audience</InputLabel>
              <Select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                label="Target Audience" sx={{ color: "white" }}>
                {AUDIENCE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Notification Type</InputLabel>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                label="Notification Type" sx={{ color: "white" }}>
                {TYPE_OPTIONS.map((t) => <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleSend} variant="contained" disabled={sending}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#38bdf8,#0284c7)", fontWeight: 700 }}>
            {sending ? <CircularProgress size={18} color="inherit" /> : "Send Broadcast"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BroadcastNotifications;
