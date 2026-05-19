import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Skeleton } from "@mui/material";
import { BookOpen } from "lucide-react";
import { usePublicBlogs } from "../../hooks/useBlog";

const FALLBACK_IMAGE = "/images/Tech.jpg";

const BlogSection = () => {
  const navigate = useNavigate();
  const { blogs, loading, error } = usePublicBlogs({ limit: 4 });

  const featured = blogs[0] || null;
  const side = blogs.slice(1, 4);

  return (
    <section className="py-20 sm:py-24 lg:py-32 px-4 sm:px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">
            Our Blog
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Insights & Learning Resources
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Stay updated with industry trends, learning strategies,
            and career guidance from experts.
          </p>
        </motion.div>

        {/* LOADING */}
        {loading && (
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            <Skeleton variant="rounded" className="md:col-span-2"
              sx={{ height: 400, borderRadius: 3, bgcolor: "rgba(0,0,0,0.06)" }} />
            <div className="flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton variant="rounded" width={96} height={96} sx={{ borderRadius: 2, flexShrink: 0, bgcolor: "rgba(0,0,0,0.06)" }} />
                  <div className="flex-1">
                    <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: "rgba(0,0,0,0.06)" }} />
                    <Skeleton variant="text" width="90%" height={20} sx={{ bgcolor: "rgba(0,0,0,0.06)" }} />
                    <Skeleton variant="text" width="40%" height={14} sx={{ bgcolor: "rgba(0,0,0,0.06)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <p className="text-center text-red-400 py-8 text-sm">{error}</p>
        )}

        {/* EMPTY */}
        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={44} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400">No blog posts available yet. Check back soon!</p>
          </div>
        )}

        {/* GRID */}
        {!loading && blogs.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">

            {/* FEATURED BLOG */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="md:col-span-2 group relative rounded-2xl overflow-hidden shadow-xl cursor-pointer"
                onClick={() => navigate(`/blog/${featured.slug}`)}
              >
                <img
                  src={featured.featuredImage || FALLBACK_IMAGE}
                  alt={featured.title}
                  className="w-full h-75 sm:h-100 object-cover transition duration-700 group-hover:scale-105"
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 p-5 sm:p-6 text-white">
                  <span className="text-xs bg-green-700 px-3 py-1 rounded-full">
                    {featured.category}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold line-clamp-2">
                    {featured.title}
                  </h3>
                  {featured.shortDescription && (
                    <p className="text-sm text-gray-200 mt-2 line-clamp-2">
                      {featured.shortDescription}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-300">
                    {featured.readTime ?? 1} min read
                    {featured.author?.name && ` · ${featured.author.name}`}
                  </p>
                </div>
              </motion.div>
            )}

            {/* SIDE BLOGS */}
            <div className="flex flex-col gap-6">
              {side.map((blog, i) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/blog/${blog.slug}`)}
                  className="flex gap-4 group cursor-pointer min-w-0"
                >
                  <img
                    src={blog.featuredImage || FALLBACK_IMAGE}
                    alt={blog.title}
                    className="w-24 sm:w-28 h-24 sm:h-28 shrink-0 object-cover rounded-xl"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs text-green-700 font-semibold">
                      {blog.category}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition line-clamp-2">
                      {blog.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {blog.readTime ?? 1} min read
                      {blog.author?.name && ` · ${blog.author.name}`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div className="text-center mt-16">
            <Button
              onClick={() => navigate("/blog")}
              className="bg-green-700! text-white! px-8! py-3! rounded-md! hover:bg-orange-500! hover:text-black!"
            >
              View All Blogs
            </Button>
          </div>
        )}

      </div>
    </section>
  );
};

export default BlogSection;
