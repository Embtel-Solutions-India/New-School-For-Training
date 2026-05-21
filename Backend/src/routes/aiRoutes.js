import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/rbacMiddleware.js";
import { chat, deleteSession, getHistory, getSession, generateLessonSummary, getLessonSummary, voiceChat } from "../controllers/aiController.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = Router();
const auth = [protect, allowRoles("student", "teacher", "admin")];
const studentAuth = [protect, allowRoles("student")];

router.post("/chat", aiLimiter, ...auth, chat);
router.get("/history", ...auth, getHistory);
router.get("/session/:sessionId", ...auth, getSession);
router.delete("/session/:sessionId", ...auth, deleteSession);

router.post("/lesson-summary", aiLimiter, ...studentAuth, generateLessonSummary);
router.get("/lesson-summary/:lessonId", ...studentAuth, getLessonSummary);
router.post("/voice", aiLimiter, ...studentAuth, voiceChat);

export default router;
