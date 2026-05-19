import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global",
      unique: true,
      immutable: true,
    },
    general: {
      siteName: { type: String, default: "School For Training", trim: true },
      logo: { type: String, default: "", trim: true },
      contactEmail: { type: String, default: "", trim: true },
      supportEmail: { type: String, default: "", trim: true },
      tagline: { type: String, default: "", trim: true },
      timezone: { type: String, default: "Asia/Kolkata" },
    },
    payment: {
      currency: { type: String, default: "USD" },
      taxPercent: { type: Number, default: 18 },
      gateways: {
        razorpay: {
          enabled: { type: Boolean, default: false },
          keyId: { type: String, default: "" },
        },
        stripe: {
          enabled: { type: Boolean, default: false },
          publishableKey: { type: String, default: "" },
        },
      },
    },
    security: {
      sessionTimeout: { type: Number, default: 60 },
      maxLoginAttempts: { type: Number, default: 5 },
      requireEmailVerification: { type: Boolean, default: true },
      allowGoogleAuth: { type: Boolean, default: true },
    },
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: "We are performing scheduled maintenance. Please check back soon." },
    },
  },
  { timestamps: true }
);

export default mongoose.model("SiteSettings", siteSettingsSchema);
