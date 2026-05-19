import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  lessonTitle: { type: String, trim: true, default: "" },
  courseTitle: { type: String, trim: true, default: "" },
  note: { type: String, trim: true, default: "" },
}, { timestamps: true });

bookmarkSchema.index({ student: 1, createdAt: -1 });
bookmarkSchema.index({ student: 1, course: 1, lessonId: 1 }, { unique: true });

export default mongoose.model("Bookmark", bookmarkSchema);
