import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "admin" },
    },
    resource: {
      type: String,
      default: "",
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "unknown",
    },
    status: {
      type: String,
      enum: ["success", "failure", "warning"],
      default: "success",
      index: true,
    },
  },
  {
    timestamps: true,
    capped: { size: 50 * 1024 * 1024, max: 10000 },
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ "actor.userId": 1 });

export default mongoose.model("AuditLog", auditLogSchema);
