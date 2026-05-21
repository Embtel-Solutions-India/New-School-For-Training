import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["video", "pdf", "link", "download"],
      default: "link",
    },
    url: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    chapter: { type: String, trim: true, default: "Getting Started" },
    order: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["video", "pdf", "article", "live", "link"],
      default: "video",
    },
    videoUrl: { type: String, trim: true, default: "" },
    videoKey: { type: String, trim: true, default: "" },
    richText: { type: String, default: "" },
    resources: [resourceSchema],
  },
  { _id: true, timestamps: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    timeLimit: { type: Number, default: 0 },        // minutes; 0 = no limit
    passingScore: { type: Number, default: 60 },    // percentage
    questions: [
      {
        prompt: { type: String, required: true, trim: true },
        type: {
          type: String,
          enum: ["mcq", "true_false", "short_answer", "long_answer"],
          default: "mcq",
        },
        options: [{ type: String, trim: true }],
        answer: { type: String, trim: true, default: "" },
        points: { type: Number, default: 1 },
      },
    ],
  },
  { _id: true, timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true, default: "" },
    dueDate: Date,
    maxScore: { type: Number, default: 100 },
    attachments: [
      {
        title: { type: String, trim: true, default: "" },
        url: { type: String, trim: true, default: "" },
      },
    ],
  },
  { _id: true, timestamps: true }
);

const weeklyPlanSchema = new mongoose.Schema(
  {
    weekNo: { type: Number, required: true },
    title: { type: String, trim: true, default: "" },
    objective: { type: String, trim: true, default: "" },
    lectures: [{ type: String, trim: true }],
    lab: { type: String, trim: true, default: "" },
    caseStudy: { type: String, trim: true, default: "" },
    duration: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },
    description: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "General" },
    tags: [{ type: String, trim: true }],
    thumbnail: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "pending_review", "published", "rejected", "unpublished", "archived"],
      default: "draft",
      index: true,
    },
    approvalNote: {
      type: String,
      default: "",
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    enrollmentCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    duration: { type: String, trim: true, default: "" },
    estimatedHours: { type: Number, default: 0 },
    skills: [{ type: String, trim: true }],
    objectives: [{ type: String, trim: true }],
    weeklyPlan: [weeklyPlanSchema],
    capstone: {
      title: { type: String, trim: true, default: "" },
      description: { type: String, trim: true, default: "" },
      requirements: [{ type: String, trim: true }],
      deliverables: [{ type: String, trim: true }],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    pricing: {
      currency: { type: String, default: "USD" },
      price: { type: Number, default: 0 },
      discountPercent: { type: Number, default: 0 },
    },
    curriculum: {
      previewMode: { type: Boolean, default: false },
      lessons: [lessonSchema],
      quizzes: [quizSchema],
      assignments: [assignmentSchema],
    },
  },
  { timestamps: true }
);

courseSchema.index({ teacher: 1, slug: 1 }, { unique: true });

export default mongoose.model("Course", courseSchema);
