import mongoose from "mongoose";

const blogCommentSchema = new mongoose.Schema(
  {
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "BlogComment", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

blogCommentSchema.index({ blog: 1, createdAt: 1 });
blogCommentSchema.index({ parentComment: 1 });

export default mongoose.model("BlogComment", blogCommentSchema);
