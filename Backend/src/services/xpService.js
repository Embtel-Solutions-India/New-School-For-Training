import UserXP from "../models/UserXP.js";
import LessonCompletion from "../models/LessonCompletion.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Submission from "../models/Submission.js";
import Attendance from "../models/Attendance.js";
import Certificate from "../models/Certificate.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import { emitToUsers } from "./socketService.js";

// ── Level thresholds ─────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

export const getLevelFromXP = (xp) => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
};

export const getNextLevelXP = (level) =>
  LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

// ── Badge definitions ────────────────────────────────────────────────────────
export const BADGE_DEFS = [
  { key: "first_lesson",     label: "First Step",        icon: "🎯", desc: "Completed your first lesson" },
  { key: "ten_lessons",      label: "Momentum",           icon: "⚡", desc: "Completed 10 lessons" },
  { key: "fifty_lessons",    label: "Scholar",            icon: "📚", desc: "Completed 50 lessons" },
  { key: "first_course",     label: "Graduate",           icon: "🎓", desc: "Completed your first course" },
  { key: "three_courses",    label: "Achiever",           icon: "🏆", desc: "Completed 3 courses" },
  { key: "first_cert",       label: "Certified",          icon: "📜", desc: "Earned first certificate" },
  { key: "quiz_taker",       label: "Quiz Taker",         icon: "✏️", desc: "Completed your first quiz" },
  { key: "quiz_master",      label: "Quiz Master",        icon: "🧠", desc: "Passed 5 quizzes" },
  { key: "assignment_hero",  label: "Assignment Hero",    icon: "📝", desc: "Submitted 5 assignments" },
  { key: "live_champion",    label: "Live Champion",      icon: "📡", desc: "Attended 3 live classes" },
  { key: "streak_7",         label: "Week Warrior",       icon: "🔥", desc: "7-day learning streak" },
  { key: "xp_1000",          label: "1000 XP Club",       icon: "⭐", desc: "Earned 1000 XP" },
  { key: "level_5",          label: "Top Performer",      icon: "👑", desc: "Reached level 5" },
];

// ── Badge check by event type ────────────────────────────────────────────────
const checkNewBadges = async (userId, userXP, eventType) => {
  const current = new Set(userXP.unlockedBadges || []);
  const toUnlock = [];

  const earn = (key) => {
    if (!current.has(key)) { toUnlock.push(key); current.add(key); }
  };

  // Always check XP/level thresholds
  if (userXP.totalXP >= 1000) earn("xp_1000");
  if (userXP.level >= 5) earn("level_5");
  if (userXP.streak >= 7) earn("streak_7");

  if (eventType === "lesson" || eventType === "course") {
    const [lessonCount, completedCourses] = await Promise.all([
      LessonCompletion.countDocuments({ student: userId }),
      Enrollment.countDocuments({ user: userId, isCompleted: true }),
    ]);
    if (lessonCount >= 1)  earn("first_lesson");
    if (lessonCount >= 10) earn("ten_lessons");
    if (lessonCount >= 50) earn("fifty_lessons");
    if (completedCourses >= 1) earn("first_course");
    if (completedCourses >= 3) earn("three_courses");
  }

  if (eventType === "course") {
    const certs = await Certificate.countDocuments({ student: userId });
    if (certs >= 1) earn("first_cert");
  }

  if (eventType === "quiz") {
    const [total, passed] = await Promise.all([
      QuizAttempt.countDocuments({ student: userId }),
      QuizAttempt.countDocuments({ student: userId, passed: true }),
    ]);
    if (total >= 1)  earn("quiz_taker");
    if (passed >= 5) earn("quiz_master");
  }

  if (eventType === "assignment") {
    const count = await Submission.countDocuments({ student: userId });
    if (count >= 5) earn("assignment_hero");
  }

  if (eventType === "live") {
    const count = await Attendance.countDocuments({ student: userId, status: "present" });
    if (count >= 3) earn("live_champion");
  }

  return toUnlock;
};

// ── Streak update ────────────────────────────────────────────────────────────
const updateStreak = (userXP) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const lastActive = userXP.lastActiveDate ? new Date(userXP.lastActiveDate) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);
  const lastMs = lastActive ? lastActive.getTime() : 0;

  if (lastMs === todayMs) return; // Already updated today

  const yesterdayMs = todayMs - 86400000;
  if (!lastActive) {
    userXP.streak = 1;
  } else if (lastMs === yesterdayMs) {
    userXP.streak = (userXP.streak || 0) + 1;
  } else {
    userXP.streak = 1; // Gap — reset
  }
  userXP.lastActiveDate = today;
};

// ── Core XP award function ───────────────────────────────────────────────────
// eventKey: unique string to prevent duplicate XP (e.g., "lesson:abc123:course456")
// eventType: "lesson" | "quiz" | "assignment" | "live" | "course" | "streak"
export const awardXP = async (userId, amount, eventKey, eventType = "general") => {
  try {
    let userXP = await UserXP.findOne({ user: userId });
    if (!userXP) {
      userXP = new UserXP({
        user: userId,
        totalXP: 0,
        level: 1,
        streak: 0,
        unlockedBadges: [],
        eventLog: [],
      });
    }

    // Dedup: skip if this exact event was already awarded
    if (eventKey && userXP.eventLog.some((e) => e.key === eventKey)) return null;

    // Update streak
    updateStreak(userXP);

    // Add XP
    const prevLevel = userXP.level;
    userXP.totalXP += amount;
    userXP.level = getLevelFromXP(userXP.totalXP);

    // Log event for dedup
    if (eventKey) {
      userXP.eventLog.push({ key: eventKey, awardedAt: new Date() });
      // Keep log from growing unbounded
      if (userXP.eventLog.length > 1000) {
        userXP.eventLog = userXP.eventLog.slice(-800);
      }
    }

    // Check for newly unlocked badges
    const newBadgeKeys = await checkNewBadges(userId, userXP, eventType);
    userXP.unlockedBadges.push(...newBadgeKeys);

    await userXP.save();

    const leveledUp = userXP.level > prevLevel;

    // ── Emit socket events ──────────────────────────────────────────────────
    emitToUsers([userId], "xp-updated", {
      totalXP: userXP.totalXP,
      level: userXP.level,
      leveledUp,
    });

    // ── Notifications (fire-and-forget) ─────────────────────────────────────
    if (leveledUp) {
      Notification.create({
        title: "📈 Level Up!",
        message: `You've reached Level ${userXP.level}! Keep up the great work!`,
        type: "success",
        targetAudience: "specific",
        targetUsers: [userId],
        sentBy: userId,
        isActive: true,
      }).catch(() => {});
    }

    for (const key of newBadgeKeys) {
      const badge = BADGE_DEFS.find((b) => b.key === key);
      if (!badge) continue;
      Notification.create({
        title: `🏆 Badge Unlocked: ${badge.label}`,
        message: `${badge.icon} ${badge.desc}`,
        type: "success",
        targetAudience: "specific",
        targetUsers: [userId],
        sentBy: userId,
        isActive: true,
      }).catch(() => {});
      emitToUsers([userId], "badge-unlocked", { badge });
    }

    return { totalXP: userXP.totalXP, level: userXP.level, leveledUp, newBadges: newBadgeKeys };
  } catch (err) {
    console.error("[xpService] awardXP error:", err.message);
    return null;
  }
};

// ── Get or create UserXP record ──────────────────────────────────────────────
export const getUserXP = async (userId) => {
  let record = await UserXP.findOne({ user: userId }).lean();
  if (!record) return { user: userId, totalXP: 0, level: 1, streak: 0, unlockedBadges: [] };
  return record;
};
