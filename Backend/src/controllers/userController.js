import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { normalizeRole } from "../utils/roles.js";

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.status(200).json({ success: true, user });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: normalizeRole(req.body.role), accountStatus: req.body.accountStatus },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, user });
});
