import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FormControl, InputLabel, LinearProgress, MenuItem, Pagination, Select, Skeleton } from "@mui/material";
import { BookOpen, CheckCircle2, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const STATUS_COLORS = {
  active: { bg: "rgba(56,189,248,0.15)", color: "#7dd3fc" },
  completed: { bg: "rgba(34,197,94,0.15)", color: "#86efac" },
  dropped: { bg: "rgba(239,68,68,0.15)", color: "#fca5a5" },
};

const EnrolledCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await studentApi.getEnrolledCourses({ status: statusFilter, page, limit: 12 });
      setEnrollments(data.enrollments || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch { toast.error("Failed to load enrolled courses"); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <h1 className="text-3xl font-bold sm:text-4xl">Enrolled Courses</h1>
        <p className="mt-2 text-white/60">Your active and completed courses</p>
      </motion.div>

      <div className="flex gap-3">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} label="Status" sx={{ color: "white" }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={220} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : enrollments.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <BookOpen size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No enrolled courses yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((en, i) => {
            const sc = STATUS_COLORS[en.status] || STATUS_COLORS.active;
            return (
              <motion.div key={en._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-[20px] border border-white/10 bg-white/[0.04] overflow-hidden transition hover:-translate-y-1 hover:bg-white/[0.07]">
                <div className="relative h-36 bg-white/[0.04]">
                  {en.course?.thumbnail ? (
                    <img src={en.course.thumbnail} alt={en.course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><BookOpen size={32} className="text-white/20" /></div>
                  )}
                  {en.isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <CheckCircle2 size={40} className="text-emerald-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-snug line-clamp-2">{en.course?.title}</h3>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold capitalize" style={{ background: sc.bg, color: sc.color }}>{en.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">{en.course?.category}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-white/50 mb-1">
                      <span>Progress</span><span>{en.progress || 0}%</span>
                    </div>
                    <LinearProgress variant="determinate" value={en.progress || 0} sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { bgcolor: en.isCompleted ? "#22c55e" : "#38bdf8" } }} />
                  </div>
                  {en.isCompleted && en.completedAt && (
                    <p className="mt-2 text-xs text-emerald-400">Completed {new Date(en.completedAt).toLocaleDateString()}</p>
                  )}
                  {!en.isCompleted && (
                    <button className="mt-3 flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 transition">
                      <PlayCircle size={13} /> Continue Learning
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

export default EnrolledCourses;
