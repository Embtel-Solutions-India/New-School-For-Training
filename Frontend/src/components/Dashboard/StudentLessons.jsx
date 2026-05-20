import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, CircularProgress, LinearProgress, Skeleton } from "@mui/material";
import { BookOpen, Bot, CheckCircle2, Circle, FileText, PlayCircle, Send, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";
import aiApi from "../../services/aiApi";
import LessonVideoPlayer from "../lesson/LessonVideoPlayer";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

// ── Inline AI Chat Modal ──────────────────────────────────────────────────────
const AI_PROMPTS = [
  { label: "Summarize", prompt: "Summarize the key points of this lesson." },
  { label: "Quiz me", prompt: "Generate 5 practice questions for this lesson." },
  { label: "Explain", prompt: "Explain the main concept of this lesson with examples." },
];

const LessonAIModal = ({ lesson, courseTitle, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);
    setMessages((p) => [...p, { role: "user", content: msg, timestamp: new Date() }]);
    try {
      const { data } = await aiApi.sendMessage({
        message: msg,
        sessionId,
        courseId: lesson.courseId,
        lessonId: lesson._id,
      });
      setSessionId(data.sessionId);
      setMessages(data.messages);
    } catch (err) {
      toast.error(err?.response?.data?.message || "AI temporarily unavailable");
      setMessages((p) => p.slice(0, -1));
      setInput(msg);
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-lg rounded-[24px] border border-white/10 bg-[#0b1220] flex flex-col shadow-2xl"
        style={{ maxHeight: "80vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/20">
              <Bot size={15} className="text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-semibold">Ask AI</p>
              <p className="text-xs text-white/40 truncate max-w-[220px]">{lesson.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"><X size={16} /></button>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {messages.length === 0 ? (
            <div className="py-6 text-center">
              <Sparkles size={24} className="mx-auto mb-3 text-violet-400/50" />
              <p className="text-xs text-white/40">Quick actions for this lesson:</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {AI_PROMPTS.map((p) => (
                  <button key={p.label} onClick={() => send(p.prompt)}
                    className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.1] hover:text-white transition">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-xs ${m.role === "user" ? "rounded-br-sm bg-sky-500/20 text-sky-100" : "rounded-bl-sm border border-white/10 bg-white/[0.06] text-white/85"}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.07] px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0,1,2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white/40" animate={{ y:[0,-4,0] }} transition={{ duration: 0.6, delay: i*0.15, repeat: Infinity }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        {/* Input */}
        <div className="border-t border-white/10 p-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about this lesson…" disabled={sending}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-violet-400/40 disabled:opacity-50" />
          <button onClick={() => send()} disabled={!input.trim() || sending}
            className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition disabled:opacity-40">
            <Send size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const StudentLessons = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [aiLesson, setAiLesson] = useState(null);

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
    setActiveLesson(null);
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

  // Called by LessonVideoPlayer when 80% watched
  const handleVideoComplete = useCallback((lessonId) => {
    setLessonData((prev) => {
      if (!prev) return prev;
      const alreadyDone = prev.lessons.find((l) => l._id === lessonId)?.isCompleted;
      if (alreadyDone) return prev;
      toast.success("Lesson completed!");
      const updatedLessons = prev.lessons.map((l) =>
        l._id === lessonId ? { ...l, isCompleted: true } : l
      );
      const completedCount = updatedLessons.filter((l) => l.isCompleted).length;
      const progress = prev.totalLessons > 0 ? Math.round((completedCount / prev.totalLessons) * 100) : 0;
      return { ...prev, lessons: updatedLessons, completedCount, progress };
    });
  }, []);

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
              {/* Inline video player */}
              {activeLesson?.videoUrl && (
                <motion.div
                  key={activeLesson._id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/80 truncate pr-4">{activeLesson.title}</p>
                    <button
                      onClick={() => setActiveLesson(null)}
                      className="shrink-0 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white transition"
                      title="Close player"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <LessonVideoPlayer
                    lesson={activeLesson}
                    courseId={selectedCourse._id}
                    onComplete={handleVideoComplete}
                  />
                </motion.div>
              )}

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
                                    <button
                                      onClick={() => setActiveLesson(activeLesson?._id === lesson._id ? null : lesson)}
                                      className={`flex items-center gap-1 text-xs transition ${activeLesson?._id === lesson._id ? "text-sky-300 font-semibold" : "text-sky-400 hover:text-sky-300"}`}
                                    >
                                      <PlayCircle size={12} /> {activeLesson?._id === lesson._id ? "Now Playing" : "Watch Video"}
                                    </button>
                                  )}
                                  {(lesson.resources || []).map((r) => (
                                    <a key={r._id} href={r.url} target="_blank" rel="noreferrer"
                                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                                      <FileText size={12} /> {r.title}
                                    </a>
                                  ))}
                                  <button
                                    onClick={() => setAiLesson({ ...lesson, courseId: selectedCourse?._id })}
                                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition"
                                  >
                                    <Bot size={12} /> Ask AI
                                  </button>
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

      {/* Contextual AI Chat Modal */}
      <AnimatePresence>
        {aiLesson && (
          <LessonAIModal
            lesson={aiLesson}
            courseTitle={selectedCourse?.title || ""}
            onClose={() => setAiLesson(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentLessons;
