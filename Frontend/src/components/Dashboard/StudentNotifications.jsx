import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button, Pagination, Skeleton } from "@mui/material";
import { Bell, BellOff, CheckCheck, Info, Megaphone, Shield, Zap } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const TYPE_CONFIG = {
  announcement: { icon: Megaphone, color: "#38bdf8", bg: "rgba(56,189,248,0.15)" },
  alert: { icon: Shield, color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  info: { icon: Info, color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  warning: { icon: Zap, color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  success: { icon: CheckCheck, color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
};

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await studentApi.getNotifications({ page, limit: 20, unreadOnly: filter === "unread" });
      setNotifications(data.notifications || []);
      setTotalPages(data.pages || 1);
      setUnreadCount(data.unreadCount || 0);
    } catch { toast.error("Failed to load notifications"); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await studentApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      await studentApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch { toast.error("Failed"); }
    finally { setMarkingAll(false); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Notifications</h1>
            <p className="mt-2 text-white/60">Stay updated with course announcements and platform news</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-center">
                <p className="text-lg font-bold text-sky-300">{unreadCount}</p>
                <p className="text-xs text-white/50">Unread</p>
              </div>
            )}
            {unreadCount > 0 && (
              <Button onClick={handleMarkAll} disabled={markingAll} size="small" variant="outlined"
                sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 w-fit">
        {["all", "unread"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition capitalize ${filter === f ? "bg-white text-[#0c1220]" : "text-white/60 hover:text-white"}`}>
            {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <BellOff size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.announcement;
            const Icon = tc.icon;
            return (
              <motion.div key={n._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`rounded-[20px] border p-4 transition ${!n.isRead ? "border-sky-400/20 bg-sky-400/5" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: tc.bg }}>
                    <Icon size={16} style={{ color: tc.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />}
                    </div>
                    <p className="mt-1 text-sm text-white/60">{n.message}</p>
                    <p className="mt-1 text-xs text-white/30">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && (
                    <button onClick={() => handleMarkRead(n._id)} className="shrink-0 text-xs text-white/40 hover:text-white/70 transition">
                      Mark read
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
