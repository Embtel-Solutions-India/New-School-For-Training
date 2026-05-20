import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Pagination, Skeleton } from "@mui/material";
import { BookOpen, Search, X } from "lucide-react";
import { usePublicBlogs } from "../../hooks/useBlog";
import blogApi from "../../services/blogApi";

const FALLBACK_IMAGE = "/images/Tech.jpg";

const BLOG_CATEGORIES = [
  "All",
  "AI & Data", "Cloud & Security", "Development", "Career",
  "Technology", "Certifications", "Student Stories", "Industry Trends",
];

export default function BlogListing() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState(BLOG_CATEGORIES);

  const LIMIT = 9;
  const { blogs, total, pages, loading, error } = usePublicBlogs({ search, category, page, limit: LIMIT });

  useEffect(() => {
    blogApi.getPublicCategories()
      .then(({ data }) => {
        const fetched = (data.categories || []).filter(Boolean);
        if (fetched.length) setCategories(["All", ...fetched]);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleCategory = (cat) => {
    setCategory(cat === "All" ? "" : cat);
    setPage(1);
  };

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* SEARCH */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit"
            className="px-5 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-orange-500 transition-colors">
            Search
          </button>
        </form>

        {/* CATEGORY FILTER */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {categories.map((cat) => {
            const active = cat === "All" ? !category : category === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-700"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden">
                <Skeleton variant="rectangular" height={200} sx={{ bgcolor: "rgba(0,0,0,0.05)" }} />
                <div className="p-4">
                  <Skeleton variant="text" width="50%" height={14} sx={{ bgcolor: "rgba(0,0,0,0.05)" }} />
                  <Skeleton variant="text" width="90%" height={20} sx={{ bgcolor: "rgba(0,0,0,0.05)" }} />
                  <Skeleton variant="text" width="40%" height={14} sx={{ bgcolor: "rgba(0,0,0,0.05)" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <p className="text-center text-red-400 py-8 text-sm">{error}</p>
        )}

        {/* EMPTY */}
        {!loading && !error && blogs.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={44} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400">No articles found{search ? ` for "${search}"` : ""}.</p>
            {(search || category) && (
              <button onClick={() => { clearSearch(); setCategory(""); }}
                className="mt-4 text-sm text-green-700 font-semibold hover:text-orange-500 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* GRID */}
        {!loading && blogs.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {blogs.map((blog, i) => (
                <motion.article
                  key={blog._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/blog/${blog.slug}`)}
                  className="group cursor-pointer bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="overflow-hidden h-48">
                    <img
                      src={blog.featuredImage || FALLBACK_IMAGE}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-xs text-green-700 font-semibold">{blog.category}</span>
                    <h3 className="mt-1.5 text-base font-bold text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors leading-snug">
                      {blog.title}
                    </h3>
                    {blog.shortDescription && (
                      <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{blog.shortDescription}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      <span>{blog.readTime ?? 1} min read</span>
                      {blog.author?.name && <span>· {blog.author.name}</span>}
                      <span>· {new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* PAGINATION */}
            {pages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  count={pages}
                  page={page}
                  onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  sx={{
                    "& .MuiPaginationItem-root": { color: "#374151", fontWeight: 600 },
                    "& .Mui-selected": { bgcolor: "#15803d !important", color: "white" },
                    "& .MuiPaginationItem-root:hover": { bgcolor: "rgba(21,128,61,0.1)" },
                  }}
                />
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-4">
              Showing {blogs.length} of {total} articles
            </p>
          </>
        )}

      </div>
    </section>
  );
}
