import express from "express";
import {
  forgotPassword,
  googleCallback,
  googleStart,
  login,
  logout,
  me,
  refreshSession,
  resetPassword,
  signup,
  verifyEmail,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import {
  forgotPasswordValidator,
  loginValidator,
  resetPasswordValidator,
  signupValidator,
  tokenParamValidator,
} from "../validators/authValidators.js";

const router = express.Router();

router.post("/signup", signupValidator, validate, signup);
router.post("/login", loginValidator, validate, login);
router.post("/logout", logout);
router.post("/refresh", refreshSession);
router.get("/me", protect, me);
router.get("/verify-email/:token", tokenParamValidator, validate, verifyEmail);
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword);
router.post("/reset-password", resetPasswordValidator, validate, resetPassword);
router.get("/google", googleStart);
router.get("/google/callback", googleCallback);

export default router;
