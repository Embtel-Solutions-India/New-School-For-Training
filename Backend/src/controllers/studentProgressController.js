import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getStudentProgress = asyncHandler(async (req, res) => {
  const { courseId, page = 1, limit = 30, sort = "progress" } = req.query;
  const filter = { teacher: req.user._id };
  if (courseId) filter.course = courseId;

  const sortMap = {
    progress: { progress: -1 },
    recent: { updatedAt: -1 },
    completed: { isCompleted: -1, progress: -1 },
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .sort(sortMap[sort] || sortMap.progress)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name avatar email")
      .populate("course", "title thumbnail"),
    Enrollment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    students: enrollments,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
  });
});

export const getProgressAnalytics = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const matchFilter = { teacher: req.user._id };
  if (courseId) matchFilter.course = new mongoose.Types.ObjectId(courseId);

  const [completionStats, progressBuckets, enrollmentTrend, topStudents] = await Promise.all([
    // Completion stats
    Enrollment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ["$isCompleted", 1, 0] } },
          avgProgress: { $avg: "$progress" },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        },
      },
    ]),

    // Progress distribution buckets
    Enrollment.aggregate([
      { $match: matchFilter },
      {
        $bucket: {
          groupBy: "$progress",
          boundaries: [0, 25, 50, 75, 100],
          default: "100",
          output: { count: { $sum: 1 } },
        },
      },
    ]),

    // Enrollment trend last 8 weeks
    Enrollment.aggregate([
      { $match: { ...matchFilter, createdAt: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $week: "$createdAt" },
          enrollments: { $sum: 1 },
          completions: { $sum: { $cond: ["$isCompleted", 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Top students by progress
    Enrollment.find(matchFilter)
      .sort({ progress: -1 })
      .limit(10)
      .populate("user", "name avatar email")
      .populate("course", "title"),
  ]);

  const bucketLabels = { 0: "0-25%", 25: "25-50%", 50: "50-75%", 75: "75-100%", "100": "100%" };
  const buckets = progressBuckets.map((b) => ({ range: bucketLabels[b._id] || b._id, count: b.count }));

  res.json({
    success: true,
    analytics: {
      total: completionStats[0]?.total || 0,
      completed: completionStats[0]?.completed || 0,
      completionRate: completionStats[0]?.total > 0
        ? parseFloat(((completionStats[0].completed / completionStats[0].total) * 100).toFixed(1))
        : 0,
      avgProgress: parseFloat((completionStats[0]?.avgProgress || 0).toFixed(1)),
      active: completionStats[0]?.active || 0,
      progressBuckets: buckets,
      enrollmentTrend,
      topStudents,
    },
  });
});

export const updateStudentProgress = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { progress } = req.body;
  if (progress === undefined) throw new ApiError(400, "Progress value required");

  const enrollment = await Enrollment.findOne({ _id: enrollmentId, teacher: req.user._id });
  if (!enrollment) throw new ApiError(404, "Enrollment not found");

  enrollment.progress = Math.min(100, Math.max(0, parseInt(progress)));
  if (enrollment.progress === 100 && !enrollment.isCompleted) {
    enrollment.isCompleted = true;
    enrollment.completedAt = new Date();
    enrollment.status = "completed";
  }
  await enrollment.save();
  res.json({ success: true, enrollment });
});
