import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button, CircularProgress, LinearProgress, Skeleton } from "@mui/material";
import { BookOpen, CheckCircle2, Circle, ExternalLink, FileText, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const StudentLessons = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    studentApi.getEnrolledCourses({ limit: 50 })
      .then(({ data }) => {
        const list = data.enrollments || [];
        setEnrollments(list);
        if (list.length > 0) setSelectedCourse(list[0].course);
      })
      .catch(() => toast.error("Failed to load courses"))
      .finally(() => setLoadingCourses(false));
  }, []);

  const fetchLessons = useCallback(async () => {
    if (!selectedCourse?._id) return;
    try {
      setLoadingLessons(true);
      const { data } = await studentApi.getCourseLessons(selectedCourse._id);
      setLessonData(data);
    } catch { toast.error("Failed to load lessons"); }
    finally { setLoadingLessons(false); }
  }, [selectedCourse]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const handleComplete = async (lessonId) => {
    if (!selectedCourse?._id) return;
    try {
      setCompleting(lessonId);
      const { data } = await studentApi.markLessonComplete(selectedCourse._id, lessonId);
      toast.success("Lesson marked complete!");
      setLessonData((prev) => ({
        ...prev,
        progress: data.progress,
        completedCount: data.completedCount,
        lessons: prev.lessons.map((l) =>
          l._id === lessonId ? { ...l, isCompleted: true } : l
        ),
      }));
    } catch { toast.error("Failed to mark lesson"); }
    finally { setCompleting(null); }
  };

  // Group lessons by chapter
  const chapters = lessonData ? [...new Set((lessonData.lessons || []).map((l) => l.chapter || "General"))].reduce((acc, ch) => {
    acc[ch] = (lessonData.lessons || []).filter((l) => (l.chapter || "General") === ch);
    return acc;
  }, {}) : {};

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <h1 className="text-3xl font-bold sm:text-4xl">Lessons & Modules</h1>
        <p className="mt-2 text-white/60">Navigate your course curriculum and track completion</p>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Course Selector */}
        <div className={`rounded-[24px] ${glass} p-4`}>
          <p className="mb-3 text-sm font-semibold text-white/60">My Courses</p>
          {loadingCourses ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={44} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />)}
            </div>
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-6">No enrolled courses</p>
          ) : (
            <div className="space-y-1">
              {enrollments.map((en) => (
                <button key={en._id} onClick={() => setSelectedCourse(en.course)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedCourse?._id === en.course?._id ? "bg-sky-500/20 text-sky-200 font-semibold" : "text-white/60 hover:bg-white/[0.06]"}`}>
                  <p className="truncate">{en.course?.title}</p>
                  <p className="text-xs text-white/35 mt-0.5">{en.progress || 0}% done</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lessons Panel */}
        <div className={`rounded-[24px] ${glass} p-6`}>
          {!selectedCourse ? (
            <div className="py-16 text-center text-white/40">
              <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
              <p>Select a course to view lessons</p>
            </div>
          ) : loadingLessons ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={64} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />)}
            </div>
          ) : (
            <>
              {lessonData && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-semibold">{selectedCourse.title}</span>
                    <span className="text-white/50">{lessonData.completedCount}/{lessonData.totalLessons} lessons</span>
                  </div>
                  <LinearProgress variant="determinate" value={lessonData.progress || 0}
                    sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { bgcolor: "#22c55e" } }} />
                  <p className="mt-1 text-xs text-white/40">{lessonData.progress || 0}% complete</p>
                </div>
              )}

              {Object.entries(chapters).length === 0 ? (
                <div className="py-12 text-center text-white/40">
                  <PlayCircle size={36} className="mx-auto mb-2 opacity-30" />
                  <p>No lessons in this course yet</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(chapters).map(([chapter, lessons]) => (
                    <div key={chapter}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">{chapter}</p>
                      <div className="space-y-2">
                        {lessons.sort((a, b) => a.order - b.order).map((lesson, i) => (
                          <motion.div key={lesson._id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className={`rounded-2xl border p-4 transition ${lesson.isCompleted ? "border-emerald-400/20 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0">
                                {lesson.isCompleted
                                  ? <CheckCircle2 size={18} className="text-emerald-400" />
                                  : <Circle size={18} className="text-white/30" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{lesson.title}</p>
                                {lesson.description && <p className="mt-0.5 text-xs text-white/40 line-clamp-1">{lesson.description}</p>}
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {lesson.videoUrl && (
                                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer"
                                      className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300">
                                      <PlayCircle size={12} /> Watch Video
                                    </a>
                                  )}
                                  {(lesson.resources || []).map((r) => (
                                    <a key={r._id} href={r.url} target="_blank" rel="noreferrer"
                                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                                      <FileText size={12} /> {r.title}
                                    </a>
                                  ))}
                                </div>
                              </div>
                              {!lesson.isCompleted && (
                                <Button size="small" variant="outlined" disabled={completing === lesson._id}
                                  onClick={() => handleComplete(lesson._id)}
                                  sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 11, flexShrink: 0 }}>
                                  {completing === lesson._id ? <CircularProgress size={14} color="inherit" /> : "Complete"}
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLessons;
