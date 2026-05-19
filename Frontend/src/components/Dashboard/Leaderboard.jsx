import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@mui/material";
import { Award, BookOpen, CheckCircle2, Crown, Flame, Star, Trophy, Zap } from "lucide-react";
import toast from "react-hot-toast";
import studentApi from "../../services/studentApi";

const glass = "border border-white/10 bg-white/[0.07] shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl";

const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32"];

const Leaderboard = () => {
  const [board, setBoard] = useState([]);
  const [achievements, setAchievements] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentApi.getLeaderboard(),
      studentApi.getMyAchievements(),
    ]).then(([lb, ach]) => {
      setBoard(lb.data.leaderboard || []);
      setMyRank(lb.data.myRank);
      setAchievements(ach.data.achievements);
    }).catch(() => toast.error("Failed to load leaderboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[32px] ${glass} p-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">Leaderboard</h1>
            <p className="mt-2 text-white/60">Compete with fellow learners and earn achievements</p>
          </div>
          {myRank && (
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-yellow-300">#{myRank}</p>
              <p className="text-xs text-white/50">Your Rank</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* My Achievements */}
      {!loading && achievements && (
        <div className={`rounded-[24px] ${glass} p-6`}>
          <p className="mb-4 font-semibold">My Achievements</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "XP Points", value: achievements.xp, icon: Zap, color: "#fde68a" },
              { label: "Completed", value: achievements.completedCourses, icon: CheckCircle2, color: "#86efac" },
              { label: "Certificates", value: achievements.certificates, icon: Award, color: "#fbbf24" },
              { label: "Quiz Passed", value: achievements.quizPassed, icon: Star, color: "#a78bfa" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                  <Icon size={20} style={{ color: s.color }} className="mx-auto" />
                  <p className="mt-2 text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-white/50">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Badges */}
          {achievements.badges?.length > 0 && (
            <div className="mt-4">
              <p className="mb-3 text-sm font-semibold text-white/60">Badges Earned</p>
              <div className="flex flex-wrap gap-3">
                {achievements.badges.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <span className="text-xl">{b.icon}</span>
                    <div>
                      <p className="text-xs font-bold">{b.label}</p>
                      <p className="text-xs text-white/40">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className={`rounded-[24px] ${glass} p-6`}>
        <p className="mb-4 font-semibold">Top Learners</p>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />)}
          </div>
        ) : board.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <Trophy size={36} className="mx-auto mb-2 opacity-30" />
            <p>No learners yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {board.map((student, i) => (
              <motion.div key={student._id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${i < 3 ? "border-yellow-400/20 bg-yellow-400/5" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {i < 3
                    ? <Crown size={20} style={{ color: RANK_COLORS[i] }} />
                    : <span className="text-sm font-bold text-white/40">#{student.rank}</span>}
                </div>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold">
                  {student.avatar
                    ? <img src={student.avatar} alt="" className="h-full w-full rounded-xl object-cover" />
                    : student.name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{student.name}</p>
                  <p className="text-xs text-white/40">{student.completedCourses} courses completed</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-yellow-300">{student.xp} XP</p>
                  <p className="text-xs text-white/35">{student.coursesEnrolled} enrolled</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
