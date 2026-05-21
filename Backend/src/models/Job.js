import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  companyLogo: { type: String, default: "" },
  description: { type: String, required: true },
  requirements: { type: String, default: "" },
  skills: [{ type: String, trim: true }],
  location: { type: String, trim: true, default: "Remote" },
  type: {
    type: String,
    enum: ["full-time", "part-time", "internship", "remote", "contract"],
    default: "full-time",
  },
  category: {
    type: String,
    enum: ["software", "web-development", "ai-ml", "cloud", "data-science", "design", "marketing", "other"],
    default: "software",
  },
  salary: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    isPublic: { type: Boolean, default: true },
  },
  deadline: { type: Date, default: null },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isActive: { type: Boolean, default: true },
  applicationCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
}, { timestamps: true });

jobSchema.index({ title: "text", description: "text", company: "text" });
jobSchema.index({ category: 1, type: 1, isActive: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ postedBy: 1, createdAt: -1 });

export default mongoose.model("Job", jobSchema);
