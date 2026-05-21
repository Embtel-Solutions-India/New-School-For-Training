import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Skeleton, Tooltip,
} from "@mui/material";
import { Edit, Star, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
    "&.Mui-focused fieldset": { borderColor: "#22c55e" },
  },
};

const Stars = ({ value, onChange, size = "text-xl" }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange?.(s)}
        className={`${size} leading-none transition-transform ${
          s <= value ? "text-amber-400" : "text-white/20"
        } ${onChange ? "hover:scale-125 cursor-pointer" : "cursor-default"}`}
      >
        ★
      </button>
    ))}
  </div>
);

export default function StudentReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    studentApi
      .getMyReviews()
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => toast.error("Failed to load reviews"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (r) => {
    setEditTarget(r);
    setEditRating(r.rating);
    setEditComment(r.comment || "");
  };

  const handleSave = async () => {
    if (!editRating) { toast.error("Select a rating"); return; }
    setSaving(true);
    try {
      await studentApi.submitReview({
        courseId: editTarget.course._id,
        rating: editRating,
        comment: editComment.trim(),
      });
      toast.success("Review updated!");
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete your review for "${r.course?.title}"?`)) return;
    setDeleting(r._id);
    try {
      await studentApi.deleteReview(r._id);
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((x) => x._id !== r._id));
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">My Reviews</h2>
        <p className="text-white/50 text-sm mt-1">
          {reviews.length} course{reviews.length !== 1 ? "s" : ""} reviewed
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={130}
              sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: 3 }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && reviews.length === 0 && (
        <div className={`${glass} rounded-2xl p-14 text-center`}>
          <Star size={44} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40 mb-2">You haven't reviewed any courses yet.</p>
          <p className="text-white/25 text-sm">
            Enroll in a course and share your experience!
          </p>
        </div>
      )}

      {/* Review cards */}
      {!loading && reviews.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {reviews.map((r, i) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${glass} rounded-2xl p-5 flex flex-col gap-3`}
            >
              {/* Course thumbnail + title */}
              <div className="flex gap-3 items-start">
                {r.course?.thumbnail && (
                  <img
                    src={r.course.thumbnail}
                    alt={r.course.title}
                    className="w-14 h-10 object-cover rounded-lg shrink-0"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-snug line-clamp-2">
                    {r.course?.title || "Unknown Course"}
                  </p>
                  <p className="text-white/35 text-xs mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Stars */}
              <Stars value={r.rating} size="text-lg" />

              {/* Comment */}
              {r.comment ? (
                <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{r.comment}</p>
              ) : (
                <p className="text-white/25 text-xs italic">No written review</p>
              )}

              {/* Featured badge */}
              {r.isFeatured && (
                <span className="self-start text-xs px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/20 font-medium">
                  ⭐ Featured Review
                </span>
              )}

              {/* Teacher reply */}
              {r.teacherReply && (
                <div className="pl-3 border-l-2 border-green-500/30 py-1">
                  <p className="text-xs text-green-400 font-semibold mb-0.5">Instructor replied</p>
                  <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{r.teacherReply}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <Tooltip title="Edit Review">
                  <IconButton size="small" onClick={() => openEdit(r)}
                    sx={{ color: "rgba(255,255,255,0.55)", "&:hover": { color: "#22c55e" } }}>
                    <Edit size={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Review">
                  <IconButton size="small" onClick={() => handleDelete(r)}
                    disabled={deleting === r._id}
                    sx={{ color: "rgba(239,68,68,0.5)", "&:hover": { color: "#ef4444" } }}>
                    {deleting === r._id
                      ? <CircularProgress size={12} sx={{ color: "#ef4444" }} />
                      : <Trash2 size={14} />}
                  </IconButton>
                </Tooltip>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onClose={() => !saving && setEditTarget(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: "rgba(7,11,20,0.97)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              color: "white",
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="text-white font-bold">Edit Review</span>
          <IconButton onClick={() => setEditTarget(null)} sx={{ color: "rgba(255,255,255,0.5)" }}>
            <X size={16} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <p className="text-white/50 text-sm mb-4 truncate">
            {editTarget?.course?.title}
          </p>
          <p className="text-white/70 text-sm mb-2">Your rating</p>
          <Stars value={editRating} onChange={setEditRating} />
          <textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Share your experience…"
            className="mt-4 w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80 placeholder-white/25 resize-none focus:outline-none focus:border-green-500/50"
          />
          <p className="text-xs text-white/25 text-right mt-1">{editComment.length}/2000</p>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setEditTarget(null)}
            sx={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="bg-green-600! hover:bg-orange-500! text-white! rounded-lg! font-semibold!">
            {saving ? <CircularProgress size={16} sx={{ color: "white" }} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
