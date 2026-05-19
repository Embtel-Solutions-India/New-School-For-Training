import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Chip, FormControl, InputLabel, MenuItem, Pagination,
  Select, Skeleton, TextField,
} from "@mui/material";
import { Activity, FileText, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import adminApi from "../../services/adminApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const STATUS_COLORS = {
  success: { bg: "rgba(34,197,94,0.15)", color: "#86efac" },
  failure: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5" },
  warning: { bg: "rgba(251,191,36,0.15)", color: "#fde68a" },
};

const RESOURCE_OPTIONS = ["", "user", "teacher", "course", "coupon", "notification", "cms", "settings"];

const actionColor = (action = "") => {
  if (action.includes("CREATED") || action.includes("APPROVED")) return "#86efac";
  if (action.includes("DELETED") || action.includes("BANNED") || action.includes("REJECTED")) return "#fca5a5";
  if (action.includes("SUSPENDED") || action.includes("TOGGLED")) return "#fde68a";
  if (action.includes("UPDATED") || action.includes("RESET")) return "#7dd3fc";
  return "rgba(255,255,255,0.6)";
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [resource, setResource] = useState("");
  const [status, setStatus] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.action = search;
      if (resource) params.resource = resource;
      if (status) params.status = status;
      const { data } = await adminApi.getAuditLogs(params);
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, search, resource, status]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await adminApi.getAuditLogStats();
      setStats(data.stats);
    } catch { /* stats are non-critical */ }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Audit Logs</h1>
            <p className="mt-2 text-white/60">Track all admin actions, user changes, and platform events</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <ShieldCheck size={16} className="text-emerald-300" />
            <span className="text-sm font-semibold text-white/70">
              {pagination.total.toLocaleString()} events
            </span>
          </div>
        </div>
      </motion.div>

      {/* Top action stats */}
      {stats?.byAction?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[24px] ${glass} p-5`}>
          <p className="mb-3 text-sm font-semibold text-white/60">Top Actions (All Time)</p>
          <div className="flex flex-wrap gap-2">
            {stats.byAction.slice(0, 8).map((a) => (
              <div key={a._id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
                <span style={{ color: actionColor(a._id) }} className="font-mono font-bold">{a._id}</span>
                <span className="text-white/40">×{a.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[28px] ${glass} p-6`}>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <TextField placeholder="Search actions..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} variant="outlined" size="small"
            InputProps={{ startAdornment: <Search size={16} className="mr-2 text-white/40" />, sx: { color: "white" } }} />
          <FormControl size="small">
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Resource</InputLabel>
            <Select value={resource} onChange={(e) => { setResource(e.target.value); setPage(1); }} label="Resource" sx={{ color: "white" }}>
              {RESOURCE_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r || "All Resources"}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Status</InputLabel>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} label="Status" sx={{ color: "white" }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failure">Failure</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
            </Select>
          </FormControl>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={60} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => {
              const sc = STATUS_COLORS[log.status] || STATUS_COLORS.success;
              return (
                <motion.div key={log._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10">
                      <Activity size={14} className="text-white/50" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold font-mono truncate" style={{ color: actionColor(log.action) }}>
                        {log.action}
                      </p>
                      <p className="text-xs text-white/45 truncate">
                        {log.actor?.name || "System"} · {log.actor?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {log.resource && (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/60 font-mono">{log.resource}</span>
                    )}
                    <Chip label={log.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 10 }} />
                    <span className="text-xs text-white/35">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
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
      </motion.div>
    </div>
  );
};

export default AuditLogs;
