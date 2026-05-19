import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton, Pagination, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import {
  BarChart, Bar, CartesianGrid, Cell, PieChart, Pie,
  ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis,
} from "recharts";
import { TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const TOOLTIP_STYLE = { background: "#08111f", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16, color: "white" };
const BUCKET_COLORS = ["#ef4444", "#f97316", "#fbbf24", "#22c55e"];
const PIE_COLORS = ["#22c55e", "#38bdf8", "#f97316", "#a78bfa", "#fde68a"];

const StudentProgressAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("progress");
  const [courseFilter, setCourseFilter] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await teacherApi.getProgressAnalytics(courseFilter ? { courseId: courseFilter } : {});
      setAnalytics(data.analytics);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [courseFilter]);

  const fetchStudents = useCallback(async () => {
    try {
      setListLoading(true);
      const params = { page, limit: 20, sort: sortBy };
      if (courseFilter) params.courseId = courseFilter;
      const { data } = await teacherApi.getStudents(params);
      setStudents(data.students || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setListLoading(false);
    }
  }, [page, sortBy, courseFilter]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => {
    teacherApi.getCourses().then(({ data }) => setCourses(data.courses || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Student Progress</h1>
            <p className="mt-2 text-white/60">Track completion rates, engagement, and student activity</p>
          </div>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Filter by Course</InputLabel>
            <Select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }} label="Filter by Course" sx={{ color: "white" }}>
              <MenuItem value="">All Courses</MenuItem>
              {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
            </Select>
          </FormControl>
        </div>
      </motion.div>

      {/* Analytics Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Students", value: analytics?.total || 0, color: "#38bdf8" },
          { label: "Completed", value: analytics?.completed || 0, color: "#22c55e" },
          { label: "Completion Rate", value: `${analytics?.completionRate || 0}%`, color: "#a78bfa" },
          { label: "Avg Progress", value: `${analytics?.avgProgress || 0}%`, color: "#f97316" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`rounded-[22px] ${glass} p-5`}>
            <p className="text-sm text-white/50">{s.label}</p>
            {loading ? <Skeleton variant="text" width={80} height={40} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} /> : (
              <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Progress Distribution */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Progress Distribution</p>
          {loading ? <Skeleton variant="rounded" height={220} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} /> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.progressBuckets || []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="range" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tickLine={false} axisLine={false} />
                  <ChartTooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Students">
                    {(analytics?.progressBuckets || []).map((_, i) => (
                      <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Students */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">Top Students by Progress</p>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={44} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
            </div>
          ) : (analytics?.topStudents || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No student data yet</p>
          ) : (
            <div className="space-y-2">
              {(analytics.topStudents || []).map((e, i) => (
                <div key={e._id || i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="w-5 text-center text-xs font-bold text-white/40">{i + 1}</span>
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-bold">
                    {e.user?.name?.[0] || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.user?.name}</p>
                    <p className="truncate text-xs text-white/40">{e.course?.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-emerald-300">{e.progress}%</p>
                    {e.isCompleted && <p className="text-xs text-emerald-400">Completed</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Table */}
      <div className={`rounded-[24px] ${glass} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold">All Student Progress</p>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Sort By</InputLabel>
            <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} label="Sort By" sx={{ color: "white" }}>
              <MenuItem value="progress">Progress</MenuItem>
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </div>

        {listLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={56} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 2 }} />)}
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p>No students enrolled yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((e, i) => (
              <motion.div key={e._id || i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold">
                    {e.user?.name?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.user?.name}</p>
                    <p className="truncate text-xs text-white/40">{e.course?.title}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Progress</span><span>{e.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                      style={{ width: `${e.progress}%` }} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {e.isCompleted ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">Completed</span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50 capitalize">{e.status}</span>
                  )}
                  <p className="mt-0.5 text-xs text-white/30">{new Date(e.updatedAt).toLocaleDateString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgressAnalytics;
