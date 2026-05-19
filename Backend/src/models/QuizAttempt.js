import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quizTitle: { type: String, trim: true, default: "" },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 100 },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  answers: [{
    questionIndex: { type: Number },
    selected: { type: String },
    correct: { type: Boolean },
  }],
  timeTaken: { type: Number, default: 0 },
}, { timestamps: true });

quizAttemptSchema.index({ student: 1, createdAt: -1 });
quizAttemptSchema.index({ student: 1, course: 1, quizId: 1 });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
