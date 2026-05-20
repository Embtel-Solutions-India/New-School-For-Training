import express from "express";
import {
  getPublicBlogs,
  getPublicBlogCategories,
  getPublicBlogBySlug,
  toggleLike,
  getLikeStatus,
} from "../controllers/blogController.js";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/blogCommentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public
router.get("/", getPublicBlogs);
router.get("/categories", getPublicBlogCategories);
router.get("/:slug", getPublicBlogBySlug);

// ── Comments (public read, auth write)
router.get("/:blogId/comments", getComments);
router.post("/:blogId/comments", protect, createComment);
router.put("/:blogId/comments/:commentId", protect, updateComment);
router.delete("/:blogId/comments/:commentId", protect, deleteComment);

// ── Likes (auth required)
router.post("/:id/like", protect, toggleLike);
router.get("/:id/like-status", protect, getLikeStatus);

export default router;
