import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgress, LinearProgress, Tooltip } from "@mui/material";
import { Award, BookOpen, CheckCircle2, Clock, FileText, Star, X, Zap } from "lucide-react";
import toast from "react-hot-toast";
import teacherApi from "../../services/teacherApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const ACTIVITY_ICONS = {
  lesson_complete: <BookOpen size={13} className="text-sky-400" />,
  quiz_attempt: <Star size={13} className="text-yellow-400" />,
  assignment_submit: <FileText size={13} className="text-purple-400" />,
  live_class: <CheckCircle2 size={13} className="text-emerald-400" />,
  course_complete: <Award size={13} className="text-yellow-400" />,
  certificate: <Award size={13} className="text-amber-400" />,
  profile_update: <Star size={13} className="text-white/40" />,
  avatar_generate: <Star size={13} className="text-purple-400" />,
};

const TeacherStudentModal = ({ studentId, onClose }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    teacherApi.getTeacherStudentProfile(studentId)
      .then(({ data }) => setStudent(data.student))
      .catch(() => { toast.error("Failed to load student profile"); onClose(); })
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
          className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] ${glass} p-6`}>

          <button onClick={onClose} className="absolute right-5 top-5 rounded-xl border border-white/10 bg-white/[0.05] p-1.5 text-white/50 hover:text-white transition">
            <X size={16} />
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <CircularProgress sx={{ color: "#38bdf8" }} />
            </div>
          ) : !student ? null : (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-4 pr-8">
                <div className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-white/10 grid place-items-center text-xl font-bold">
                  {student.avatar
                    ? <img src={student.avatar} alt="" className="h-full w-full object-cover" />
                    : student.name?.[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{student.name}</h2>
                  <p className="text-sm text-white/50">{student.email}</p>
                  {student.bio && <p className="mt-1 text-xs text-white/40 line-clamp-2">{student.bio}</p>}
                </div>
                {student.xp && (
                  <div className="ml-auto shrink-0 flex gap-2">
                    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-center">
                      <p className="text-base font-bold text-yellow-300">{student.xp.totalXP}</p>
                      <p className="text-[10px] text-white/40">XP</p>
                    </div>
                    <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-center">
                      <p className="text-base font-bold text-purple-300">Lv {student.xp.level}</p>
                      <p className="text-[10px] text-white/40">Level</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills / Interests / Goals */}
              {(student.skills?.length > 0 || student.interests?.length > 0 || student.learningGoals?.length > 0) && (
                <div className="space-y-3">
                  {student.skills?.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-white/40">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {student.skills.map((s) => (
                          <span key={s} className="rounded-lg border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-xs text-sky-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {student.interests?.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-white/40">Interests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {student.interests.map((s) => (
                          <span key={s} className="rounded-lg border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-xs text-purple-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {student.learningGoals?.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-white/40">Learning Goals</p>
                      <ul className="space-y-1">
                        {student.learningGoals.map((g, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Course Enrollments */}
              {student.enrollments?.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">Course Progress</p>
                  <div className="space-y-2">
                    {student.enrollments.map((e) => (
                      <div key={e._id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium truncate">{e.course?.title || "Course"}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${e.isCompleted ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"}`}>
                            {e.isCompleted ? "Completed" : `${e.progress}%`}
                          </span>
                        </div>
                        <LinearProgress variant="determinate" value={e.progress || 0}
                          sx={{ mt: 1.5, height: 4, borderRadius: 2, bgcolor: "rgba(255,255,255,0.08)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#22c55e,#38bdf8)", borderRadius: 2 } }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges */}
              {student.xp?.badges?.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {student.xp.badges.map((key) => (
                      <span key={key} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold">{key}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Quizzes */}
              {student.recentQuizzes?.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">Recent Quizzes</p>
                  <div className="space-y-2">
                    {student.recentQuizzes.map((q) => (
                      <div key={q._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <Star size={14} className="shrink-0 text-yellow-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/50">{new Date(q.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold" style={{ color: q.passed ? "#22c55e" : "#f87171" }}>{q.percentage}%</p>
                          <p className="text-xs text-white/30">{q.passed ? "Passed" : "Failed"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Submissions */}
              {student.recentSubmissions?.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">Recent Submissions</p>
                  <div className="space-y-2">
                    {student.recentSubmissions.map((s) => (
                      <div key={s._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <FileText size={14} className="shrink-0 text-purple-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{s.assignmentTitle || "Assignment"}</p>
                          <p className="text-xs text-white/40">{new Date(s.submittedAt || s.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          s.status === "graded" ? "bg-emerald-500/15 text-emerald-300"
                            : s.status === "resubmit" ? "bg-red-500/15 text-red-300"
                            : "bg-white/10 text-white/50"
                        }`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              {student.recentActivity?.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">Recent Activity</p>
                  <div className="space-y-2">
                    {student.recentActivity.map((a) => (
                      <div key={a._id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                        <span className="shrink-0">{ACTIVITY_ICONS[a.type] || <Clock size={13} className="text-white/30" />}</span>
                        <p className="flex-1 text-xs text-white/70">{a.description}</p>
                        <p className="shrink-0 text-xs text-white/30">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TeacherStudentModal;
