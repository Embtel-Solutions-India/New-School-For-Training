import mongoose from "mongoose";

const lessonProgressSchema = new mongoose.Schema(
  {
    user:            { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
    course:          { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId:        { type: mongoose.Schema.Types.ObjectId, required: true },
    lastPosition:    { type: Number, default: 0, min: 0 },   // seconds from start
    watchedDuration: { type: Number, default: 0, min: 0 },   // cumulative seconds watched
    duration:        { type: Number, default: 0, min: 0 },   // total video length in seconds
    completed:       { type: Boolean, default: false },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ user: 1, course: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("LessonProgress", lessonProgressSchema);
