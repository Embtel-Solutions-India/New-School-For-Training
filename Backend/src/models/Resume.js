import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  template: { type: String, enum: ["modern", "classic", "minimal"], default: "modern" },
  summary: { type: String, trim: true, default: "" },
  skills: [{ type: String, trim: true }],
  education: [{
    institution: { type: String, trim: true, default: "" },
    degree: { type: String, trim: true, default: "" },
    field: { type: String, trim: true, default: "" },
    startYear: { type: Number },
    endYear: { type: Number },
    grade: { type: String, trim: true, default: "" },
  }],
  experience: [{
    company: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },
    startDate: { type: String, trim: true, default: "" },
    endDate: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  }],
  projects: [{
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    tech: [String],
    link: { type: String, trim: true, default: "" },
  }],
  certifications: [{
    title: { type: String, trim: true, default: "" },
    issuer: { type: String, trim: true, default: "SFT Learning Platform" },
    date: { type: String, trim: true, default: "" },
    certificateId: { type: String, trim: true, default: "" },
  }],
  achievements: [{ type: String, trim: true }],
}, { timestamps: true });

resumeSchema.index({ user: 1 });

export default mongoose.model("Resume", resumeSchema);
