import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiChatHistorySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    courseTitle: { type: String, default: "" },
    messages: [messageSchema],
    title: { type: String, default: "New Chat", maxlength: 100 },
  },
  { timestamps: true }
);

// Auto-expire sessions after 30 days
aiChatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
aiChatHistorySchema.index({ student: 1, createdAt: -1 });

const AIChatHistory = mongoose.model("AIChatHistory", aiChatHistorySchema);
export default AIChatHistory;
