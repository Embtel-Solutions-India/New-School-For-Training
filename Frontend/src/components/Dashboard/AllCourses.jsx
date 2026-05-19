import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Pagination, Select, Skeleton, TextField,
} from "@mui/material";
import { BookOpen, Grid2X2, List, Search } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const AllCourses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [view, setView] = useState("grid");
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    studentApi.getCourseCategories().then(({ data }) => setCategories(data.categories || [])).catch(() => {});
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await studentApi.getAllCourses({ search, category, sort, page, limit: 12 });
      setCourses(data.courses || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch { toast.error("Failed to load courses"); }
    finally { setLoading(false); }
  }, [search, category, sort, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const fmt = (price) => price === 0 ? "Free" : `$${price.toLocaleString()}`;

  const handleEnroll = async (course) => {
    if (course.isEnrolled) return;
    if ((course.pricing?.price ?? 0) > 0) {
      toast("This is a paid course. Payment integration coming soon.", { icon: "💳" });
      return;
    }
    try {
      setEnrolling(course._id);
      await studentApi.enrollCourse(course._id);
      toast.success(`Enrolled in "${course.title}"!`);
      fetchCourses();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Enrollment failed");
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <h1 className="text-3xl font-bold sm:text-4xl">All Courses</h1>
        <p className="mt-2 text-white/60">Browse the full course catalog and enroll in what interests you</p>
      </motion.div>

      {/* Filters */}
      <div className={`rounded-[24px] ${glass} p-5`}>
        <div className="flex flex-wrap gap-3">
          <TextField placeholder="Search courses..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} size="small"
            slotProps={{ input: { startAdornment: <Search size={14} className="mr-2 text-white/40 shrink-0" />, sx: { color: "white" } } }}
            sx={{ flex: 1, minWidth: 200 }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Category</InputLabel>
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} label="Category" sx={{ color: "white" }}>
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Sort By</InputLabel>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} label="Sort By" sx={{ color: "white" }}>
              <MenuItem value="latest">Latest</MenuItem>
              <MenuItem value="popular">Most Popular</MenuItem>
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
            </Select>
          </FormControl>
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04]">
            <button onClick={() => setView("grid")} className={`rounded-xl p-2 ${view === "grid" ? "bg-white/20" : "text-white/50"}`}><Grid2X2 size={16} /></button>
            <button onClick={() => setView("list")} className={`rounded-xl p-2 ${view === "list" ? "bg-white/20" : "text-white/50"}`}><List size={16} /></button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className={`grid gap-4 ${view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : ""}`}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} variant="rounded" height={260} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <BookOpen size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No courses found</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course, i) => (
            <motion.div key={course._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`rounded-[20px] border border-white/10 bg-white/[0.04] overflow-hidden transition hover:-translate-y-1 hover:bg-white/[0.07]`}>
              <div className="relative h-36 bg-white/[0.04]">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><BookOpen size={32} className="text-white/20" /></div>
                )}
                {course.isEnrolled && (
                  <span className="absolute top-2 right-2 rounded-full bg-emerald-500/80 px-2 py-0.5 text-xs font-bold text-white">Enrolled</span>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-white/40">{course.category}</span>
                <h3 className="mt-1 text-sm font-semibold leading-snug line-clamp-2">{course.title}</h3>
                <p className="mt-1 text-xs text-white/40">{course.teacher?.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-emerald-300">{fmt(course.pricing?.price || 0)}</span>
                  <span className="text-xs text-white/40">{course.enrollmentCount || 0} students</span>
                </div>
                <div className="mt-3">
                  {course.isEnrolled ? (
                    <Chip label="Enrolled" size="small" sx={{ bgcolor: "rgba(34,197,94,0.2)", color: "#86efac", fontWeight: 700, fontSize: 10, width: "100%" }} />
                  ) : (
                    <Button fullWidth size="small" onClick={() => handleEnroll(course)}
                      disabled={enrolling === course._id}
                      sx={{ borderRadius: 2, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", fontWeight: 600, fontSize: 11, minHeight: 28 }}>
                      {enrolling === course._id ? <CircularProgress size={14} color="inherit" /> : (course.pricing?.price || 0) === 0 ? "Enroll Free" : "Buy Now"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course, i) => (
            <motion.div key={course._id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`rounded-[20px] ${glass} flex gap-4 p-4 items-center`}>
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="h-16 w-24 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="h-16 w-24 shrink-0 rounded-xl bg-white/[0.06] flex items-center justify-center"><BookOpen size={20} className="text-white/20" /></div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{course.title}</p>
                <p className="text-xs text-white/40">{course.teacher?.name} · {course.category}</p>
                <p className="mt-1 text-xs text-white/35 line-clamp-1">{course.description}</p>
              </div>
              <div className="shrink-0 text-right space-y-1.5">
                <p className="font-bold text-emerald-300">{fmt(course.pricing?.price || 0)}</p>
                <p className="text-xs text-white/40">{course.enrollmentCount || 0} students</p>
                {course.isEnrolled ? (
                  <Chip label="Enrolled" size="small" sx={{ bgcolor: "rgba(34,197,94,0.2)", color: "#86efac", fontSize: 10 }} />
                ) : (
                  <Button size="small" onClick={() => handleEnroll(course)}
                    disabled={enrolling === course._id}
                    sx={{ borderRadius: 2, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", fontWeight: 600, fontSize: 11, minHeight: 28, px: 2 }}>
                    {enrolling === course._id ? <CircularProgress size={14} color="inherit" /> : (course.pricing?.price || 0) === 0 ? "Enroll Free" : "Buy Now"}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
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

export default AllCourses;
