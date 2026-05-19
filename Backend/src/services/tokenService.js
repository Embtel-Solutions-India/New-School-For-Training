import crypto from "crypto";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { normalizeRole } from "../utils/roles.js";

const signToken = (payload, secret, expiresIn) => {
  if (!secret) {
    throw new Error("JWT secret is missing");
  }

  return jwt.sign(payload, secret, { expiresIn });
};

export const createAccessToken = (user) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
  console.log("[auth] Creating access token:", {
    userId: user._id.toString(),
    role: normalizeRole(user.role),
    expiresIn,
  });

  return signToken(
    { sub: user._id.toString(), role: normalizeRole(user.role), email: user.email },
    process.env.JWT_ACCESS_SECRET,
    expiresIn
  );
};

export const createRefreshToken = (user) => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  console.log("[auth] Creating refresh token:", {
    userId: user._id.toString(),
    expiresIn,
  });

  return signToken(
    { sub: user._id.toString(), tokenVersion: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    expiresIn
  );
};

export const createEmailToken = (user) =>
  signToken(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_EMAIL_SECRET,
    process.env.EMAIL_TOKEN_EXPIRES_IN || "1d"
  );

export const createResetToken = (user) =>
  signToken(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_RESET_SECRET,
    process.env.RESET_TOKEN_EXPIRES_IN || "15m"
  );

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
};

export const verifyEmailToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_EMAIL_SECRET);
  } catch {
    throw new ApiError(400, "Invalid or expired verification token");
  }
};

export const verifyResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch {
    throw new ApiError(400, "Invalid or expired reset token");
  }
};
