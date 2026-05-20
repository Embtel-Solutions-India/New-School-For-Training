import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    gateway: { type: String, enum: ["stripe", "paypal", "free"], required: true },
    gatewayTransactionId: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["success", "failed", "refunded"],
      default: "success",
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
