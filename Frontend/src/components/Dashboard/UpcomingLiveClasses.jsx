import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Chip, Skeleton } from "@mui/material";
import { Calendar, CheckCircle2, Clock, ExternalLink, User, Video } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";
import { getSocket } from "../../services/socketClient";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const STATUS_CHIP = {
  live: { bg: "rgba(239,68,68,0.2)", color: "#fca5a5", label: "LIVE NOW" },
  scheduled: { bg: "rgba(56,189,248,0.2)", color: "#7dd3fc", label: "Upcoming" },
  ended: { bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", label: "Ended" },
};

const ClassCard = ({ cls, i }) => {
  const sc = STATUS_CHIP[cls.status] || STATUS_CHIP.scheduled;
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!cls.meetingLink) { toast.error("Meeting link not available yet"); return; }
    try {
      setJoining(true);
      await studentApi.joinLiveClass(cls._id);
      window.open(cls.meetingLink, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      className={`rounded-[20px] ${glass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cls.status === "live" ? "bg-red-500/20" : "bg-sky-500/20"}`}>
            <Video size={18} className={cls.status === "live" ? "text-red-400" : "text-sky-400"} />
          </div>
          <div>
            <p className="font-semibold text-sm">{cls.title}</p>
            <p className="text-xs text-white/40">{cls.course?.title}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
          {cls.status === "live" && <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/50">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} />
          <span>{new Date(cls.scheduledAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>{new Date(cls.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={12} />
          <span>{cls.teacher?.name || "Instructor"}</span>
        </div>
        {cls.durationMinutes && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{cls.durationMinutes} min</span>
          </div>
        )}
      </div>
      {(cls.status === "live" || cls.status === "scheduled") && (
        <button onClick={handleJoin} disabled={joining || !cls.meetingLink}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition disabled:opacity-50 ${cls.status === "live" ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"}`}>
          <ExternalLink size={14} />
          {joining ? "Joining…" : cls.status === "live" ? "Join Now" : cls.meetingLink ? "Open Class" : "Link coming soon"}
        </button>
      )}
      {cls.status === "ended" && cls.recordingUrl && (
        <a href={cls.recordingUrl} target="_blank" rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500/15 py-2 text-sm font-semibold text-violet-300 hover:bg-violet-500/25 transition">
          <Video size={14} /> Watch Recording
        </a>
      )}
    </motion.div>
  );
};

const POLL_INTERVAL_MS = 30_000;

const UpcomingLiveClasses = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const pollRef = useRef(null);

  const refreshClasses = () => {
    studentApi.getUpcomingLiveClasses()
      .then(({ data: res }) => setData(res))
      .catch(() => {});
  };

  useEffect(() => {
    studentApi.getUpcomingLiveClasses()
      .then(({ data: res }) => setData(res))
      .catch(() => toast.error("Failed to load live classes"))
      .finally(() => setLoading(false));

    studentApi.getAttendanceHistory()
      .then(({ data: res }) => setHistory(res.records || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));

    // 30s polling for status changes
    pollRef.current = setInterval(refreshClasses, POLL_INTERVAL_MS);

    // Instant refresh when a teacher starts a live class
    const socket = getSocket();
    if (socket) {
      socket.on("live-class-started", refreshClasses);
    }

    return () => {
      clearInterval(pollRef.current);
      const s = getSocket();
      if (s) s.off("live-class-started", refreshClasses);
    };
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Live Classes</h1>
            <p className="mt-2 text-white/60">Join live sessions from your enrolled courses</p>
          </div>
          {data && (
            <div className="flex gap-3">
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-center">
                <p className="text-lg font-bold text-red-300">{(data.upcoming || []).filter((c) => c.status === "live").length}</p>
                <p className="text-xs text-white/50">Live Now</p>
              </div>
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-center">
                <p className="text-lg font-bold text-sky-300">{(data.upcoming || []).filter((c) => c.status === "scheduled").length}</p>
                <p className="text-xs text-white/50">Upcoming</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={200} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : (
        <>
          {/* Live Now */}
          {(data?.upcoming || []).filter((c) => c.status === "live").length > 0 && (
            <div>
              <p className="mb-3 font-semibold text-red-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> Live Now
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data.upcoming || []).filter((c) => c.status === "live").map((cls, i) => <ClassCard key={cls._id} cls={cls} i={i} />)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {(data?.upcoming || []).filter((c) => c.status === "scheduled").length > 0 && (
            <div>
              <p className="mb-3 font-semibold text-sky-300">Scheduled Classes</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data.upcoming || []).filter((c) => c.status === "scheduled").map((cls, i) => <ClassCard key={cls._id} cls={cls} i={i} />)}
              </div>
            </div>
          )}

          {/* Past */}
          {(data?.past || []).length > 0 && (
            <div>
              <p className="mb-3 font-semibold text-white/50">Past Classes</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(data.past || []).map((cls, i) => <ClassCard key={cls._id} cls={cls} i={i} />)}
              </div>
            </div>
          )}

          {(!data?.upcoming?.length && !data?.past?.length) && (
            <div className={`rounded-[24px] ${glass} py-16 text-center`}>
              <Video size={40} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/40">No live classes scheduled for your courses yet</p>
            </div>
          )}
        </>
      )}

      {/* Attendance History */}
      <div className={`rounded-[24px] ${glass} p-6`}>
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <p className="font-semibold">My Attendance History</p>
        </div>
        {historyLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={52} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">No attended sessions yet</p>
        ) : (
          <div className="space-y-2">
            {history.map((r, i) => (
              <motion.div key={r._id || i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold
                    ${r.status === "present" ? "bg-emerald-500/20 text-emerald-300" : r.status === "late" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                    {r.status === "present" ? "✓" : r.status === "late" ? "~" : "✗"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.session?.title || "Session"}</p>
                    <p className="text-xs text-white/40">{r.course?.title || ""}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <Chip label={r.status} size="small"
                    sx={{
                      bgcolor: r.status === "present" ? "rgba(34,197,94,0.15)" : r.status === "late" ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)",
                      color: r.status === "present" ? "#86efac" : r.status === "late" ? "#fde68a" : "#fca5a5",
                      fontWeight: 700, fontSize: 10,
                    }} />
                  <p className="mt-0.5 text-xs text-white/30">
                    {r.session?.scheduledAt ? new Date(r.session.scheduledAt).toLocaleDateString() : ""}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingLiveClasses;
