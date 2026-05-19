import { normalizeRole } from "../utils/roles.js";
import asyncHandler from "../utils/asyncHandler.js";

const permissions = {
  student: [
    "courses:read",
    "learning:track",
    "certificates:download",
    "billing:read",
    "profile:update",
  ],
  teacher: [
    "courses:read",
    "courses:create",
    "courses:update",
    "courses:delete",
    "lessons:upload",
    "lessons:manage",
    "quizzes:manage",
    "assignments:manage",
    "students:read",
    "earnings:read",
    "messages:send",
  ],
  admin: [
    "analytics:read",
    "users:manage",
    "roles:update",
    "courses:moderate",
    "cms:manage",
    "reports:moderate",
    "teachers:manage",
    "payments:manage",
    "pricing:manage",
    "subscriptions:manage",
  ],
};

const roleSummaries = {
  student: {
    workspace: "Student learning workspace",
    metrics: {
      learningProgress: 78,
      activeCourses: 6,
      completedCourses: 18,
      certificatesEarned: 14,
      studyStreak: 21,
      xp: 12840,
    },
    modules: ["overview", "courses", "learning", "certificates", "profile", "billing"],
  },
  teacher: {
    workspace: "Teacher course operations workspace",
    metrics: {
      monthlyRevenue: 24800,
      enrolledStudents: 3284,
      watchTimeHours: 9700,
      averageRating: 4.8,
      pendingMessages: 36,
    },
    modules: ["overview", "courses", "students", "earnings", "messages"],
  },
  admin: {
    workspace: "Platform administration workspace",
    metrics: {
      totalUsers: 42600,
      activeUsers: 18400,
      revenue: 128000,
      courseCount: 642,
      reportsOpen: 19,
    },
    modules: ["overview", "users", "moderation", "cms", "reports"],
  },
};

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const role = normalizeRole(req.user.role);
  const summary = roleSummaries[role] || roleSummaries.student;

  res.status(200).json({
    success: true,
    role,
    user: { ...req.user.toJSON(), role },
    permissions: permissions[role] || permissions.student,
    summary,
    notifications: [
      {
        id: "live-activity",
        type: "activity",
        title: "Live activity feed updated",
        unread: true,
      },
      {
        id: "ai-assistant",
        type: "assistant",
        title: "AI assistant placeholder is ready",
        unread: false,
      },
    ],
  });
});

export const getDashboardPermissions = asyncHandler(async (req, res) => {
  const role = normalizeRole(req.user.role);

  res.status(200).json({
    success: true,
    role,
    permissions: permissions[role] || permissions.student,
  });
});
