import express from "express";
import { getDashboardPermissions, getDashboardSummary } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/summary",
  allowRoles("student", "teacher", "admin"),
  getDashboardSummary
);

router.get(
  "/permissions",
  allowRoles("student", "teacher", "admin"),
  getDashboardPermissions
);

export default router;
