import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import { getVideoSignedUrl } from "../controllers/lessonController.js";

const router = Router();

router.get(
  "/video/:lessonId",
  protect,
  allowRoles("student", "teacher", "admin"),
  getVideoSignedUrl
);

export default router;
