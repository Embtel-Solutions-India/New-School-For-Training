import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

export const getPlatformAnalytics = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const [
      userGrowth,
      enrollmentGrowth,
      courseStatusBreakdown,
      roleBreakdown,
      activeUserCount,
      retentionData,
      topCoursesByEnrollment,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            students: { $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] } },
            teachers: { $sum: { $cond: [{ $eq: ["$role", "teacher"] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Enrollment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            enrollments: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Course.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),

      User.countDocuments({
        accountStatus: "active",
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),

      Enrollment.aggregate([
        { $match: { "payment.status": "completed" } },
        {
          $group: {
            _id: null,
            totalEnrollments: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          },
        },
      ]),

      Enrollment.aggregate([
        { $match: { "payment.status": "completed" } },
        { $group: { _id: "$course", enrollments: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        { $unwind: { path: "$courseInfo", preserveNullAndEmpty: false } },
        {
          $project: {
            title: "$courseInfo.title",
            category: "$courseInfo.category",
            enrollments: 1,
          },
        },
      ]),
    ]);

    const userGrowthChart = userGrowth.map((item) => ({
      name: monthNames[item._id.month - 1],
      students: item.students,
      teachers: item.teachers,
      total: item.total,
    }));

    const enrollmentChart = enrollmentGrowth.map((item) => ({
      name: monthNames[item._id.month - 1],
      enrollments: item.enrollments,
      completed: item.completed,
    }));

    const retentionRate = retentionData[0]
      ? ((retentionData[0].completed / retentionData[0].totalEnrollments) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      analytics: {
        userGrowthChart,
        enrollmentChart,
        courseStatusBreakdown,
        roleBreakdown,
        activeUserCount,
        retentionRate: parseFloat(retentionRate),
        topCoursesByEnrollment,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
