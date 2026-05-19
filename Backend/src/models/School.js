import mongoose from "mongoose";

const buildSlug = (name = "") =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      maxlength: [200, "Name must be less than 200 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: { type: String, trim: true, default: "" },
    logo: { type: String, trim: true, default: "" },
    address: {
      street: { type: String, trim: true, default: "" },
      city:   { type: String, trim: true, default: "" },
      state:  { type: String, trim: true, default: "" },
      country:{ type: String, trim: true, default: "" },
      zip:    { type: String, trim: true, default: "" },
    },
    contact: {
      phone:   { type: String, trim: true, default: "" },
      email:   { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

schoolSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = buildSlug(this.name);
  }
  next();
});

export default mongoose.model("School", schoolSchema);
