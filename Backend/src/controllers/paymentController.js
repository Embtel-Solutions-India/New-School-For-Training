import Course from "../models/Course.js";
import PaymentSetting from "../models/PaymentSetting.js";
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
  const [courseCount, paidCourses] = await Promise.all([
    Course.countDocuments(),
    Course.find({ "pricing.price": { $gt: 0 } }).select("title pricing status teacher").limit(20),
  ]);

  const estimatedRevenue = paidCourses.reduce((total, course) => total + (course.pricing?.price || 0), 0);

  res.status(200).json({
    success: true,
    analytics: {
      courseCount,
      paidCourseCount: paidCourses.length,
      estimatedRevenue,
      transactions: [
        { id: "TXN-1001", amount: 2499, status: "paid", gateway: "Razorpay" },
        { id: "TXN-1002", amount: 999, status: "refund_review", gateway: "Stripe" },
      ],
      teacherPayouts: [
        { teacher: "Teacher payout placeholder", amount: 18000, status: "scheduled" },
      ],
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
