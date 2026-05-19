import mongoose from "mongoose";

const questionBankSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: String, required: true, trim: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ["mcq", "true_false", "short_answer", "long_answer"],
      default: "mcq",
      index: true,
    },
    options: [{ type: String, trim: true }],
    correctAnswer: { type: String, trim: true, default: "" },
    explanation: { type: String, trim: true, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true,
    },
    subject: { type: String, trim: true, default: "General" },
    tags: [{ type: String, trim: true }],
    timesUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionBankSchema.index({ teacher: 1, subject: 1 });
questionBankSchema.index({ teacher: 1, tags: 1 });

export default mongoose.model("QuestionBank", questionBankSchema);
