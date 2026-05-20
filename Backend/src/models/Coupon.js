import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Code must be at least 3 characters"],
      maxlength: [20, "Code must be at most 20 characters"],
      match: [/^[A-Z0-9_-]+$/, "Code can only contain letters, numbers, dashes, underscores"],
    },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      default: "percent",
    },
    discountPercent: {
      type: Number,
      min: [1, "Discount must be at least 1%"],
      max: [100, "Discount cannot exceed 100%"],
      default: 0,
    },
    flatAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    applicableCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

couponSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

couponSchema.virtual("isExhausted").get(function () {
  return this.usageLimit > 0 && this.usedCount >= this.usageLimit;
});

couponSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Coupon", couponSchema);
