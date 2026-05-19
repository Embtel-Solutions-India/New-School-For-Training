import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    fileKey: { type: String, required: true, unique: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, trim: true, default: "" },
    resourceType: { type: String, trim: true, default: "" },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },
    lessonId: { type: mongoose.Schema.Types.ObjectId },
    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Upload", uploadSchema);
