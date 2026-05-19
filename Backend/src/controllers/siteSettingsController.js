import SiteSettings from "../models/SiteSettings.js";
import AuditLog from "../models/AuditLog.js";

const logAction = async (action, req, details = {}) => {
  try {
    await AuditLog.create({
      action,
      actor: { userId: req.user?._id, name: req.user?.name || "", email: req.user?.email || "", role: req.user?.role || "admin" },
      resource: "settings",
      details,
      ipAddress: req.ip || "unknown",
      status: "success",
    });
  } catch (_) {}
};

export const getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne({ key: "global" });
    if (!settings) {
      settings = await SiteSettings.create({ key: "global" });
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGeneralSettings = async (req, res) => {
  try {
    const { siteName, logo, contactEmail, supportEmail, tagline, timezone } = req.body;

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global" },
      { $set: { "general.siteName": siteName, "general.logo": logo, "general.contactEmail": contactEmail, "general.supportEmail": supportEmail, "general.tagline": tagline, "general.timezone": timezone } },
      { new: true, upsert: true }
    );

    await logAction("SETTINGS_GENERAL_UPDATED", req, { siteName });
    res.json({ success: true, message: "General settings updated", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentSettings = async (req, res) => {
  try {
    const { currency, taxPercent, gateways } = req.body;

    const update = {};
    if (currency !== undefined) update["payment.currency"] = currency;
    if (taxPercent !== undefined) update["payment.taxPercent"] = taxPercent;
    if (gateways?.razorpay !== undefined) {
      update["payment.gateways.razorpay.enabled"] = gateways.razorpay.enabled;
      if (gateways.razorpay.keyId) update["payment.gateways.razorpay.keyId"] = gateways.razorpay.keyId;
    }
    if (gateways?.stripe !== undefined) {
      update["payment.gateways.stripe.enabled"] = gateways.stripe.enabled;
      if (gateways.stripe.publishableKey) update["payment.gateways.stripe.publishableKey"] = gateways.stripe.publishableKey;
    }

    const settings = await SiteSettings.findOneAndUpdate({ key: "global" }, { $set: update }, { new: true, upsert: true });

    await logAction("SETTINGS_PAYMENT_UPDATED", req, { currency });
    res.json({ success: true, message: "Payment settings updated", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSecuritySettings = async (req, res) => {
  try {
    const { sessionTimeout, maxLoginAttempts, requireEmailVerification, allowGoogleAuth } = req.body;

    const update = {};
    if (sessionTimeout !== undefined) update["security.sessionTimeout"] = sessionTimeout;
    if (maxLoginAttempts !== undefined) update["security.maxLoginAttempts"] = maxLoginAttempts;
    if (requireEmailVerification !== undefined) update["security.requireEmailVerification"] = requireEmailVerification;
    if (allowGoogleAuth !== undefined) update["security.allowGoogleAuth"] = allowGoogleAuth;

    const settings = await SiteSettings.findOneAndUpdate({ key: "global" }, { $set: update }, { new: true, upsert: true });

    await logAction("SETTINGS_SECURITY_UPDATED", req, {});
    res.json({ success: true, message: "Security settings updated", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message } = req.body;

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global" },
      { $set: { "maintenance.enabled": enabled, "maintenance.message": message || "Scheduled maintenance in progress." } },
      { new: true, upsert: true }
    );

    await logAction("MAINTENANCE_MODE_TOGGLED", req, { enabled });
    res.json({ success: true, message: `Maintenance mode ${enabled ? "enabled" : "disabled"}`, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
