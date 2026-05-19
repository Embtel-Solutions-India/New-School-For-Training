import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  assignmentTitle: { type: String, trim: true, default: "" },
  content: { type: String, trim: true, default: "" },
  fileUrl: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["submitted", "graded", "resubmit"], default: "submitted", index: true },
  score: { type: Number, default: null },
  maxScore: { type: Number, default: 100 },
  feedback: { type: String, trim: true, default: "" },
  submittedAt: { type: Date, default: Date.now },
  gradedAt: { type: Date },
}, { timestamps: true });

submissionSchema.index({ student: 1, course: 1, assignmentId: 1 });
submissionSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("Submission", submissionSchema);
