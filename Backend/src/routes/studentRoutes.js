import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import {
  getStudentOverview,
  getAllCourses,
  getCourseCategories,
  getEnrolledCourses,
  getCourseLessons,
  markLessonComplete,
  saveLessonProgress,
  getLessonProgress,
  getMyCertificates,
  verifyCertificate,
  getLearningProgress,
  getUpcomingLiveClasses,
  joinLiveClass,
  leaveLiveClass,
  getAttendanceHistory,
  getMyAssignments,
  submitAssignment,
  getQuizHistory,
  getCourseQuizzes,
  submitQuizAttempt,
  getLeaderboard,
  getMyAchievements,
  getStudentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getBookmarks,
  addBookmark,
  removeBookmark,
  getDownloads,
  getStudentProfile,
  updateStudentProfile,
  changeStudentPassword,
  enrollInCourse,
} from "../controllers/studentController.js";

const router = Router();
const auth = [protect, allowRoles("student")];

// ── Overview
router.get("/overview", ...auth, getStudentOverview);

// ── Courses (catalog + enrolled)
router.get("/courses", ...auth, getAllCourses);
router.get("/courses/categories", ...auth, getCourseCategories);
router.post("/courses/:courseId/enroll", ...auth, enrollInCourse);
router.get("/enrolled", ...auth, getEnrolledCourses);

// ── Lessons
router.get("/courses/:courseId/lessons", ...auth, getCourseLessons);
router.post("/courses/:courseId/lessons/:lessonId/complete", ...auth, markLessonComplete);
router.post("/courses/:courseId/lessons/:lessonId/progress", ...auth, saveLessonProgress);
router.get("/courses/:courseId/lessons/:lessonId/progress", ...auth, getLessonProgress);

// ── Certificates
router.get("/certificates", ...auth, getMyCertificates);
router.get("/certificates/verify/:certId", protect, verifyCertificate);

// ── Learning Progress
router.get("/progress", ...auth, getLearningProgress);

// ── Live Classes
router.get("/live", ...auth, getUpcomingLiveClasses);
router.get("/live/attendance", ...auth, getAttendanceHistory);
router.post("/live/:id/join", ...auth, joinLiveClass);
router.post("/live/:id/leave", ...auth, leaveLiveClass);

// ── Assignments
router.get("/assignments", ...auth, getMyAssignments);
router.post("/courses/:courseId/assignments/:assignmentId/submit", ...auth, submitAssignment);

// ── Quizzes
router.get("/quizzes", ...auth, getQuizHistory);
router.get("/courses/:courseId/quizzes", ...auth, getCourseQuizzes);
router.post("/courses/:courseId/quizzes/:quizId/attempt", ...auth, submitQuizAttempt);

// ── Leaderboard & Achievements
router.get("/leaderboard", ...auth, getLeaderboard);
router.get("/achievements", ...auth, getMyAchievements);

// ── Notifications
router.get("/notifications", ...auth, getStudentNotifications);
router.patch("/notifications/:id/read", ...auth, markNotificationRead);
router.patch("/notifications/read-all", ...auth, markAllNotificationsRead);

// ── Bookmarks
router.get("/bookmarks", ...auth, getBookmarks);
router.post("/bookmarks", ...auth, addBookmark);
router.delete("/bookmarks/:id", ...auth, removeBookmark);

// ── Downloads
router.get("/downloads", ...auth, getDownloads);

// ── Profile
router.get("/profile", ...auth, getStudentProfile);
router.patch("/profile", ...auth, updateStudentProfile);
router.patch("/profile/password", ...auth, changeStudentPassword);

export default router;
