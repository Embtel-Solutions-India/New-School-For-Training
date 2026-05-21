import mongoose from "mongoose";

const voiceHistorySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    transcript: { type: String, required: true },
    response: { type: String, required: true },
    language: { type: String, enum: ["en", "hi", "es", "fr"], default: "en" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    sessionId: { type: String },
  },
  { timestamps: true }
);

voiceHistorySchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("VoiceHistory", voiceHistorySchema);
