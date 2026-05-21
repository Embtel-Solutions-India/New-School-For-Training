import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    isImportant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

announcementSchema.index({ course: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);
