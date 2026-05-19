import passport from "passport";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { clearRefreshCookieOptions, refreshCookieName, refreshCookieOptions } from "../utils/cookies.js";
import { isSessionAllowed, sessionStatusReason } from "../utils/sessionStatus.js";
import { authenticateLocalUser, issueAuthTokens, publicUser, registerLocalUser } from "../services/authService.js";
import { buildClientUrl, sendAuthEmail } from "../services/emailService.js";
import { createResetToken, verifyEmailToken, verifyRefreshToken, verifyResetToken } from "../services/tokenService.js";

const sendAuthResponse = async (res, user, statusCode = 200) => {
  const tokens = await issueAuthTokens(user);

  res.cookie(refreshCookieName, tokens.refreshToken, refreshCookieOptions);
  console.log("[auth] Session issued:", {
    userId: user._id.toString(),
    role: user.role,
    accountStatus: user.accountStatus,
    cookie: refreshCookieName,
  });
  return res.status(statusCode).json({
    success: true,
    user: publicUser(user),
    accessToken: tokens.accessToken,
  });
};

export const signup = asyncHandler(async (req, res) => {
  const { user, verificationToken } = await registerLocalUser(req.body);

  await sendAuthEmail({
    to: user.email,
    subject: "Verify your School For Training account",
    actionUrl: buildClientUrl("/verify-email", { token: verificationToken }),
  });

  return sendAuthResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticateLocalUser(req.body);
  return sendAuthResponse(res, user);
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[refreshCookieName];

  if (token) {
    const user = await User.findOne({ refreshToken: token }).select("+refreshToken");
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }

  res.clearCookie(refreshCookieName, clearRefreshCookieOptions);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const refreshSession = asyncHandler(async (req, res) => {
  const token = req.cookies?.[refreshCookieName];

  if (!token) {
    console.warn("[auth] Refresh rejected: cookie missing");
    throw new ApiError(401, "Refresh token missing");
  }

  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.sub)
    .select("+refreshToken");

  if (!user || user.refreshToken !== token || !isSessionAllowed(user)) {
    console.warn("[auth] Refresh rejected:", {
      userId: decoded.sub,
      hasUser: !!user,
      tokenMatches: !!user && user.refreshToken === token,
      reason: sessionStatusReason(user),
    });
    throw new ApiError(401, "Refresh session is invalid");
  }

  const tokens = await issueAuthTokens(user);
  res.cookie(refreshCookieName, tokens.refreshToken, refreshCookieOptions);

  console.log("[auth] Access token refreshed:", {
    userId: user._id.toString(),
    role: user.role,
    accountStatus: user.accountStatus,
    refreshRotated: true,
  });

  return res.status(200).json({
    success: true,
    user: publicUser(user),
    accessToken: tokens.accessToken,
  });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: publicUser(req.user) });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const decoded = verifyEmailToken(req.params.token);
  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isVerified = true;
  user.accountStatus = "active";
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Email verified successfully" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });

  if (user && user.provider === "local") {
    const resetToken = createResetToken(user);
    await sendAuthEmail({
      to: user.email,
      subject: "Reset your School For Training password",
      actionUrl: buildClientUrl("/reset-password", { token: resetToken }),
    });
  }

  res.status(200).json({
    success: true,
    message: "If an account exists, password reset instructions have been sent.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const decoded = verifyResetToken(req.body.token);
  const user = await User.findById(decoded.sub).select("+password +refreshToken");

  if (!user || user.provider !== "local") {
    throw new ApiError(400, "Password reset is not available for this account");
  }

  user.password = req.body.password;
  user.refreshToken = undefined;
  await user.save();

  res.clearCookie(refreshCookieName, clearRefreshCookieOptions);
  res.status(200).json({ success: true, message: "Password reset successfully" });
});

export const googleStart = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

export const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (error, user, info) => {
    if (error) return next(error);

    if (!user) {
      const message = encodeURIComponent(info?.message || "Google sign-in failed");
      return res.redirect(buildClientUrl("/login", { oauth_error: message }));
    }

    const tokens = await issueAuthTokens(user);
    res.cookie(refreshCookieName, tokens.refreshToken, refreshCookieOptions);
    return res.redirect(buildClientUrl("/auth/callback", { token: tokens.accessToken }));
  })(req, res, next);
};
