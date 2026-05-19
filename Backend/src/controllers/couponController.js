import Coupon from "../models/Coupon.js";
import AuditLog from "../models/AuditLog.js";

const logAction = async (action, req, resourceId, details = {}) => {
  try {
    await AuditLog.create({
      action,
      actor: {
        userId: req.user?._id,
        name: req.user?.name || "",
        email: req.user?.email || "",
        role: req.user?.role || "admin",
      },
      resource: "coupon",
      resourceId,
      details,
      ipAddress: req.ip || "unknown",
      status: "success",
    });
  } catch (_) {}
};

export const getCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const activeOnly = req.query.active === "true";

    const query = {};
    if (search) query.code = { $regex: search, $options: "i" };
    if (activeOnly) query.active = true;

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Coupon.countDocuments(query),
    ]);

    const now = new Date();
    const enriched = coupons.map((c) => ({
      ...c.toJSON(),
      status: !c.active
        ? "disabled"
        : c.expiresAt && c.expiresAt < now
        ? "expired"
        : c.usageLimit > 0 && c.usedCount >= c.usageLimit
        ? "exhausted"
        : "active",
    }));

    res.json({
      success: true,
      coupons: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercent, usageLimit, expiresAt, description, minOrderAmount } = req.body;

    const existing = await Coupon.findOne({ code: code?.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code,
      discountPercent,
      usageLimit: usageLimit || 0,
      expiresAt: expiresAt || null,
      description: description || "",
      minOrderAmount: minOrderAmount || 0,
      createdBy: req.user._id,
    });

    await logAction("COUPON_CREATED", req, coupon._id, { code: coupon.code, discountPercent });

    res.status(201).json({ success: true, message: "Coupon created successfully", coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const { discountPercent, usageLimit, expiresAt, description, minOrderAmount, active } = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { discountPercent, usageLimit, expiresAt, description, minOrderAmount, active },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    await logAction("COUPON_UPDATED", req, couponId, { code: coupon.code });

    res.json({ success: true, message: "Coupon updated", coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    await logAction("COUPON_DELETED", req, couponId, { code: coupon.code });

    res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.active = !coupon.active;
    await coupon.save();

    await logAction("COUPON_TOGGLED", req, couponId, { code: coupon.code, active: coupon.active });

    res.json({ success: true, message: `Coupon ${coupon.active ? "enabled" : "disabled"}`, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
