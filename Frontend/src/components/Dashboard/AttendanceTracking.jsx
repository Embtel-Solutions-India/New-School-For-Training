import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, FormControl, InputLabel, MenuItem, Pagination, Select, Skeleton,
} from "@mui/material";
import { CheckCircle2, Users, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const STATUS_CHIP = {
  present: { bg: "rgba(34,197,94,0.15)", color: "#86efac" },
  absent: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5" },
  late: { bg: "rgba(251,191,36,0.15)", color: "#fde68a" },
};

const AttendanceTracking = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [sessionStats, setSessionStats] = useState(null);
  const [report, setReport] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [courseFilter, setCourseFilter] = useState("");
  const [tab, setTab] = useState("sessions");
  const [marking, setMarking] = useState({});

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { status: "ended", limit: 50 };
      if (courseFilter) params.courseId = courseFilter;
      const { data } = await teacherApi.getLiveClasses(params);
      setSessions(data.classes || []);
    } catch { toast.error("Failed to load sessions"); }
    finally { setLoading(false); }
  }, [courseFilter]);

  const fetchReport = useCallback(async () => {
    try {
      setReportLoading(true);
      const params = courseFilter ? { courseId: courseFilter } : {};
      const { data } = await teacherApi.getAttendanceReport(params);
      setReport(data.report || []);
    } catch { toast.error("Failed to load report"); }
    finally { setReportLoading(false); }
  }, [courseFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { if (tab === "report") fetchReport(); }, [tab, fetchReport]);
  useEffect(() => {
    teacherApi.getCourses().then(({ data }) => setCourses(data.courses || [])).catch(() => {});
  }, []);

  const openSession = async (session) => {
    setSelectedSession(session);
    try {
      const { data } = await teacherApi.getSessionAttendance(session._id);
      setAttendance(data.attendance || []);
      setSessionStats(data.stats);
    } catch { toast.error("Failed to load session attendance"); }
  };

  const handleMark = async (sessionId, studentId, status) => {
    const key = `${sessionId}-${studentId}`;
    try {
      setMarking((p) => ({ ...p, [key]: true }));
      await teacherApi.markAttendance(sessionId, { studentId, status });
      toast.success(`Marked ${status}`);
      const { data } = await teacherApi.getSessionAttendance(sessionId);
      setAttendance(data.attendance || []);
      setSessionStats(data.stats);
    } catch { toast.error("Mark failed"); }
    finally { setMarking((p) => ({ ...p, [key]: false })); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Attendance Tracking</h1>
            <p className="mt-2 text-white/60">View and manage student attendance across all sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Filter by Course</InputLabel>
              <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} label="Filter by Course" sx={{ color: "white" }}>
                <MenuItem value="">All Courses</MenuItem>
                {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
              </Select>
            </FormControl>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ value: "sessions", label: "Sessions" }, { value: "report", label: "Overall Report" }].map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${tab === t.value ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sessions" ? (
        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          {/* Sessions List */}
          <div className={`rounded-[24px] ${glass} p-4`}>
            <p className="mb-3 text-sm font-semibold text-white/60">Ended Sessions</p>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={60} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-xs text-white/40 py-6">No ended sessions yet</p>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => (
                  <button key={s._id} onClick={() => openSession(s)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedSession?._id === s._id ? "bg-blue-500/20 text-blue-200 font-semibold" : "text-white/60 hover:bg-white/[0.06]"}`}>
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="text-xs text-white/35">{new Date(s.scheduledAt).toLocaleDateString()} · {s.attendanceCount || 0} attended</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attendance Records */}
          <div className={`rounded-[24px] ${glass} p-6`}>
            {!selectedSession ? (
              <div className="flex h-48 items-center justify-center text-white/40">
                <div className="text-center">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Select a session to view attendance</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold">{selectedSession.title}</p>
                    <p className="text-sm text-white/45">{new Date(selectedSession.scheduledAt).toLocaleString()}</p>
                  </div>
                  {sessionStats && (
                    <div className="flex gap-3 text-sm">
                      <span className="text-emerald-300 font-bold">{sessionStats.present} Present</span>
                      <span className="text-red-300 font-bold">{sessionStats.absent} Absent</span>
                      <span className="text-yellow-300 font-bold">{sessionStats.late} Late</span>
                    </div>
                  )}
                </div>
                {attendance.length === 0 ? (
                  <p className="py-8 text-center text-sm text-white/40">No attendance records for this session</p>
                ) : (
                  <div className="space-y-2">
                    {attendance.map((r) => {
                      const key = `${selectedSession._id}-${r.student?._id}`;
                      const sc = STATUS_CHIP[r.status] || STATUS_CHIP.present;
                      return (
                        <div key={r._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold">
                            {r.student?.name?.[0] || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{r.student?.name}</p>
                            <p className="truncate text-xs text-white/40">{r.student?.email}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Chip label={r.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 10 }} />
                            <div className="flex gap-1">
                              {["present", "absent", "late"].map((s) => (
                                <button key={s} disabled={marking[key]}
                                  onClick={() => handleMark(selectedSession._id, r.student?._id, s)}
                                  className={`rounded-lg px-2 py-0.5 text-xs font-semibold transition ${r.status === s ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"}`}
                                  style={{ color: STATUS_CHIP[s].color }}>
                                  {s.charAt(0).toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Overall Report */
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Student Attendance Report</p>
          {reportLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={52} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
            </div>
          ) : report.length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <Users size={36} className="mx-auto mb-2 opacity-30" />
              <p>No attendance data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {report.map((r, i) => (
                <motion.div key={r.studentId || i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold">
                      {r.name?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.name || "Unknown"}</p>
                      <p className="truncate text-xs text-white/40">{r.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-emerald-300">{r.present}P</span>
                    <span className="text-red-300">{r.absent}A</span>
                    <span className="text-yellow-300">{r.late}L</span>
                    <span className="text-white/40">/ {r.total} sessions</span>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>Attendance</span><span>{r.percentage?.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${r.percentage || 0}%`, background: r.percentage >= 75 ? "#22c55e" : r.percentage >= 50 ? "#fbbf24" : "#ef4444" }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;
