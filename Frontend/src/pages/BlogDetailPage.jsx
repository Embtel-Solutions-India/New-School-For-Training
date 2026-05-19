import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import { ArrowLeft, Calendar, Clock, Eye, Tag } from "lucide-react";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";
import { useBlogDetail } from "../hooks/useBlog";

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

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { blog, related, loading, error } = useBlogDetail(slug);

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
                dangerouslySetInnerHTML={{ __html: blog.content || "<p>No content available.</p>" }}
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
