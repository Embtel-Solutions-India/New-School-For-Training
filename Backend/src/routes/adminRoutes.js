import express from "express";
import {
  getAdminDashboardSummary,
  getRevenueAnalytics,
  getSalesAnalytics,
  getUserManagement,
  suspendUser,
  activateUser,
  banUser,
  changeUserRole,
  deleteUser,
  updateUser,
  resetUserPassword,
  getTeachersList,
} from "../controllers/adminController.js";
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  suspendTeacher,
  activateTeacher,
  resetTeacherPassword,
  getTeacherAnalytics,
} from "../controllers/teacherController.js";
import {
  getPendingCourses,
  approveCourse,
  rejectCourse,
  featureCourse,
  requestCourseChanges,
} from "../controllers/courseApprovalController.js";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
} from "../controllers/couponController.js";
import {
  getNotifications,
  sendNotification,
  deleteNotification,
  toggleNotification,
} from "../controllers/notificationController.js";
import {
  getCmsContent,
  createCmsItem,
  updateCmsItem,
  deleteCmsItem,
} from "../controllers/cmsController.js";
import {
  getSettings,
  updateGeneralSettings,
  updatePaymentSettings,
  updateSecuritySettings,
  updateMaintenanceMode,
} from "../controllers/siteSettingsController.js";
import {
  getAuditLogs,
  getAuditLogStats,
} from "../controllers/auditLogController.js";
import { getPlatformAnalytics } from "../controllers/platformAnalyticsController.js";
import {
  getPendingBlogs, getAllBlogsAdmin, approveBlog, rejectBlog, adminDeleteBlog,
} from "../controllers/blogController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/dashboard/summary", getAdminDashboardSummary);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics/revenue", getRevenueAnalytics);
router.get("/analytics/sales", getSalesAnalytics);
router.get("/analytics/platform", getPlatformAnalytics);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get("/users", getUserManagement);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);
router.post("/users/:userId/suspend", suspendUser);
router.post("/users/:userId/activate", activateUser);
router.post("/users/:userId/ban", banUser);
router.patch("/users/:userId/role", changeUserRole);
router.post("/users/:userId/reset-password", resetUserPassword);

// ── Teachers ──────────────────────────────────────────────────────────────────
router.get("/teachers", getTeachersList);
router.post("/teachers", createTeacher);
router.put("/teachers/:teacherId", updateTeacher);
router.delete("/teachers/:teacherId", deleteTeacher);
router.post("/teachers/:teacherId/suspend", suspendTeacher);
router.post("/teachers/:teacherId/activate", activateTeacher);
router.post("/teachers/:teacherId/reset-password", resetTeacherPassword);
router.get("/teachers/:teacherId/analytics", getTeacherAnalytics);

// ── Course Approval ───────────────────────────────────────────────────────────
router.get("/courses", getPendingCourses);
router.post("/courses/:courseId/approve", approveCourse);
router.post("/courses/:courseId/reject", rejectCourse);
router.post("/courses/:courseId/feature", featureCourse);
router.post("/courses/:courseId/request-changes", requestCourseChanges);

// ── Coupons ───────────────────────────────────────────────────────────────────
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:couponId", updateCoupon);
router.delete("/coupons/:couponId", deleteCoupon);
router.post("/coupons/:couponId/toggle", toggleCoupon);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get("/notifications", getNotifications);
router.post("/notifications", sendNotification);
router.delete("/notifications/:notificationId", deleteNotification);
router.post("/notifications/:notificationId/toggle", toggleNotification);

// ── CMS ───────────────────────────────────────────────────────────────────────
router.get("/cms", getCmsContent);
router.post("/cms", createCmsItem);
router.put("/cms/:itemId", updateCmsItem);
router.delete("/cms/:itemId", deleteCmsItem);

// ── Settings ──────────────────────────────────────────────────────────────────
router.get("/settings", getSettings);
router.put("/settings/general", updateGeneralSettings);
router.put("/settings/payment", updatePaymentSettings);
router.put("/settings/security", updateSecuritySettings);
router.put("/settings/maintenance", updateMaintenanceMode);

// ── Blog Moderation ───────────────────────────────────────────────────────────
router.get("/blogs", getAllBlogsAdmin);
router.get("/blogs/pending", getPendingBlogs);
router.post("/blogs/:id/approve", approveBlog);
router.post("/blogs/:id/reject", rejectBlog);
router.delete("/blogs/:id", adminDeleteBlog);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get("/audit-logs", getAuditLogs);
router.get("/audit-logs/stats", getAuditLogStats);

export default router;
