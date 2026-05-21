import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { normalizeRole, roleValues } from "../utils/roles.js";

const providers = ["local", "google"];
const accountStatuses = ["active", "pending", "suspended", "disabled"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name must be less than 80 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [40, "Username must be less than 40 characters"],
      match: [/^[a-z0-9._-]+$/, "Username can only contain letters, numbers, dots, dashes, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: roleValues,
      default: "student",
      index: true,
      set: normalizeRole,
    },
    provider: {
      type: String,
      enum: providers,
      default: "local",
      index: true,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    accountStatus: {
      type: String,
      enum: accountStatuses,
      default: "pending",
      index: true,
    },
    expertise: [{
      type: String,
      trim: true,
    }],
    assignedCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    }],
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    bio: {
      type: String,
      default: "",
      maxlength: [500, "Bio must be less than 500 characters"],
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      website: String,
      github: String,
    },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    learningGoals: [{ type: String, trim: true }],
    portfolio: { type: String, trim: true, default: "" },
    aiAvatarPrompt: { type: String, default: "" },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    preferredLanguage: { type: String, enum: ["en", "hi", "es", "fr"], default: "en" },
    profileLastUpdated: { type: Date },
    teacherId: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstLogin: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre("validate", function deriveUsername(next) {
  this.role = normalizeRole(this.role);

  if (!this.username && this.email) {
    this.username = this.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase();
  }
  next();
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
