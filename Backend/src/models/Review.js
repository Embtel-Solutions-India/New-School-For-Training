import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    comment: { type: String, trim: true, default: "", maxlength: 2000 },
    teacherReply: { type: String, trim: true, default: "" },
    teacherRepliedAt: Date,
    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false, index: true },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ course: 1, student: 1 }, { unique: true });
reviewSchema.index({ teacher: 1, rating: -1 });
reviewSchema.index({ course: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
