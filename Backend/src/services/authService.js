import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { normalizeRole } from "../utils/roles.js";
import { createAccessToken, createEmailToken, createRefreshToken } from "./tokenService.js";

export const publicUser = (user) => {
  const serialized = user.toJSON();
  serialized.role = normalizeRole(serialized.role);
  return serialized;
};

export const issueAuthTokens = async (user) => {
  user.role = normalizeRole(user.role);
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  if (user.accountStatus === "pending" && user.isVerified) {
    user.accountStatus = "active";
  }
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const registerLocalUser = async ({ name, username, email, password }) => {
  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: username?.toLowerCase() }],
  });

  if (existing) {
    throw new ApiError(409, "Email or username already in use");
  }

  const user = await User.create({
    name,
    username,
    email: normalizedEmail,
    password,
    provider: "local",
  });

  return {
    user,
    verificationToken: createEmailToken(user),
  };
};

export const authenticateLocalUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshToken");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.accountStatus === "suspended" || user.accountStatus === "disabled") {
    throw new ApiError(403, "Account is not allowed to sign in");
  }

  user.role = normalizeRole(user.role);

  return user;
};
