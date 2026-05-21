import mongoose from "mongoose";

const lectureSummarySchema = new mongoose.Schema(
  {
    lessonId: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    summary: { type: String, required: true },
    keyPoints: [{ type: String }],
    quizSuggestions: [{ type: String }],
    language: { type: String, enum: ["en", "hi", "es", "fr"], default: "en" },
  },
  { timestamps: true }
);

lectureSummarySchema.index({ lessonId: 1, language: 1 });

export default mongoose.model("LectureSummary", lectureSummarySchema);
