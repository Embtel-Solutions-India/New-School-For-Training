import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: Date,
    payment: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      method: { type: String, default: "razorpay" },
      transactionId: { type: String, default: "" },
      couponCode: { type: String, default: "" },
      discount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ["pending", "completed", "refunded", "failed"],
        default: "completed",
        index: true,
      },
    },
    status: {
      type: String,
      enum: ["active", "completed", "refunded", "dropped"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ createdAt: -1 });

export default mongoose.model("Enrollment", enrollmentSchema);
