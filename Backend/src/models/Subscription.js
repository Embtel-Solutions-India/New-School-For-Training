import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "trial", "past_due"],
      default: "active",
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    renewalDate: Date,
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    gateway: { type: String, enum: ["stripe", "paypal"], default: "stripe" },
    gatewaySubscriptionId: { type: String, trim: true, default: "" },
    cancelledAt: Date,
    cancelReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", subscriptionSchema);
