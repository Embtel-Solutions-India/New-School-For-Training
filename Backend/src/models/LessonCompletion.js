import mongoose from "mongoose";

const lessonCompletionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: false });

lessonCompletionSchema.index({ student: 1, course: 1, lessonId: 1 }, { unique: true });
lessonCompletionSchema.index({ student: 1, completedAt: -1 });

export default mongoose.model("LessonCompletion", lessonCompletionSchema);
