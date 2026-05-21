import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CircularProgress, Skeleton } from "@mui/material";
import { ArrowLeft, Calendar, Clock, Eye, Heart, MessageCircle, Send, Tag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";
import { useBlogDetail } from "../hooks/useBlog";
import blogApi from "../services/blogApi";
import useAuthStore from "../store/authStore";

const FALLBACK_IMAGE = "/images/Tech.jpg";

const BLOG_CONTENT_STYLES = `
  .blog-body h1 { font-size: 1.875rem; font-weight: 700; margin: 1.75rem 0 0.875rem; color: #111827; line-height: 1.3; }
  .blog-body h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: #111827; line-height: 1.35; }
  .blog-body h3 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.625rem; color: #1f2937; }
  .blog-body p { margin-bottom: 1.125rem; line-height: 1.75; }
  .blog-body ul { list-style: disc; padding-left: 1.75rem; margin-bottom: 1.125rem; }
  .blog-body ol { list-style: decimal; padding-left: 1.75rem; margin-bottom: 1.125rem; }
  .blog-body li { margin-bottom: 0.35rem; line-height: 1.7; }
  .blog-body code { background: #f3f4f6; padding: 0.15rem 0.4rem; border-radius: 0.3rem; font-size: 0.875rem; font-family: ui-monospace, monospace; color: #16a34a; }
  .blog-body pre { background: #1f2937; color: #e5e7eb; padding: 1.25rem; border-radius: 0.75rem; overflow-x: auto; margin-bottom: 1.25rem; font-family: ui-monospace, monospace; font-size: 0.875rem; line-height: 1.6; }
  .blog-body pre code { background: none; padding: 0; color: #e5e7eb; }
  .blog-body blockquote { border-left: 4px solid #16a34a; padding: 0.625rem 1.125rem; background: #f0fdf4; margin: 1.25rem 0; border-radius: 0 0.75rem 0.75rem 0; color: #374151; font-style: italic; }
  .blog-body a { color: #16a34a; text-decoration: underline; }
  .blog-body a:hover { color: #f97316; }
  .blog-body img { max-width: 100%; border-radius: 0.75rem; margin: 1.25rem 0; }
  .blog-body table { width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; }
  .blog-body th, .blog-body td { border: 1px solid #e5e7eb; padding: 0.625rem 0.875rem; text-align: left; }
  .blog-body th { background: #f9fafb; font-weight: 600; color: #374151; }
  .blog-body strong { font-weight: 700; color: #111827; }
`;

function CommentItem({ comment, blogId, user, onDelete, onReply }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await blogApi.updateComment(blogId, comment._id, { content: editText.trim() });
      comment.content = editText.trim();
      setEditing(false);
      toast.success("Comment updated");
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0 mt-0.5">
        {comment.author?.avatar
          ? <img src={comment.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          : (comment.author?.name || "?")[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">{comment.author?.name || "User"}</span>
          <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-green-600"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <button onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 bg-green-700 text-white text-xs rounded-lg font-semibold hover:bg-orange-500 transition-colors">
              {saving ? "…" : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-gray-500 text-xs rounded-lg border border-gray-200 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
        )}
        <div className="flex gap-3 mt-1.5">
          {user && (
            <button onClick={() => onReply(comment)}
              className="text-xs text-gray-400 hover:text-green-700 transition-colors">
              Reply
            </button>
          )}
          {user?._id === comment.author?._id && !editing && (
            <button onClick={() => setEditing(true)}
              className="text-xs text-gray-400 hover:text-green-700 transition-colors">
              Edit
            </button>
          )}
          {user?._id === comment.author?._id && (
            <button onClick={() => onDelete(comment._id)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Delete
            </button>
          )}
        </div>
        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
            {comment.replies.map((r) => (
              <CommentItem key={r._id} comment={r} blogId={blogId} user={user} onDelete={onDelete} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { blog, related, loading, error } = useBlogDetail(slug);
  const user = useAuthStore((s) => s.user);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (!blog) return;
    setLikes(blog.likes ?? 0);
    if (user) {
      blogApi.getLikeStatus(blog._id)
        .then(({ data }) => setLiked(data.liked))
        .catch(() => {});
    }
    setCommentsLoading(true);
    blogApi.getComments(blog._id)
      .then(({ data }) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [blog, user]);

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    setLikeLoading(true);
    try {
      const { data } = await blogApi.toggleLike(blog._id);
      setLiked(data.liked);
      setLikes(data.likes);
    } catch {
      toast.error("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user) { toast.error("Sign in to comment"); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await blogApi.createComment(blog._id, {
        content: commentText.trim(),
        parentComment: replyTo?._id || undefined,
      });
      if (replyTo) {
        setComments((prev) => prev.map((c) => {
          if (c._id === replyTo._id) return { ...c, replies: [...(c.replies || []), data.comment] };
          return c;
        }));
      } else {
        setComments((prev) => [...prev, { ...data.comment, replies: [] }]);
      }
      setCommentText("");
      setReplyTo(null);
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await blogApi.deleteComment(blog._id, commentId);
      const removeFrom = (list) => list
        .filter((c) => c._id !== commentId)
        .map((c) => ({ ...c, replies: removeFrom(c.replies || []) }));
      setComments((prev) => removeFrom(prev));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setCommentText("");
    setTimeout(() => commentInputRef.current?.focus(), 50);
  };

  return (
    <div className="overflow-x-hidden">
      <Navbar />

      <main className="mt-20 bg-white min-h-screen">

        {/* LOADING */}
        {loading && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-6">
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
            <Skeleton variant="text" width="70%" height={48} />
            <Skeleton variant="text" width="40%" height={24} />
            {[1,2,3,4,5].map((i) => (
              <Skeleton key={i} variant="text" width={`${85 + Math.random()*15}%`} height={22} />
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="max-w-4xl mx-auto px-4 py-32 text-center">
            <p className="text-gray-400 text-lg mb-6">{error}</p>
            <button onClick={() => navigate("/blog")}
              className="px-6 py-3 bg-green-700 text-white rounded-xl font-semibold hover:bg-orange-500 transition-colors">
              Back to Blog
            </button>
          </div>
        )}

        {!loading && !error && blog && (
          <>
            {/* HERO */}
            <div className="relative h-[340px] sm:h-[440px] md:h-[520px] overflow-hidden">
              <img
                src={blog.featuredImage || FALLBACK_IMAGE}
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10" />

              <div className="absolute bottom-0 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-8 left-1/2 -translate-x-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-block px-3 py-1 rounded-full bg-green-700 text-white text-xs font-semibold mb-3">
                    {blog.category}
                  </span>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                    {blog.title}
                  </h1>
                  {blog.subtitle && (
                    <p className="text-white/70 mt-2 text-base sm:text-lg">{blog.subtitle}</p>
                  )}
                </motion.div>
              </div>
            </div>

            {/* CONTENT WRAPPER */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

              {/* BREADCRUMB + BACK */}
              <button
                onClick={() => navigate("/blog")}
                className="flex items-center gap-2 text-gray-500 hover:text-green-700 text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Blog
              </button>

              {/* META BAR */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pb-6 border-b border-gray-100 mb-8">

                {/* Author */}
                <div className="flex items-center gap-2.5">
                  {blog.author?.avatar ? (
                    <img src={blog.author.avatar} alt={blog.author.name}
                      className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                      {(blog.author?.name || "A")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{blog.author?.name || "Author"}</p>
                    <p className="text-xs text-gray-500">Instructor</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Calendar size={14} />
                  {new Date(blog.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>

                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock size={14} />
                  {blog.readTime ?? 1} min read
                </div>

                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Eye size={14} />
                  {(blog.views ?? 0).toLocaleString()} views
                </div>

                {/* Like button */}
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ml-auto ${liked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                >
                  {likeLoading
                    ? <CircularProgress size={14} sx={{ color: "currentColor" }} />
                    : <Heart size={14} fill={liked ? "currentColor" : "none"} />}
                  {likes}
                </button>
              </div>

              {/* SHORT DESCRIPTION */}
              {blog.shortDescription && (
                <p className="text-lg text-gray-600 leading-relaxed font-medium border-l-4 border-green-700 pl-4 mb-8">
                  {blog.shortDescription}
                </p>
              )}

              {/* BLOG CONTENT */}
              <style>{BLOG_CONTENT_STYLES}</style>
              <div
                className="blog-body text-gray-700 text-base"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content || "<p>No content available.</p>") }}
              />

              {/* TAGS */}
              {blog.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-100">
                  <Tag size={16} className="text-gray-400 mt-0.5" />
                  {blog.tags.map((tag) => (
                    <span key={tag}
                      className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-green-100 hover:text-green-700 transition-colors cursor-pointer">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* COMMENTS */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageCircle size={20} className="text-green-700" />
                  Comments ({comments.length})
                </h3>

                {/* Comment input */}
                {user ? (
                  <div className="mb-8">
                    {replyTo && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                        <span>Replying to <strong>{replyTo.author?.name}</strong></span>
                        <button onClick={() => setReplyTo(null)}
                          className="text-xs text-red-400 hover:text-red-500 font-medium">Cancel</button>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          ref={commentInputRef}
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20"
                          placeholder={replyTo ? `Reply to ${replyTo.author?.name}…` : "Write a comment…"}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                        />
                        <button
                          onClick={handleComment}
                          disabled={submitting || !commentText.trim()}
                          className="px-4 py-2.5 bg-green-700 text-white rounded-xl font-semibold text-sm hover:bg-orange-500 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                        >
                          {submitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : <Send size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mb-6 text-sm text-gray-500">
                    <button onClick={() => navigate("/login")} className="text-green-700 font-semibold hover:text-orange-500 transition-colors">Sign in</button>{" "}
                    to join the conversation.
                  </p>
                )}

                {/* Comments list */}
                {commentsLoading && (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton variant="circular" width={32} height={32} />
                        <div className="flex-1">
                          <Skeleton variant="text" width="30%" height={16} />
                          <Skeleton variant="text" width="80%" height={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!commentsLoading && comments.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">No comments yet. Be the first to share your thoughts!</p>
                )}

                {!commentsLoading && comments.length > 0 && (
                  <div className="space-y-5">
                    {comments.map((c) => (
                      <CommentItem
                        key={c._id}
                        comment={c}
                        blogId={blog._id}
                        user={user}
                        onDelete={handleDeleteComment}
                        onReply={handleReply}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* RELATED BLOGS */}
            {related.length > 0 && (
              <section className="bg-gray-50 py-14 sm:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8">Related Posts</h2>
                  <div className="grid sm:grid-cols-3 gap-5">
                    {related.map((r) => (
                      <motion.div
                        key={r._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        onClick={() => navigate(`/blog/${r.slug}`)}
                        className="group cursor-pointer bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                      >
                        <img
                          src={r.featuredImage || FALLBACK_IMAGE}
                          alt={r.title}
                          className="w-full h-36 object-cover group-hover:scale-105 transition duration-500"
                          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                        />
                        <div className="p-4">
                          <span className="text-xs text-green-700 font-semibold">{r.category}</span>
                          <h4 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-green-700 transition-colors">
                            {r.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-2">{r.readTime ?? 1} min read</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
