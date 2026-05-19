import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getContentAnalytics = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;

  const [courses, enrollmentStats, recentEnrollments] = await Promise.all([
    Course.find({ teacher: teacherId }).select("title thumbnail status curriculum enrollmentCount createdAt"),
    Enrollment.aggregate([
      { $match: { teacher: teacherId } },
      {
        $group: {
          _id: "$course",
          totalStudents: { $sum: 1 },
          avgProgress: { $avg: "$progress" },
          completions: { $sum: { $cond: ["$isCompleted", 1, 0] } },
          totalRevenue: { $sum: { $cond: [{ $eq: ["$payment.status", "completed"] }, "$payment.amount", 0] } },
        },
      },
    ]),
    Enrollment.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("course createdAt progress isCompleted"),
  ]);

  // Build map for fast lookup
  const statsMap = {};
  enrollmentStats.forEach((s) => { statsMap[s._id.toString()] = s; });

  // Build per-course analytics
  const courseAnalytics = courses.map((c) => {
    const stats = statsMap[c._id.toString()] || {};
    const lessonCount = c.curriculum?.lessons?.length || 0;
    const quizCount = c.curriculum?.quizzes?.length || 0;

    return {
      _id: c._id,
      title: c.title,
      thumbnail: c.thumbnail,
      status: c.status,
      lessonCount,
      quizCount,
      enrollmentCount: c.enrollmentCount || stats.totalStudents || 0,
      totalStudents: stats.totalStudents || 0,
      avgProgress: parseFloat((stats.avgProgress || 0).toFixed(1)),
      completions: stats.completions || 0,
      completionRate: stats.totalStudents > 0
        ? parseFloat(((stats.completions / stats.totalStudents) * 100).toFixed(1))
        : 0,
      totalRevenue: stats.totalRevenue || 0,
      createdAt: c.createdAt,
    };
  });

  // Sort by enrollment count descending
  const sortedByEnrollment = [...courseAnalytics].sort((a, b) => b.totalStudents - a.totalStudents);

  // Compute lesson-level analytics (simulated from course data)
  const lessonAnalytics = [];
  courses.forEach((c) => {
    const courseStats = statsMap[c._id.toString()] || {};
    (c.curriculum?.lessons || []).forEach((l, idx) => {
      lessonAnalytics.push({
        courseId: c._id,
        courseTitle: c.title,
        lessonId: l._id,
        lessonTitle: l.title,
        order: l.order || idx,
        estimatedViews: Math.max(0, (courseStats.totalStudents || 0) - idx * Math.ceil((courseStats.totalStudents || 0) * 0.08)),
        hasVideo: !!l.videoUrl,
      });
    });
  });

  // Aggregate engagement by week
  const weeklyMap = {};
  recentEnrollments.forEach((e) => {
    const week = new Date(e.createdAt);
    week.setDate(week.getDate() - week.getDay());
    const key = week.toISOString().split("T")[0];
    if (!weeklyMap[key]) weeklyMap[key] = { week: key, enrollments: 0, completions: 0 };
    weeklyMap[key].enrollments++;
    if (e.isCompleted) weeklyMap[key].completions++;
  });
  const weeklyTrend = Object.values(weeklyMap).sort((a, b) => a.week.localeCompare(b.week)).slice(-8);

  res.json({
    success: true,
    analytics: {
      courses: courseAnalytics,
      topCourses: sortedByEnrollment.slice(0, 5),
      lessonAnalytics: lessonAnalytics.sort((a, b) => b.estimatedViews - a.estimatedViews).slice(0, 20),
      weeklyTrend,
      summary: {
        totalCourses: courses.length,
        publishedCourses: courses.filter((c) => c.status === "published").length,
        totalLessons: courses.reduce((s, c) => s + (c.curriculum?.lessons?.length || 0), 0),
        totalEnrollments: enrollmentStats.reduce((s, e) => s + e.totalStudents, 0),
      },
    },
  });
});
