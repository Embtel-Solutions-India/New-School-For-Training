import express from "express";
import {
  createAssignment,
  createCourse,
  createLesson,
  createQuiz,
  deleteCourse,
  deleteLesson,
  getCourseById,
  getCourses,
  getPublicCategories,
  getPublicCourseById,
  getPublicCourses,
  reorderLessons,
  setCoursePublishState,
  updateCourse,
  updateLesson,
} from "../controllers/courseController.js";
import { getPublicCourseReviews, getTopReviews } from "../controllers/reviewController.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";

const router = express.Router();

router.get("/public", getPublicCourses);
router.get("/public/categories", getPublicCategories);
router.get("/public/top-reviews", getTopReviews);
router.get("/public/:courseId", getPublicCourseById);
router.get("/public/:courseId/reviews", getPublicCourseReviews);

// Unified GET by ID — public or authenticated (must come before protect middleware)
router.get("/:courseId", optionalAuth, getCourseById);

router.use(protect);

router
  .route("/")
  .get(allowRoles("teacher", "admin"), getCourses)
  .post(allowRoles("teacher"), createCourse);

router
  .route("/:courseId")
  .put(allowRoles("teacher"), updateCourse)
  .patch(allowRoles("teacher"), updateCourse)
  .delete(allowRoles("teacher"), deleteCourse);

router.patch("/:courseId/publish", allowRoles("teacher"), setCoursePublishState);
router.post("/:courseId/lessons", allowRoles("teacher"), createLesson);
router.patch("/:courseId/lessons/reorder", allowRoles("teacher"), reorderLessons);
router.patch("/:courseId/lessons/:lessonId", allowRoles("teacher"), updateLesson);
router.delete("/:courseId/lessons/:lessonId", allowRoles("teacher"), deleteLesson);
router.post("/:courseId/quizzes", allowRoles("teacher"), createQuiz);
router.post("/:courseId/assignments", allowRoles("teacher"), createAssignment);

export default router;
