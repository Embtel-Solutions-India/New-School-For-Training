import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  coverLetter: { type: String, trim: true, default: "" },
  resumeSnapshot: {
    summary: { type: String, default: "" },
    skills: [String],
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "shortlisted", "rejected", "offered"],
    default: "pending",
  },
  note: { type: String, default: "" },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

applicationSchema.index({ student: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ student: 1, appliedAt: -1 });

export default mongoose.model("Application", applicationSchema);
