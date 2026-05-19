import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, default: "" },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    shortDescription: { type: String, trim: true, default: "" },
    content: { type: String, default: "" },
    featuredImage: { type: String, trim: true, default: "" },
    category: {
      type: String,
      trim: true,
      default: "Technology",
      enum: [
        "AI & Data",
        "Cloud & Security",
        "Development",
        "Career",
        "Technology",
        "Certifications",
        "Student Stories",
        "Industry Trends",
      ],
    },
    tags: [{ type: String, trim: true }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    readTime: { type: Number, default: 1 },
  },
  { timestamps: true }
);

blogSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const words = this.content
      .replace(/<[^>]*>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    this.readTime = Math.max(1, Math.ceil(words / 200));
  }
  next();
});

blogSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Blog", blogSchema);
