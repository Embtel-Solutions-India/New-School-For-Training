import Course from "../models/Course.js";
import PaymentSetting from "../models/PaymentSetting.js";
import Transaction from "../models/Transaction.js";
import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";

const getSettingsDocument = () =>
  PaymentSetting.findOneAndUpdate(
    { key: "platform" },
    {
      $setOnInsert: {
        key: "platform",
        subscriptions: [
          { name: "Starter", price: 999, interval: "monthly" },
          { name: "Pro", price: 2499, interval: "monthly" },
        ],
      },
    },
    { new: true, upsert: true }
  );

export const getPaymentSettings = asyncHandler(async (_req, res) => {
  const settings = await getSettingsDocument();
  res.status(200).json({ success: true, settings });
});

export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const settings = await getSettingsDocument();
  const allowed = ["gateways", "currency", "taxPercent", "subscriptions", "coupons", "flashSale"];

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  });

  await settings.save();
  res.status(200).json({ success: true, settings });
});

export const getFinancialDashboard = asyncHandler(async (_req, res) => {
  const [courseCount, paidCourses, transactions, recentOrders] = await Promise.all([
    Course.countDocuments(),
    Course.find({ "pricing.price": { $gt: 0 } }).select("title pricing status teacher").limit(20),
    Transaction.find({ status: "success" })
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Order.find({ orderStatus: "paid" })
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount / 100), 0);

  res.status(200).json({
    success: true,
    analytics: {
      courseCount,
      paidCourseCount: paidCourses.length,
      totalRevenue,
      transactionCount: transactions.length,
      transactions: transactions.map((t) => ({
        id: t._id,
        amount: t.amount / 100,
        currency: t.currency,
        status: t.status,
        gateway: t.gateway,
        course: t.course?.title || "",
        createdAt: t.createdAt,
      })),
      recentOrders,
    },
  });
});

export const updateCoursePricing = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.courseId,
    { pricing: req.body.pricing },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, course });
});
