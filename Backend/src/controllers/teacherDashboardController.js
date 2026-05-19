import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import LiveClass from "../models/LiveClass.js";
import Attendance from "../models/Attendance.js";
import Review from "../models/Review.js";
import Discussion from "../models/Discussion.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getTeacherOverview = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  const [
    courses,
    enrollmentStats,
    liveStats,
    revenueStats,
    recentEnrollments,
    reviewStats,
    pendingAssignments,
    activeStudents7d,
  ] = await Promise.all([
    // All teacher courses
    Course.find({ teacher: teacherId }),

    // Enrollment aggregation
    Enrollment.aggregate([
      { $match: { teacher: teacherId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$isCompleted", 1, 0] } },
          revenue: { $sum: { $cond: [{ $eq: ["$payment.status", "completed"] }, "$payment.amount", 0] } },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        },
      },
    ]),

    // Live class stats
    LiveClass.aggregate([
      { $match: { teacher: teacherId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upcoming: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } },
          live: { $sum: { $cond: [{ $eq: ["$status", "live"] }, 1, 0] } },
          ended: { $sum: { $cond: [{ $eq: ["$status", "ended"] }, 1, 0] } },
        },
      },
    ]),

    // Revenue by month (last 6 months)
    Enrollment.aggregate([
      {
        $match: {
          teacher: teacherId,
          "payment.status": "completed",
          createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$payment.amount" },
          enrollments: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Recent enrollments
    Enrollment.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("user", "name avatar email")
      .populate("course", "title thumbnail"),

    // Review stats
    Review.aggregate([
      { $match: { teacher: teacherId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          total: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        },
      },
    ]),

    // Pending assignment submissions count across all courses
    Course.aggregate([
      { $match: { teacher: teacherId } },
      { $project: { pendingAssignments: { $size: { $ifNull: ["$curriculum.assignments", []] } } } },
      { $group: { _id: null, total: { $sum: "$pendingAssignments" } } },
    ]),

    // Active students in last 7 days
    Enrollment.distinct("user", {
      teacher: teacherId,
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueChart = revenueStats.map((r) => ({
    name: monthNames[r._id.month - 1],
    revenue: r.revenue,
    enrollments: r.enrollments,
  }));

  const totalLessons = courses.reduce((sum, c) => sum + (c.curriculum?.lessons?.length || 0), 0);
  const publishedCourses = courses.filter((c) => c.status === "published").length;

  res.json({
    success: true,
    overview: {
      totalCourses: courses.length,
      publishedCourses,
      draftCourses: courses.filter((c) => c.status === "draft").length,
      totalLessons,
      totalStudents: enrollmentStats[0]?.total || 0,
      activeStudents: enrollmentStats[0]?.active || 0,
      activeStudents7d: activeStudents7d.length,
      completedStudents: enrollmentStats[0]?.completed || 0,
      totalRevenue: enrollmentStats[0]?.revenue || 0,
      upcomingSessions: liveStats[0]?.upcoming || 0,
      liveSessions: liveStats[0]?.live || 0,
      totalSessions: liveStats[0]?.total || 0,
      pendingAssignments: pendingAssignments[0]?.total || 0,
      avgRating: reviewStats[0]?.avgRating ? parseFloat(reviewStats[0].avgRating.toFixed(1)) : 0,
      totalReviews: reviewStats[0]?.total || 0,
      revenueChart,
      recentEnrollments,
    },
  });
});
