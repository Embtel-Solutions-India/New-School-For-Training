import express from "express";
import {
  getFinancialDashboard,
  getPaymentSettings,
  updateCoursePricing,
  updatePaymentSettings,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";

const router = express.Router();

router.use(protect, allowRoles("admin"));

router.get("/settings", getPaymentSettings);
router.patch("/settings", updatePaymentSettings);
router.get("/financial-dashboard", getFinancialDashboard);
router.patch("/courses/:courseId/pricing", updateCoursePricing);

export default router;
