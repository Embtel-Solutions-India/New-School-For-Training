import mongoose from "mongoose";

const paymentSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "platform",
      unique: true,
      immutable: true,
    },
    gateways: {
      razorpay: { enabled: { type: Boolean, default: false }, keyId: { type: String, default: "" } },
      stripe: { enabled: { type: Boolean, default: false }, publishableKey: { type: String, default: "" } },
    },
    currency: { type: String, default: "USD" },
    taxPercent: { type: Number, default: 18 },
    subscriptions: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true },
        interval: { type: String, enum: ["monthly", "quarterly", "yearly"], default: "monthly" },
      },
    ],
    coupons: [
      {
        code: { type: String, required: true, trim: true, uppercase: true },
        discountPercent: { type: Number, required: true },
        active: { type: Boolean, default: true },
      },
    ],
    flashSale: {
      enabled: { type: Boolean, default: false },
      discountPercent: { type: Number, default: 0 },
      endsAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentSetting", paymentSettingSchema);
