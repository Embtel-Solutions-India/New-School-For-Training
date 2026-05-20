import mongoose from "mongoose";

const blogLikeSchema = new mongoose.Schema(
  {
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

blogLikeSchema.index({ blog: 1, user: 1 }, { unique: true });
blogLikeSchema.index({ blog: 1 });

export default mongoose.model("BlogLike", blogLikeSchema);
