import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Teacher from "../models/Teacher.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import AuditLog from "../models/AuditLog.js";
import Blog from "../models/Blog.js";
import LiveClass from "../models/LiveClass.js";
import Subscription from "../models/Subscription.js";

const logAction = async (action, req, resource = "", resourceId = null, details = {}) => {
  try {
    await AuditLog.create({
      action,
      actor: {
        userId: req.user?._id,
        name: req.user?.name || "",
        email: req.user?.email || "",
        role: req.user?.role || "admin",
      },
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.headers?.["x-forwarded-for"] || "unknown",
      status: "success",
    });
  } catch (_) {
    // audit log failure must not break the actual operation
  }
};

export const getAdminDashboardSummary = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalEnrollments,
      recentEnrollmentsRaw,
      revenueSummary,
      publishedCourses,
      pendingApprovals,
      newUsersThisWeek,
      publishedBlogs,
      liveClassesTotal,
      activeSubscriptions,
      monthlyRevenueSummary,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      Course.countDocuments(),
      User.countDocuments(),
      User.countDocuments({
        accountStatus: "active",
        lastLogin: { $gte: sevenDaysAgo },
      }),
      User.countDocuments({ accountStatus: "suspended" }),
      Enrollment.countDocuments({ "payment.status": "completed" }),
      Enrollment.find({ "payment.status": "completed" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email avatar")
        .populate("course", "title"),
      Enrollment.aggregate([
        { $match: { "payment.status": "completed" } },
        { $group: { _id: null, total: { $sum: "$payment.amount" } } },
      ]),
      Course.countDocuments({ status: "published" }),
      Course.countDocuments({ status: "pending_review" }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Blog.countDocuments({ status: "published" }),
      LiveClass.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Enrollment.aggregate([
        { $match: { "payment.status": "completed", createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$payment.amount" } } },
      ]),
    ]);

    const studentsEnrolled = await Enrollment.distinct("user", {
      "payment.status": "completed",
    }).then((ids) => ids.length);

    const totalRevenue = revenueSummary[0]?.total || 0;

    const monthlyRevenue = monthlyRevenueSummary[0]?.total || 0;

    const summary = {
      totalStudents,
      studentsEnrolled,
      totalTeachers,
      totalCourses,
      publishedCourses,
      pendingApprovals,
      totalRevenue,
      monthlyRevenue,
      activeUsers,
      suspendedUsers,
      totalUsers,
      totalCourseSales: totalEnrollments,
      newUsersThisWeek,
      publishedBlogs,
      liveClassesTotal,
      activeSubscriptions,
      recentEnrollments: recentEnrollmentsRaw,
      workspace: "Platform administration control",
    };

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();

    const [monthlyRevenue, totalRevenueSummary, topCourses, dailyRevenue] = await Promise.all([
      Enrollment.aggregate([
        {
          $match: {
            "payment.status": "completed",
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$payment.amount" },
            sales: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Enrollment.aggregate([
        { $match: { "payment.status": "completed" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$payment.amount" },
            totalSales: { $sum: 1 },
          },
        },
      ]),

      Enrollment.aggregate([
        { $match: { "payment.status": "completed" } },
        {
          $group: {
            _id: "$course",
            revenue: { $sum: "$payment.amount" },
            sales: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
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
            revenue: 1,
            sales: 1,
          },
        },
      ]),

      Enrollment.aggregate([
        {
          $match: {
            "payment.status": "completed",
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$payment.amount" },
            sales: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1, "_id.day": 1 } },
      ]),
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const chartData = monthlyRevenue.map((item) => ({
      name: monthNames[item._id.month - 1],
      revenue: item.revenue,
      sales: item.sales,
    }));

    const totalRevenue = totalRevenueSummary[0]?.totalRevenue || 0;
    const totalSales = totalRevenueSummary[0]?.totalSales || 0;

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1, 1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const lastMonthRevenue = monthlyRevenue.findLast?.(
      (m) => m._id.month === lastMonthStart.getMonth() + 1
    )?.revenue || 0;

    const thisMonthRevenue = monthlyRevenue.findLast?.(
      (m) => m._id.month === new Date().getMonth() + 1
    )?.revenue || 0;

    const revenueGrowth =
      lastMonthRevenue > 0
        ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
        : 0;

    res.json({
      success: true,
      analytics: {
        totalRevenue,
        totalSales,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: parseFloat(revenueGrowth),
        chartData,
        dailyRevenue,
        topCourses,
        period: { startDate, endDate },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesAnalytics = async (req, res) => {
  try {
    const [weeklySales, courseStatusBreakdown, enrollmentsByRole] = await Promise.all([
      Enrollment.aggregate([
        {
          $match: {
            "payment.status": "completed",
            createdAt: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $week: "$createdAt" },
            sales: { $sum: "$payment.amount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 4 },
      ]),

      Course.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Enrollment.aggregate([
        { $match: { "payment.status": "completed" } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$payment.amount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
    const chartData = weekLabels.map((label, index) => {
      const w = weeklySales[index];
      return { name: label, sales: w?.sales || 0, orders: w?.orders || 0 };
    });

    const totalSales = enrollmentsByRole[0]?.totalSales || 0;
    const totalOrders = enrollmentsByRole[0]?.totalOrders || 0;

    res.json({
      success: true,
      analytics: {
        totalSales,
        totalOrders,
        chartData,
        courseStatusBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (status) query.accountStatus = status;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: "suspended", isSuspended: true },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await logAction("USER_SUSPENDED", req, "user", userId, { targetEmail: user.email, reason });

    res.json({ success: true, message: "User suspended successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: "active", isSuspended: false },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await logAction("USER_ACTIVATED", req, "user", userId, { targetEmail: user.email });

    res.json({ success: true, message: "User activated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: "disabled", isSuspended: true },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await logAction("USER_BANNED", req, "user", userId, { targetEmail: user.email, reason });

    res.json({ success: true, message: "User banned successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["student", "teacher", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await logAction("USER_ROLE_CHANGED", req, "user", userId, {
      targetEmail: user.email,
      newRole: role,
    });

    res.json({ success: true, message: "User role updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user?._id?.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await logAction("USER_DELETED", req, "user", userId, { targetEmail: user.email, targetRole: user.role });
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;
    const update = {};
    if (name?.trim()) update.name = name.trim();
    if (email?.trim()) update.email = email.trim().toLowerCase();

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select("-password -refreshToken");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await logAction("USER_UPDATED", req, "user", userId, { fields: Object.keys(update) });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(userId, { password: hashed }, { new: true }).select("-password -refreshToken");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await logAction("USER_PASSWORD_RESET", req, "user", userId, { targetEmail: user.email });
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeachersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const query = { role: "teacher" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { teacherId: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.accountStatus = status;

    const [teachers, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    const teacherIds = teachers.map((t) => t._id);
    const profiles = await Teacher.find({ userId: { $in: teacherIds } });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId.toString(), p]));

    const enriched = teachers.map((t) => ({
      ...t.toJSON(),
      profile: profileMap[t._id.toString()] || null,
    }));

    res.json({
      success: true,
      teachers: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
