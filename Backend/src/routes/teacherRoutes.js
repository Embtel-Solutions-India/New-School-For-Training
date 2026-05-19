import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";

// Controllers
import { getTeacherOverview } from "../controllers/teacherDashboardController.js";
import {
  getLiveClasses, createLiveClass, updateLiveClass, deleteLiveClass,
  startLiveClass, endLiveClass, getSessionAttendance, markAttendance, getAttendanceReport,
} from "../controllers/liveClassController.js";
import { getTeacherReviews, replyToReview, deleteReviewReply } from "../controllers/reviewController.js";
import {
  getTeacherBlogs, createBlog, updateBlog, deleteBlog,
} from "../controllers/blogController.js";
import {
  getCourseDiscussions, replyToDiscussion, pinDiscussion, deleteDiscussion,
} from "../controllers/discussionController.js";
import {
  getQuestions, createQuestion, updateQuestion, deleteQuestion, getQuestionStats,
} from "../controllers/questionBankController.js";
import { getStudentProgress, getProgressAnalytics, updateStudentProgress } from "../controllers/studentProgressController.js";
import { getContentAnalytics } from "../controllers/contentAnalyticsController.js";

// Reuse course controller for teacher course/quiz/assignment operations
import {
  getCourses, createCourse, updateCourse, deleteCourse, setCoursePublishState,
  createLesson, updateLesson, deleteLesson, reorderLessons,
  createQuiz, createAssignment, getCourseForTeacher,
} from "../controllers/courseController.js";

import {
  getSections, createSection, updateSection, deleteSection,
} from "../controllers/sectionController.js";

// Reuse notification controller
import { sendNotification } from "../controllers/notificationController.js";

const router = Router();
const auth = [protect, allowRoles("teacher")];

// ── Dashboard overview
router.get("/overview", ...auth, getTeacherOverview);

// ── Courses (teacher-scoped via existing controller)
router.get("/courses", ...auth, getCourses);
router.post("/courses", ...auth, createCourse);
router.get("/courses/:courseId", ...auth, getCourseForTeacher);
router.patch("/courses/:courseId", ...auth, updateCourse);
router.delete("/courses/:courseId", ...auth, deleteCourse);
router.patch("/courses/:courseId/publish", ...auth, setCoursePublishState);

// ── Sections
router.get("/courses/:courseId/sections", ...auth, getSections);
router.post("/courses/:courseId/sections", ...auth, createSection);
router.put("/courses/:courseId/sections/:sectionId", ...auth, updateSection);
router.patch("/courses/:courseId/sections/:sectionId", ...auth, updateSection);
router.delete("/courses/:courseId/sections/:sectionId", ...auth, deleteSection);

// ── Lessons & Modules
router.post("/courses/:courseId/lessons", ...auth, createLesson);
router.patch("/courses/:courseId/lessons/reorder", ...auth, reorderLessons);
router.patch("/courses/:courseId/lessons/:lessonId", ...auth, updateLesson);
router.delete("/courses/:courseId/lessons/:lessonId", ...auth, deleteLesson);

// ── Quizzes
router.post("/courses/:courseId/quizzes", ...auth, createQuiz);
router.patch("/courses/:courseId/quizzes/:quizId", ...auth, async (req, res) => {
  const { default: Course } = await import("../models/Course.js");
  const course = await Course.findOne({ _id: req.params.courseId, teacher: req.user._id });
  if (!course) return res.status(404).json({ success: false, message: "Course not found" });
  const quiz = course.curriculum.quizzes.id(req.params.quizId);
  if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
  Object.assign(quiz, req.body);
  await course.save();
  res.json({ success: true, course });
});
router.delete("/courses/:courseId/quizzes/:quizId", ...auth, async (req, res) => {
  const { default: Course } = await import("../models/Course.js");
  const course = await Course.findOne({ _id: req.params.courseId, teacher: req.user._id });
  if (!course) return res.status(404).json({ success: false, message: "Course not found" });
  const quiz = course.curriculum.quizzes.id(req.params.quizId);
  if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
  quiz.deleteOne();
  await course.save();
  res.json({ success: true, course });
});

// ── Assignments
router.post("/courses/:courseId/assignments", ...auth, createAssignment);
router.patch("/courses/:courseId/assignments/:assignmentId", ...auth, async (req, res) => {
  const { default: Course } = await import("../models/Course.js");
  const course = await Course.findOne({ _id: req.params.courseId, teacher: req.user._id });
  if (!course) return res.status(404).json({ success: false, message: "Course not found" });
  const assignment = course.curriculum.assignments.id(req.params.assignmentId);
  if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
  Object.assign(assignment, req.body);
  await course.save();
  res.json({ success: true, course });
});
router.delete("/courses/:courseId/assignments/:assignmentId", ...auth, async (req, res) => {
  const { default: Course } = await import("../models/Course.js");
  const course = await Course.findOne({ _id: req.params.courseId, teacher: req.user._id });
  if (!course) return res.status(404).json({ success: false, message: "Course not found" });
  const assignment = course.curriculum.assignments.id(req.params.assignmentId);
  if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
  assignment.deleteOne();
  await course.save();
  res.json({ success: true, course });
});

// ── Live Classes
router.get("/live", ...auth, getLiveClasses);
router.post("/live", ...auth, createLiveClass);
router.patch("/live/:id", ...auth, updateLiveClass);
router.delete("/live/:id", ...auth, deleteLiveClass);
router.patch("/live/:id/start", ...auth, startLiveClass);
router.patch("/live/:id/end", ...auth, endLiveClass);
router.get("/live/:id/attendance", ...auth, getSessionAttendance);
router.post("/live/:id/attendance", ...auth, markAttendance);
router.get("/attendance/report", ...auth, getAttendanceReport);

// ── Notifications
router.post("/notifications", ...auth, sendNotification);

// ── Student Progress
router.get("/students", ...auth, getStudentProgress);
router.get("/students/analytics", ...auth, getProgressAnalytics);
router.patch("/students/:enrollmentId/progress", ...auth, updateStudentProgress);

// ── Reviews
router.get("/reviews", ...auth, getTeacherReviews);
router.patch("/reviews/:id/reply", ...auth, replyToReview);
router.delete("/reviews/:id/reply", ...auth, deleteReviewReply);

// ── Discussions
router.get("/discussions/:courseId", ...auth, getCourseDiscussions);
router.post("/discussions/:id/reply", ...auth, replyToDiscussion);
router.patch("/discussions/:id/pin", ...auth, pinDiscussion);
router.delete("/discussions/:id", ...auth, deleteDiscussion);

// ── Question Bank
router.get("/question-bank", ...auth, getQuestions);
router.post("/question-bank", ...auth, createQuestion);
router.patch("/question-bank/:id", ...auth, updateQuestion);
router.delete("/question-bank/:id", ...auth, deleteQuestion);
router.get("/question-bank/stats", ...auth, getQuestionStats);

// ── Content Analytics
router.get("/analytics/content", ...auth, getContentAnalytics);

// ── Blogs
router.get("/blogs", ...auth, getTeacherBlogs);
router.post("/blogs", ...auth, createBlog);
router.put("/blogs/:id", ...auth, updateBlog);
router.delete("/blogs/:id", ...auth, deleteBlog);

export default router;
