import mongoose from "mongoose";

/**
 * Section — a named grouping of lesson IDs within a Course.
 *
 * Relationship: Course (1) → Sections (many) → Lesson IDs (refs to
 * the embedded ObjectIds in Course.curriculum.lessons).
 *
 * Intentionally non-destructive: existing Course.curriculum.lessons
 * embedding is preserved. A Section document simply records which
 * lesson _ids from that array belong to this section and in what order.
 */
const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
      maxlength: [200, "Title must be less than 200 characters"],
    },
    description: { type: String, trim: true, default: "" },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    order: { type: Number, default: 0 },
    lessonIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    status: {
      type: String,
      enum: ["active", "draft"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

sectionSchema.index({ course: 1, order: 1 });

export default mongoose.model("Section", sectionSchema);
