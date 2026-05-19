import express from "express";
import {
  getPublicBlogs,
  getPublicBlogCategories,
  getPublicBlogBySlug,
} from "../controllers/blogController.js";

const router = express.Router();

router.get("/", getPublicBlogs);
router.get("/categories", getPublicBlogCategories);
router.get("/:slug", getPublicBlogBySlug);

export default router;
