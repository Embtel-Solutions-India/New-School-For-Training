import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Skeleton } from "@mui/material";
import {
  BookOpen, ChevronDown, ChevronUp, Clock, FlaskConical,
  Lightbulb, PlayCircle, Tag, Target, Trophy, User,
} from "lucide-react";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";
import useAuthStore from "../store/authStore";
import { useCourseDetail } from "../hooks/useCourses";

const FALLBACK_IMAGE = "/images/Courses1.png";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);

/* ── Reusable section card ── */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, children, color = "text-green-600" }) => (
  <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
    <Icon size={20} className={color} />
    {children}
  </h2>
);

/* ── Week accordion row ── */
const WeekRow = ({ week }) => {
  const [open, setOpen] = useState(false);
  const lectures = week.lectures?.filter(Boolean) || [];

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-bold">
          {week.weekNo}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm leading-snug">
            {week.title || `Week ${week.weekNo}`}
          </p>
          {week.objective && !open && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{week.objective}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {week.duration && (
            <span className="hidden sm:inline text-xs text-gray-400 font-medium">{week.duration}</span>
          )}
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-4 space-y-4 bg-white">
          {week.objective && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Strategic Objective</p>
              <p className="text-sm text-gray-700 leading-relaxed">{week.objective}</p>
            </div>
          )}

          {lectures.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Core Lectures</p>
              <ul className="space-y-1">
                {lectures.map((lec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <PlayCircle size={13} className="text-green-500 shrink-0 mt-0.5" />
                    {lec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {week.lab && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Industrial Lab</p>
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                <FlaskConical size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">{week.lab}</p>
              </div>
            </div>
          )}

          {week.caseStudy && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Industry Case Study</p>
              <div className="flex items-start gap-2 rounded-lg bg-purple-50 border border-purple-100 px-3 py-2">
                <Lightbulb size={14} className="text-purple-500 shrink-0 mt-0.5" />
                <p className="text-sm text-purple-700">{week.caseStudy}</p>
              </div>
            </div>
          )}

          {week.duration && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} /> {week.duration}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main Page ── */
const CourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { course, loading, error } = useCourseDetail(courseId);

  const isFree = (course?.pricing?.price ?? 0) === 0;

  const handleEnroll = () => {
    if (!user) return navigate("/login");
    if (!isFree) return navigate(`/checkout/${courseId}`);
    navigate("/dashboard");
  };

  const hasWeeklyPlan = course?.weeklyPlan?.length > 0;
  const hasSkills = course?.skills?.length > 0;
  const hasObjectives = course?.objectives?.length > 0;
  const hasCapstone = course?.capstone?.title;
  const hasLessons = course?.curriculum?.lessons?.length > 0;

  return (
    <div className="overflow-x-hidden min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 mt-20 sm:px-6 py-12 sm:py-16">
        {/* LOADING */}
        {loading && (
          <div className="space-y-6">
            <Skeleton variant="rounded" height={340} sx={{ borderRadius: 4, bgcolor: "rgba(0,0,0,0.06)" }} />
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 4, bgcolor: "rgba(0,0,0,0.06)" }} />
            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4, bgcolor: "rgba(0,0,0,0.06)" }} />
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="text-center py-24">
            <BookOpen size={52} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-semibold text-gray-500 mb-2">Course not found</p>
            <p className="text-gray-400 mb-6">This course may have been unpublished or doesn't exist.</p>
            <Button onClick={() => navigate("/courses")} variant="contained"
              sx={{ bgcolor: "#15803d", borderRadius: 2, "&:hover": { bgcolor: "#166534" } }}>
              Browse All Courses
            </Button>
          </div>
        )}

        {/* CONTENT */}
        {!loading && course && (
          <div className="space-y-8">

            {/* ── HERO ── */}
            <div className="grid gap-8 lg:grid-cols-5">
              {/* LEFT */}
              <div className="lg:col-span-3 space-y-5">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <button onClick={() => navigate("/courses")} className="hover:text-green-700 transition">Courses</button>
                  <span>/</span>
                  <span className="text-gray-600 truncate">{course.title}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {course.category && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      <Tag size={11} /> {course.category}
                    </span>
                  )}
                  {course.duration && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      <Clock size={11} /> {course.duration}
                    </span>
                  )}
                  {course.tags?.slice(0, 3).map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{t}</span>
                  ))}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{course.title}</h1>

                {course.description && (
                  <p className="text-gray-600 text-base leading-7">{course.description}</p>
                )}

                {course.teacher && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 overflow-hidden flex items-center justify-center shrink-0">
                      {course.teacher.avatar
                        ? <img src={course.teacher.avatar} alt="" className="h-full w-full object-cover" />
                        : <User size={18} className="text-green-700" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{course.teacher.name}</p>
                      <p className="text-xs text-gray-400">Instructor</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <PlayCircle size={15} className="text-green-600" />
                    {course.curriculum?.lessons?.length ?? 0} Lessons
                  </span>
                  {hasWeeklyPlan && (
                    <span className="flex items-center gap-1.5">
                      <Target size={15} className="text-green-600" />
                      {course.weeklyPlan.length} Week Roadmap
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={15} className="text-green-600" />
                    {course.curriculum?.quizzes?.length ?? 0} Quizzes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={15} className="text-green-600" />
                    {course.enrollmentCount ?? 0} Enrolled
                  </span>
                  {course.estimatedHours > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={15} className="text-green-600" />
                      ~{course.estimatedHours}h total
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT: Pricing card */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden sticky top-24">
                  <img src={course.thumbnail || FALLBACK_IMAGE} alt={course.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }} />
                  <div className="p-5 space-y-4">
                    {course.pricing?.price > 0 ? (
                      <div>
                        {course.pricing.discountPercent > 0 ? (
                          <>
                            <p className="text-3xl font-bold text-gray-900">
                              {formatPrice(Math.round(course.pricing.price - (course.pricing.price * course.pricing.discountPercent) / 100))}
                            </p>
                            <p className="text-gray-400 line-through text-sm">{formatPrice(course.pricing.price)}</p>
                            <p className="text-xs text-red-500 font-medium mt-0.5">{course.pricing.discountPercent}% off — Limited Time 🔥</p>
                          </>
                        ) : (
                          <p className="text-3xl font-bold text-gray-900">{formatPrice(course.pricing.price)}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-green-700">Free</p>
                    )}
                    <Button fullWidth onClick={handleEnroll} variant="contained"
                      sx={{ py: 1.5, borderRadius: 2, bgcolor: "#15803d", fontWeight: 700, fontSize: 15, "&:hover": { bgcolor: "#f97316" } }}>
                      {!user
                        ? "Enroll Now"
                        : !isFree
                        ? "Buy Now"
                        : "Go to Dashboard"}
                    </Button>
                    {!user && (
                      <p className="text-center text-xs text-gray-400">
                        Already have an account?{" "}
                        <button onClick={() => navigate("/login")} className="text-green-700 hover:underline font-medium">Log in</button>
                      </p>
                    )}
                    {/* Quick stats inside card */}
                    {(hasWeeklyPlan || hasSkills) && (
                      <div className="border-t border-gray-100 pt-4 space-y-2">
                        {course.duration && (
                          <p className="text-xs text-gray-500 flex items-center gap-2"><Clock size={12} className="text-green-600" /> {course.duration}</p>
                        )}
                        {hasWeeklyPlan && (
                          <p className="text-xs text-gray-500 flex items-center gap-2"><Target size={12} className="text-green-600" /> {course.weeklyPlan.length}-week structured roadmap</p>
                        )}
                        {hasSkills && (
                          <p className="text-xs text-gray-500 flex items-center gap-2"><Trophy size={12} className="text-green-600" /> {course.skills.length} skills covered</p>
                        )}
                        {hasCapstone && (
                          <p className="text-xs text-gray-500 flex items-center gap-2"><FlaskConical size={12} className="text-green-600" /> Includes capstone project</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── SKILLS ── */}
            {hasSkills && (
              <Card>
                <SectionTitle icon={Trophy} color="text-amber-500">Skills You'll Learn</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {course.skills.map((skill, i) => (
                    <span key={i} className="px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* ── LEARNING OBJECTIVES ── */}
            {hasObjectives && (
              <Card>
                <SectionTitle icon={Target} color="text-blue-500">Learning Objectives</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  {course.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                      <span className="mt-0.5 text-sm text-blue-500 font-bold shrink-0">✓</span>
                      <p className="text-sm text-gray-700 leading-snug">{obj}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ── WEEKLY ROADMAP ── */}
            {hasWeeklyPlan && (
              <Card>
                <SectionTitle icon={Target} color="text-green-600">
                  {course.weeklyPlan.length}-Week Course Roadmap
                </SectionTitle>
                <div className="space-y-2">
                  {course.weeklyPlan
                    .slice()
                    .sort((a, b) => a.weekNo - b.weekNo)
                    .map((week, i) => <WeekRow key={week._id || i} week={week} />)}
                </div>
              </Card>
            )}

            {/* ── LESSON CURRICULUM ── */}
            {hasLessons && (
              <Card>
                <SectionTitle icon={PlayCircle} color="text-green-600">Course Curriculum</SectionTitle>
                <div className="space-y-2">
                  {course.curriculum.lessons
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((lesson, i) => (
                      <div key={lesson._id || i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-sm text-gray-700 font-medium flex-1 min-w-0 truncate">{lesson.title}</span>
                        {lesson.chapter && (
                          <span className="text-xs text-gray-400 shrink-0">{lesson.chapter}</span>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* ── CAPSTONE ── */}
            {hasCapstone && (
              <Card>
                <SectionTitle icon={FlaskConical} color="text-purple-500">Capstone Project</SectionTitle>
                <div className="rounded-xl bg-purple-50 border border-purple-100 p-5 space-y-3">
                  <p className="text-lg font-bold text-purple-900">{course.capstone.title}</p>
                  {course.capstone.description && (
                    <p className="text-sm text-gray-700 leading-relaxed">{course.capstone.description}</p>
                  )}
                  {course.capstone.requirements?.filter(Boolean).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Prerequisites</p>
                      <div className="flex flex-wrap gap-2">
                        {course.capstone.requirements.filter(Boolean).map((req, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-white border border-purple-200 text-purple-700 text-xs font-medium">{req}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetailPage;
