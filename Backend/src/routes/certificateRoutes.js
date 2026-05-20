import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import { downloadCertificate } from "../controllers/certificateController.js";

const router = Router();

router.get(
  "/download/:certId",
  protect,
  allowRoles("student", "teacher", "admin"),
  downloadCertificate
);

export default router;
