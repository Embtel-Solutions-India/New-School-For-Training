import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import { chat, deleteSession, getHistory, getSession } from "../controllers/aiController.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = Router();
const auth = [protect, allowRoles("student", "teacher", "admin")];

router.post("/chat", aiLimiter, ...auth, chat);
router.get("/history", ...auth, getHistory);
router.get("/session/:sessionId", ...auth, getSession);
router.delete("/session/:sessionId", ...auth, deleteSession);

export default router;
