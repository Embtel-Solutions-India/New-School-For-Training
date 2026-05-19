import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import { BookOpen, Clock, Users } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { useCourses } from "../../hooks/useCourses";

const FALLBACK_IMAGE = "/images/Courses1.png";

export default function CourseShowcase() {
  const ref = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { courses, loading, error } = useCourses({ limit: 8 });

  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden bg-white">
      {/* GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-green-100 rounded-full blur-3xl opacity-20 pointer-events-none" />

      {/* HEADER */}
      <div className="relative text-center px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-sm font-semibold text-green-700 uppercase tracking-[0.25em]">
          Career Focused Programs
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-gray-900">
          Learn Skills That{" "}
          <span className="text-green-700">Build Real Careers</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-gray-500 leading-relaxed">
          Learn through projects, mentorship, and industry-focused training.
        </motion.p>
      </div>

      {/* SLIDER WRAPPER */}
      <div className="relative mt-10 sm:mt-14">
        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-8 sm:w-16 bg-linear-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 sm:w-16 bg-linear-to-l from-white to-transparent z-10" />

        {/* Loading skeletons */}
        {loading && (
          <div className="flex gap-5 overflow-hidden px-4 sm:px-10 lg:px-20 pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" width={300} height={400}
                sx={{ borderRadius: 3, flexShrink: 0, bgcolor: "rgba(0,0,0,0.05)" }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <p className="text-center text-red-400 py-8 text-sm">{error}</p>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-14">
            <BookOpen size={44} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400">No courses available yet.</p>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <div
            ref={ref}
            className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar px-4 sm:px-10 lg:px-20 pb-4"
          >
            {courses.map((course, i) => (
              <motion.div
                key={course._id || i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="w-[calc(100vw-2rem)] sm:w-72 md:w-80 shrink-0"
              >
                <CourseCard
                  course={course}
                  onEnroll={() => navigate(user ? "/dashboard" : "/login")}
                  onViewDetails={() => navigate(`/courses/${course._id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Card ── */
const CourseCard = ({ course, onEnroll, onViewDetails }) => {
  const tag = course.tags?.[0] || course.category || "Course";
  const students = course.enrollmentCount ?? 0;
  const lessonCount = course.curriculum?.lessons?.length ?? 0;
  const price = course.pricing?.price ?? 0;
  const discount = course.pricing?.discountPercent ?? 0;
  const discountedPrice = discount > 0 ? Math.round(price - (price * discount) / 100) : price;
  const desc = course.description || "";

  return (
    <div className="group flex flex-col h-full rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">

      {/* IMAGE */}
      <div className="relative h-44 overflow-hidden shrink-0">
        <img
          src={course.thumbnail || FALLBACK_IMAGE}
          alt={course.title}
          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Tag badge */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 shadow-sm">
          {tag}
        </span>

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
          {course.title}
        </h3>

        {/* Meta pills */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {students > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={11} className="text-gray-400" />
              {students.toLocaleString()} students
            </span>
          )}
          {lessonCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={11} className="text-gray-400" />
              {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
            </span>
          )}
          {course.category && (
            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              {course.category}
            </span>
          )}
        </div>

        {/* Description */}
        {desc && (
          <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-2">
            {desc}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-3" />

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Price row */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-gray-900">
              {price === 0 ? "Free" : `$${discountedPrice.toLocaleString()}`}
            </span>
            {discount > 0 && price > 0 && (
              <span className="text-sm text-gray-400 line-through">${price.toLocaleString()}</span>
            )}
          </div>

          {/* Buttons — side by side */}
          <div className="flex gap-2">
            <button
              onClick={onViewDetails}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-green-600 hover:text-green-700 transition-colors duration-200"
            >
              Details
            </button>
            <button
              onClick={onEnroll}
              className="flex-1 py-2 rounded-xl bg-green-700 text-sm font-semibold text-white hover:bg-orange-500 transition-colors duration-200"
            >
              Enroll
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
