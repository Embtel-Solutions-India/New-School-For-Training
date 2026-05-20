import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    template: { type: String, default: "" },
    status: { type: String, enum: ["sent", "failed", "skipped"], default: "sent", index: true },
    error: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

emailLogSchema.index({ to: 1, createdAt: -1 });

const EmailLog = mongoose.model("EmailLog", emailLogSchema);
export default EmailLog;
