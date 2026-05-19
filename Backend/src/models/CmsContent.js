import mongoose from "mongoose";

const cmsContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["banner", "faq", "testimonial", "blog", "category"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title must be under 200 characters"],
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    author: {
      type: String,
      trim: true,
      default: "",
    },
    tags: [{ type: String, trim: true }],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

cmsContentSchema.index({ type: 1, active: 1, order: 1 });
cmsContentSchema.index({ createdAt: -1 });

export default mongoose.model("CmsContent", cmsContentSchema);
