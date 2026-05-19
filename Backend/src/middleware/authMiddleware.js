import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isSessionAllowed, sessionStatusReason } from "../utils/sessionStatus.js";
import { verifyAccessToken } from "../services/tokenService.js";

/**
 * Optional Authentication Middleware (optionalAuth)
 * Attaches req.user if a valid Bearer token is present.
 * Does NOT reject requests without a token — proceeds as unauthenticated.
 * Used for endpoints that serve both public and authenticated contexts.
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub);
      if (user && isSessionAllowed(user)) req.user = user;
    } catch {
      // Invalid / expired token — continue as unauthenticated
    }
  }
  next();
});

/**
 * Authentication Middleware (protect)
 * Verifies JWT token and attaches authenticated user to request
 * - Extracts Bearer token from Authorization header
 * - Verifies token signature and expiration
 * - Checks user exists and session is valid (not suspended/disabled)
 * - Rejects if user account is suspended or disabled
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (!isSessionAllowed(user)) {
    console.warn("[auth] Access token rejected:", {
      userId: decoded.sub,
      reason: sessionStatusReason(user),
    });
    throw new ApiError(401, "User session is no longer valid");
  }

  req.user = user;
  next();
});
