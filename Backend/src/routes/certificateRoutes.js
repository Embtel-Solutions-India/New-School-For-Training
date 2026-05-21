import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import { downloadCertificate, verifyCertificate } from "../controllers/certificateController.js";

const router = Router();

// Public — no auth required
router.get("/verify/:certId", verifyCertificate);

// Protected
router.get(
  "/download/:certId",
  protect,
  allowRoles("student", "teacher", "admin"),
  downloadCertificate
);

export default router;
