import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    amount: { type: Number, required: true },           // final amount in smallest currency unit (cents)
    currency: { type: String, default: "USD" },
    originalAmount: { type: Number, required: true },  // before discount
    couponCode: { type: String, trim: true, default: "" },
    couponDiscount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "free"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    // Gateway-specific IDs
    stripeSessionId: { type: String, trim: true, default: "" },
    paypalOrderId: { type: String, trim: true, default: "" },
    gatewayTransactionId: { type: String, trim: true, default: "" },
    // Order expiry — pending orders expire after 1 hour
    expiresAt: { type: Date, default: () => new Date(Date.now() + 60 * 60 * 1000), index: true },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, course: 1 });
orderSchema.index({ stripeSessionId: 1 });
orderSchema.index({ paypalOrderId: 1 });

export default mongoose.model("Order", orderSchema);
