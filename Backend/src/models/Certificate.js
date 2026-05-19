import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
  certificateId: { type: String, unique: true, sparse: true },
  grade: { type: String, default: "Pass" },
  issuedAt: { type: Date, default: Date.now },
}, { timestamps: true });

certificateSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model("Certificate", certificateSchema);
