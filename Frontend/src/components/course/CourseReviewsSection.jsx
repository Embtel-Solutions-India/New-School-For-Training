import { useState, useEffect, useCallback } from "react";
import { Button, CircularProgress } from "@mui/material";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { courseApi } from "../../services/courseApi";
import studentApi from "../../services/studentApi";

const Stars = ({ value, onChange, size = "text-2xl" }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange?.(s)}
        className={`${size} transition-transform leading-none ${
          s <= value ? "text-amber-400" : "text-gray-300"
        } ${onChange ? "hover:scale-125 cursor-pointer" : "cursor-default"}`}
      >
        ★
      </button>
    ))}
  </div>
);

const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-amber-400 text-xs w-4 shrink-0">{star}★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-amber-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-400 text-xs w-6 text-right shrink-0">{count}</span>
    </div>
  );
};

export default function CourseReviewsSection({ courseId, user }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await courseApi.getCourseReviews(courseId);
      setReviews(data.reviews || []);
      setStats(data.stats || null);
      if (user?._id) {
        const mine = (data.reviews || []).find(
          (r) => r.student?._id?.toString() === user._id?.toString()
        );
        if (mine) {
          setMyReview(mine);
          setMyRating(mine.rating);
          setMyComment(mine.comment || "");
        } else {
          setMyReview(null);
        }
      }
    } catch {
      // silent — reviews section is non-critical
    } finally {
      setLoading(false);
    }
  }, [courseId, user?._id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!myRating) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    try {
      await studentApi.submitReview({ courseId, rating: myRating, comment: myComment.trim() });
      toast.success(myReview ? "Review updated!" : "Review submitted! Thank you.");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview || !window.confirm("Delete your review?")) return;
    setDeleting(true);
    try {
      await studentApi.deleteReview(myReview._id);
      toast.success("Review deleted");
      setMyReview(null);
      setMyRating(5);
      setMyComment("");
      load();
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  const isStudent = user?.role === "student";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
        <Star size={20} className="text-amber-500" />
        Student Reviews
        {stats?.total > 0 && (
          <span className="text-sm font-normal text-gray-400 ml-1">({stats.total})</span>
        )}
      </h2>

      {loading && (
        <div className="flex justify-center py-8">
          <CircularProgress size={24} sx={{ color: "#15803d" }} />
        </div>
      )}

      {!loading && (
        <>
          {/* Rating summary */}
          {stats && stats.total > 0 && (
            <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-gray-100">
              <div className="text-center shrink-0">
                <p className="text-5xl font-bold text-gray-900 leading-none">{stats.avgRating}</p>
                <div className="mt-2">
                  <Stars value={Math.round(stats.avgRating)} size="text-lg" />
                </div>
                <p className="text-xs text-gray-400 mt-1">{stats.total} review{stats.total !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((s) => (
                  <RatingBar key={s} star={s} count={stats.breakdown?.[s] || 0} total={stats.total} />
                ))}
              </div>
            </div>
          )}

          {/* Write / Edit review CTA */}
          {isStudent && !showForm && (
            <div className="mb-5 flex items-center gap-3 flex-wrap">
              <Button
                variant="outlined"
                onClick={() => setShowForm(true)}
                sx={{
                  borderColor: "#15803d", color: "#15803d", borderRadius: 2, fontSize: 13,
                  "&:hover": { bgcolor: "#f0fdf4", borderColor: "#15803d" },
                }}
              >
                {myReview ? "Edit Your Review" : "Write a Review"}
              </Button>
              {myReview && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs text-red-400 hover:text-red-600 underline disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              )}
              {myReview && (
                <div className="flex items-center gap-1.5">
                  <Stars value={myReview.rating} size="text-sm" />
                  <span className="text-xs text-gray-400">Your rating</span>
                </div>
              )}
            </div>
          )}

          {/* Review form */}
          {isStudent && showForm && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 space-y-3">
              <p className="text-sm font-semibold text-gray-800">
                {myReview ? "Edit Your Review" : "Write a Review"}
              </p>
              <Stars value={myRating} onChange={setMyRating} />
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Share your experience with this course…"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{myComment.length}/2000</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowForm(false)}
                    size="small"
                    sx={{ color: "#6b7280", fontSize: 12 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    variant="contained"
                    size="small"
                    sx={{
                      bgcolor: "#15803d", borderRadius: 2, fontSize: 12,
                      "&:hover": { bgcolor: "#166534" },
                    }}
                  >
                    {submitting
                      ? <CircularProgress size={14} sx={{ color: "white" }} />
                      : myReview ? "Update" : "Submit"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No reviews yet.{isStudent ? " Be the first to review this course!" : ""}
            </p>
          ) : (
            <div className="space-y-5">
              {reviews.map((r) => (
                <div key={r._id} className="flex gap-3 pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-green-100 overflow-hidden flex items-center justify-center shrink-0 border border-gray-100">
                    {r.student?.avatar
                      ? <img src={r.student.avatar} alt="" className="h-full w-full object-cover" />
                      : <span className="text-green-700 font-bold text-sm">
                          {r.student?.name?.[0]?.toUpperCase() || "?"}
                        </span>}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{r.student?.name}</span>
                      <Stars value={r.rating} size="text-xs" />
                      {r.isFeatured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                          ⭐ Featured
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>

                    {r.comment && (
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.comment}</p>
                    )}

                    {r.teacherReply && (
                      <div className="mt-2 pl-3 border-l-2 border-green-200 py-1">
                        <p className="text-xs font-semibold text-green-700 mb-0.5">Instructor reply</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{r.teacherReply}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
