import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Pagination, Select, Skeleton, TextField,
} from "@mui/material";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const StarRow = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map((s) => (
      <Star key={s} size={13} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"} />
    ))}
  </div>
);

const CourseReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [replyDialog, setReplyDialog] = useState(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (ratingFilter) params.rating = ratingFilter;
      if (courseFilter) params.courseId = courseFilter;
      const { data } = await teacherApi.getReviews(params);
      setReviews(data.reviews || []);
      setTotalPages(data.pagination?.pages || 1);
      if (data.stats) setStats(data.stats);
    } catch { toast.error("Failed to load reviews"); }
    finally { setLoading(false); }
  }, [page, ratingFilter, courseFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => {
    teacherApi.getCourses().then(({ data }) => setCourses(data.courses || [])).catch(() => {});
  }, []);

  const openReply = (review) => {
    setReplyDialog(review);
    setReply(review.teacherReply || "");
  };

  const handleReply = async () => {
    if (!reply.trim()) { toast.error("Reply cannot be empty"); return; }
    try {
      setSaving(true);
      await teacherApi.replyToReview(replyDialog._id, reply.trim());
      toast.success("Reply posted");
      setReplyDialog(null);
      fetchReviews();
    } catch { toast.error("Reply failed"); }
    finally { setSaving(false); }
  };

  const handleDeleteReply = async (reviewId) => {
    try {
      await teacherApi.deleteReviewReply(reviewId);
      toast.success("Reply removed");
      fetchReviews();
    } catch { toast.error("Remove failed"); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Course Reviews</h1>
            <p className="mt-2 text-white/60">View student feedback and reply to reviews</p>
          </div>
          {stats && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-300">{stats.avgRating || "—"}</p>
                <StarRow rating={Math.round(stats.avgRating || 0)} />
              </div>
              <div className="border-l border-white/10 pl-4">
                <p className="text-sm font-semibold">{stats.total} Reviews</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Rating Breakdown */}
      {stats?.breakdown && (
        <div className={`rounded-[24px] ${glass} p-5`}>
          <p className="mb-3 text-sm font-semibold text-white/60">Rating Breakdown</p>
          <div className="space-y-2">
            {[5,4,3,2,1].map((star) => {
              const count = stats.breakdown.find((b) => b._id === star)?.count || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex w-16 items-center gap-1 text-xs text-white/50">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />{star}
                  </div>
                  <div className="h-1.5 flex-1 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs text-white/40">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Filter by Course</InputLabel>
          <Select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }} label="Filter by Course" sx={{ color: "white" }}>
            <MenuItem value="">All Courses</MenuItem>
            {courses.map((c) => <MenuItem key={c._id} value={c._id}>{c.title}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Rating</InputLabel>
          <Select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }} label="Rating" sx={{ color: "white" }}>
            <MenuItem value="">All Ratings</MenuItem>
            {[5,4,3,2,1].map((r) => <MenuItem key={r} value={r}>{r} Stars</MenuItem>)}
          </Select>
        </FormControl>
      </div>

      {/* Reviews */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={100} sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }} />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className={`rounded-[24px] ${glass} py-16 text-center`}>
          <Star size={40} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`rounded-[20px] ${glass} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 font-bold">
                    {r.student?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-semibold">{r.student?.name}</p>
                    <p className="text-xs text-white/40">{r.course?.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StarRow rating={r.rating} />
                  <p className="mt-1 text-xs text-white/35">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {r.comment && <p className="mt-3 text-sm text-white/70 leading-relaxed">{r.comment}</p>}
              {r.teacherReply && (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="mb-1 text-xs font-semibold text-emerald-300">Your Reply</p>
                  <p className="text-sm text-white/60">{r.teacherReply}</p>
                  <div className="mt-2 flex justify-end">
                    <Button size="small" onClick={() => handleDeleteReply(r._id)}
                      sx={{ color: "rgba(239,68,68,0.6)", fontSize: 11, p: 0 }}>Remove Reply</Button>
                  </div>
                </div>
              )}
              {!r.teacherReply && (
                <div className="mt-3 flex justify-end">
                  <Button size="small" variant="outlined" onClick={() => openReply(r)}
                    sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                    Reply
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </div>
      )}

      <Dialog open={!!replyDialog} onClose={() => setReplyDialog(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "#0b1220", color: "white", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reply to Review</DialogTitle>
        <DialogContent>
          {replyDialog && <p className="mb-4 text-sm text-white/50 italic">"{replyDialog.comment}"</p>}
          <TextField fullWidth multiline rows={4} label="Your Reply" value={reply} onChange={(e) => setReply(e.target.value)}
            size="small" InputProps={{ sx: { color: "white" } }} InputLabelProps={{ sx: { color: "rgba(255,255,255,0.6)" } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setReplyDialog(null)} sx={{ color: "rgba(255,255,255,0.6)" }}>Cancel</Button>
          <Button onClick={handleReply} variant="contained" disabled={saving}
            sx={{ borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", fontWeight: 700 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Post Reply"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CourseReviews;
