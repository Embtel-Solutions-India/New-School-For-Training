import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["lesson_complete", "quiz_attempt", "assignment_submit", "live_class", "course_complete", "certificate", "profile_update", "avatar_generate", "job_applied", "resume_created"],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
