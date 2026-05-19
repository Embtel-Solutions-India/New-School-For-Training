import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, IconButton, Skeleton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { BookOpen } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { useCourses } from "../../hooks/useCourses";
import courseApi from "../../services/courseApi";

const FALLBACK_IMAGE = "/images/Courses1.png";

const getDiscountedPrice = (price, discount) =>
  Math.round(price - (price * discount) / 100);

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

const CourseShowcase = () => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const { courses, loading, error } = useCourses({ limit: 20, category: activeCategory || undefined });

  useEffect(() => {
    courseApi.getPublicCategories()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const scrollLeft = () => scrollRef.current.scrollBy({ left: -350, behavior: "smooth" });
  const scrollRight = () => scrollRef.current.scrollBy({ left: 350, behavior: "smooth" });
  const handleWheel = (e) => { scrollRef.current.scrollLeft += e.deltaY; };

  const handleEnroll = () => navigate(user ? "/dashboard" : "/login");

  return (
    <section className="py-20 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gray-50 overflow-hidden">
      {/* HEADER */}
      <div className="text-center mb-16">
        <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">
          Our Programs
        </p>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
          Choose Your Learning Path
        </h2>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Carefully designed programs to help you build real-world skills and grow your career.
        </p>
      </div>

      {/* CATEGORY FILTERS */}
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 border ${
              activeCategory === ""
                ? "bg-green-700 text-white border-green-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-700"
            }`}
          >
            All Courses
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 border ${
                activeCategory === cat
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-center text-red-500 mb-8">{error}</p>}

      {/* LOADING */}
      {loading && (
        <div className="max-w-7xl mx-auto flex gap-5 sm:gap-8 overflow-hidden px-0 sm:px-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={320} height={420}
              sx={{ borderRadius: 4, flexShrink: 0, bgcolor: "rgba(0,0,0,0.06)" }} />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && courses.length === 0 && (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400 text-lg">No courses available yet. Check back soon!</p>
        </div>
      )}

      {/* CAROUSEL */}
      {!loading && courses.length > 0 && (
        <div className="relative max-w-7xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
            <IconButton onClick={scrollLeft}
              className="bg-white! text-gray-800! border border-gray-200 shadow hover:bg-gray-100!">
              <ArrowBackIosNewIcon />
            </IconButton>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
            <IconButton onClick={scrollRight}
              className="bg-white! text-gray-800! border border-gray-200 shadow hover:bg-gray-100!">
              <ArrowForwardIosIcon />
            </IconButton>
          </div>

          <div ref={scrollRef} onWheel={handleWheel}
            className="flex gap-5 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth px-0 sm:px-10 pb-4">
            {courses.map((course, i) => {
              const price = course.pricing?.price ?? 0;
              const discount = course.pricing?.discountPercent ?? 0;
              const discounted = discount > 0 ? getDiscountedPrice(price, discount) : price;
              const tag = course.tags?.[0] || course.category || "Course";
              const lessonCount = course.curriculum?.lessons?.length ?? 0;
              const students = course.enrollmentCount ?? 0;

              return (
                <div key={course._id || i}
                  className="min-w-[calc(100vw-2rem)] sm:min-w-[320px] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition">
                  {/* IMAGE */}
                  <div className="relative">
                    <img src={course.thumbnail || FALLBACK_IMAGE} alt={course.title}
                      className="w-full h-48 object-cover rounded-t-2xl"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }} />
                    <span className="absolute top-3 left-3 bg-green-700 text-white text-xs px-3 py-1 rounded-full">
                      {tag}
                    </span>
                    {discount > 0 && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {students > 0
                        ? `${students.toLocaleString()} students enrolled`
                        : "Be the first to enroll"}
                    </p>
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500 mb-3">
                      <span>⏱ {lessonCount} {lessonCount === 1 ? "Lesson" : "Lessons"}</span>
                      <span>📊 {course.category || "General"}</span>
                    </div>
                    <div className="mb-4">
                      {price === 0 ? (
                        <p className="text-green-700 font-bold text-lg">Free</p>
                      ) : discount > 0 ? (
                        <>
                          <p className="text-green-700 font-bold text-lg">{formatPrice(discounted)}</p>
                          <p className="text-gray-400 line-through text-sm">{formatPrice(price)}</p>
                        </>
                      ) : (
                        <p className="text-green-700 font-bold text-lg">{formatPrice(price)}</p>
                      )}
                    </div>
                    {discount > 0 && (
                      <p className="text-xs text-red-500 font-medium mb-3">Limited Time Offer 🔥</p>
                    )}
                    <div className="mt-auto flex gap-2">
                      <Button fullWidth variant="outlined"
                        onClick={() => navigate(`/courses/${course._id}`)}
                        sx={{ borderRadius: 1.5, borderColor: "#15803d", color: "#15803d", fontSize: 12, fontWeight: 600, "&:hover": { bgcolor: "#f0fdf4", borderColor: "#15803d" } }}>
                        View Details
                      </Button>
                      <Button fullWidth onClick={handleEnroll}
                        sx={{ borderRadius: 1.5, bgcolor: "#15803d", color: "white", fontSize: 12, fontWeight: 600, "&:hover": { bgcolor: "#f97316", color: "black" } }}>
                        Enroll Now
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default CourseShowcase;
