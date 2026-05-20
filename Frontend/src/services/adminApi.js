import api from "./api.js";

const adminApi = {
  // ── Dashboard ────────────────────────────────────────────────────────────────
  getDashboardSummary: () => api.get("/admin/dashboard/summary"),

  // ── Analytics ────────────────────────────────────────────────────────────────
  getRevenueAnalytics: (params) => api.get("/admin/analytics/revenue", { params }),
  getSalesAnalytics: (params) => api.get("/admin/analytics/sales", { params }),
  getPlatformAnalytics: (params) => api.get("/admin/analytics/platform", { params }),

  // ── Users ─────────────────────────────────────────────────────────────────────
  getUsers: (page = 1, limit = 10, search = "", role = "", status = "") =>
    api.get("/admin/users", { params: { page, limit, search, role, status } }),
  updateUser: (userId, data) => api.patch(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  suspendUser: (userId, reason = "") => api.post(`/admin/users/${userId}/suspend`, { reason }),
  activateUser: (userId) => api.post(`/admin/users/${userId}/activate`),
  banUser: (userId, reason = "") => api.post(`/admin/users/${userId}/ban`, { reason }),
  changeUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  resetUserPassword: (userId, newPassword) => api.post(`/admin/users/${userId}/reset-password`, { newPassword }),

  // ── Teachers ──────────────────────────────────────────────────────────────────
  getTeachers: (page = 1, limit = 10, search = "", status = "") =>
    api.get("/admin/teachers", { params: { page, limit, search, status } }),
  createTeacher: (data) => api.post("/admin/teachers", data),
  updateTeacher: (teacherId, data) => api.put(`/admin/teachers/${teacherId}`, data),
  deleteTeacher: (teacherId) => api.delete(`/admin/teachers/${teacherId}`),
  suspendTeacher: (teacherId) => api.post(`/admin/teachers/${teacherId}/suspend`),
  activateTeacher: (teacherId) => api.post(`/admin/teachers/${teacherId}/activate`),
  resetTeacherPassword: (teacherId, newPassword) =>
    api.post(`/admin/teachers/${teacherId}/reset-password`, { newPassword }),
  getTeacherAnalytics: (teacherId) => api.get(`/admin/teachers/${teacherId}/analytics`),

  // ── Course Approval ───────────────────────────────────────────────────────────
  getCourses: (params) => api.get("/admin/courses", { params }),
  approveCourse: (courseId, note = "") => api.post(`/admin/courses/${courseId}/approve`, { note }),
  rejectCourse: (courseId, reason) => api.post(`/admin/courses/${courseId}/reject`, { reason }),
  featureCourse: (courseId) => api.post(`/admin/courses/${courseId}/feature`),
  requestCourseChanges: (courseId, changes) => api.post(`/admin/courses/${courseId}/request-changes`, { changes }),

  // ── Coupons ───────────────────────────────────────────────────────────────────
  getCoupons: (params) => api.get("/admin/coupons", { params }),
  createCoupon: (data) => api.post("/admin/coupons", data),
  updateCoupon: (couponId, data) => api.put(`/admin/coupons/${couponId}`, data),
  deleteCoupon: (couponId) => api.delete(`/admin/coupons/${couponId}`),
  toggleCoupon: (couponId) => api.post(`/admin/coupons/${couponId}/toggle`),

  // ── Notifications ─────────────────────────────────────────────────────────────
  getNotifications: (params) => api.get("/admin/notifications", { params }),
  sendNotification: (data) => api.post("/admin/notifications", data),
  deleteNotification: (notificationId) => api.delete(`/admin/notifications/${notificationId}`),
  toggleNotification: (notificationId) => api.post(`/admin/notifications/${notificationId}/toggle`),

  // ── CMS ───────────────────────────────────────────────────────────────────────
  getCmsContent: (params) => api.get("/admin/cms", { params }),
  createCmsItem: (data) => api.post("/admin/cms", data),
  updateCmsItem: (itemId, data) => api.put(`/admin/cms/${itemId}`, data),
  deleteCmsItem: (itemId) => api.delete(`/admin/cms/${itemId}`),

  // ── Settings ──────────────────────────────────────────────────────────────────
  getSettings: () => api.get("/admin/settings"),
  updateGeneralSettings: (data) => api.put("/admin/settings/general", data),
  updatePaymentSettings: (data) => api.put("/admin/settings/payment", data),
  updateSecuritySettings: (data) => api.put("/admin/settings/security", data),
  updateMaintenanceMode: (data) => api.put("/admin/settings/maintenance", data),

  // ── Audit Logs ────────────────────────────────────────────────────────────────
  getAuditLogs: (params) => api.get("/admin/audit-logs", { params }),
  getAuditLogStats: () => api.get("/admin/audit-logs/stats"),
};

export default adminApi;
