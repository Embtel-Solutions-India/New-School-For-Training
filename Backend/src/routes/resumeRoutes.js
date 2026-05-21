import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import { getMyResume, saveResume, autofillResume, aiEnhanceResume, downloadResumePDF } from "../controllers/resumeController.js";

const router = Router();

const auth = [protect, allowRoles("student")];

router.get("/", ...auth, getMyResume);
router.post("/", ...auth, saveResume);
router.post("/autofill", ...auth, autofillResume);
router.post("/ai-enhance", ...auth, aiEnhanceResume);
router.get("/download", ...auth, downloadResumePDF);

export default router;
