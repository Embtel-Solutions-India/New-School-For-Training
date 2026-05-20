import mongoose from "mongoose";
import Course from "../models/Course.js";
import Coupon from "../models/Coupon.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendEnrollmentEmail, buildClientUrl } from "../services/emailService.js";
import {
  constructWebhookEvent,
  createCheckoutSession,
  retrieveCheckoutSession,
} from "../services/stripeService.js";
import {
  capturePayPalOrder as capturePayPalAPI,
  createPayPalOrder as createPayPalAPI,
  verifyPayPalCapture,
} from "../services/paypalService.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const toCents = (dollars) => Math.round(dollars * 100);
const toDollars = (cents) => (cents / 100).toFixed(2);

/**
 * Validates a coupon for a given course and amount.
 * Returns { discount, finalAmount, coupon }.
 */
const validateCoupon = async (code, courseId, originalAmount) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new ApiError(400, "Invalid coupon code");
  if (!coupon.active) throw new ApiError(400, "This coupon is not active");
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, "This coupon has expired");
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    throw new ApiError(400, "This coupon has reached its usage limit");
  if (coupon.applicableCourses.length > 0 && !coupon.applicableCourses.some((id) => id.toString() === courseId.toString()))
    throw new ApiError(400, "This coupon is not valid for this course");
  if (coupon.minOrderAmount > 0 && originalAmount < coupon.minOrderAmount)
    throw new ApiError(400, `Minimum order amount for this coupon is $${coupon.minOrderAmount}`);

  let discount = 0;
  if (coupon.discountType === "flat") {
    discount = Math.min(coupon.flatAmount, originalAmount);
  } else {
    discount = Math.round((originalAmount * coupon.discountPercent) / 100 * 100) / 100;
  }

  const finalAmount = Math.max(0, originalAmount - discount);
  return { discount, finalAmount, coupon };
};

/**
 * Core enrollment logic called after successful payment.
 * Idempotent — safe to call even if enrollment already exists.
 */
const processSuccessfulPayment = async ({
  order, gateway, gatewayTransactionId, metadata = {},
}) => {
  // Mark order as paid
  order.paymentStatus = "completed";
  order.orderStatus = "paid";
  order.gatewayTransactionId = gatewayTransactionId;
  await order.save();

  // Save transaction record
  await Transaction.create({
    order: order._id,
    user: order.user,
    course: order.course,
    amount: order.amount,
    currency: order.currency,
    gateway,
    gatewayTransactionId,
    status: "success",
    metadata,
  });

  // Create enrollment (skip if already enrolled)
  const existing = await Enrollment.findOne({ user: order.user, course: order.course });
  if (!existing) {
    const course = await Course.findById(order.course)
      .select("title teacher pricing")
      .populate("teacher", "name")
      .lean();
    await Enrollment.create({
      user: order.user,
      course: order.course,
      teacher: course?.teacher?._id || course?.teacher,
      payment: {
        amount: order.amount / 100,
        currency: order.currency,
        method: gateway,
        transactionId: gatewayTransactionId,
        couponCode: order.couponCode || "",
        discount: order.couponDiscount || 0,
        status: "completed",
      },
      status: "active",
    });
    await Course.findByIdAndUpdate(order.course, { $inc: { enrollmentCount: 1 } });

    // Fire-and-forget: enrollment email + notification
    (async () => {
      try {
        const student = await User.findById(order.user).select("name email").lean();
        if (!student || !course) return;
        const teacherId = course.teacher?._id || course.teacher;
        await Promise.allSettled([
          sendEnrollmentEmail({
            to: student.email,
            studentName: student.name,
            courseTitle: course.title,
            instructorName: course.teacher?.name || "",
            dashboardUrl: buildClientUrl("/dashboard"),
          }),
          Notification.create({
            title: "Enrollment Confirmed",
            message: `Payment successful! You're now enrolled in "${course.title}".`,
            type: "success",
            targetAudience: "specific",
            targetUsers: [order.user],
            sentBy: teacherId || order.user,
            isActive: true,
          }),
        ]);
      } catch (_) {}
    })();
  }

  // Increment coupon usage
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
  }
};

// ── Public ────────────────────────────────────────────────────────────────────

export const getCheckoutConfig = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  });
});

// ── Coupon ────────────────────────────────────────────────────────────────────

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, courseId } = req.body;
  if (!code || !courseId) throw new ApiError(400, "code and courseId are required");

  const course = await Course.findOne({ _id: courseId, status: "published" }).lean();
  if (!course) throw new ApiError(404, "Course not found");

  const originalAmount = course.pricing?.price || 0;
  if (originalAmount === 0) throw new ApiError(400, "Coupon cannot be applied to a free course");

  const { discount, finalAmount, coupon } = await validateCoupon(code, courseId, originalAmount);

  res.json({
    success: true,
    discount,
    finalAmount,
    originalAmount,
    couponCode: coupon.code,
    discountType: coupon.discountType,
    message: `Coupon applied! You save $${discount.toFixed(2)}`,
  });
});

// ── Stripe ────────────────────────────────────────────────────────────────────

export const createStripeSession = asyncHandler(async (req, res) => {
  const { courseId, couponCode } = req.body;
  if (!courseId) throw new ApiError(400, "courseId is required");

  const course = await Course.findOne({ _id: courseId, status: "published" }).lean();
  if (!course) throw new ApiError(404, "Course not found");

  // Prevent duplicate enrollment
  const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (existing) throw new ApiError(409, "You are already enrolled in this course");

  const originalAmount = course.pricing?.price || 0;

  // Handle free course
  if (originalAmount === 0) {
    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: courseId,
      teacher: course.teacher,
      payment: { amount: 0, currency: "USD", method: "free", status: "completed" },
      status: "active",
    });
    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });
    return res.json({ success: true, free: true, enrollment });
  }

  // Validate coupon
  let discount = 0;
  let finalAmount = originalAmount;
  let appliedCoupon = "";

  if (couponCode) {
    const result = await validateCoupon(couponCode, courseId, originalAmount);
    discount = result.discount;
    finalAmount = result.finalAmount;
    appliedCoupon = result.coupon.code;
  }

  // Prevent duplicate pending order
  await Order.deleteMany({
    user: req.user._id,
    course: courseId,
    orderStatus: "pending",
    paymentMethod: "stripe",
  });

  const order = await Order.create({
    user: req.user._id,
    course: courseId,
    amount: toCents(finalAmount),
    currency: (course.pricing?.currency || "USD").toLowerCase(),
    originalAmount: toCents(originalAmount),
    couponCode: appliedCoupon,
    couponDiscount: toCents(discount),
    paymentMethod: "stripe",
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const { sessionId, sessionUrl } = await createCheckoutSession({
    courseId,
    courseTitle: course.title,
    courseThumbnail: course.thumbnail || undefined,
    amountCents: toCents(finalAmount),
    currency: (course.pricing?.currency || "USD").toLowerCase(),
    userId: req.user._id,
    orderId: order._id,
    successUrl: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${clientUrl}/checkout/cancel?course=${courseId}`,
  });

  // Save session ID to order
  order.stripeSessionId = sessionId;
  await order.save();

  res.json({ success: true, sessionId, sessionUrl });
});

export const verifyStripeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await retrieveCheckoutSession(sessionId);

  if (session.payment_status !== "paid") {
    return res.json({ success: true, paid: false });
  }

  const orderId = session.metadata?.orderId;
  const order = orderId ? await Order.findById(orderId) : null;
  const enrollment = order
    ? await Enrollment.findOne({ user: order.user, course: order.course }).lean()
    : null;

  res.json({ success: true, paid: true, enrollment });
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status !== "paid") {
      return res.json({ received: true });
    }

    const orderId = session.metadata?.orderId;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.json({ received: true });
    }

    const order = await Order.findOne({ _id: orderId, orderStatus: "pending" });
    if (!order) return res.json({ received: true }); // Already processed

    await processSuccessfulPayment({
      order,
      gateway: "stripe",
      gatewayTransactionId: session.payment_intent || session.id,
      metadata: { stripeSessionId: session.id },
    });
  }

  res.json({ received: true });
});

// ── PayPal ────────────────────────────────────────────────────────────────────

export const createPayPalOrder = asyncHandler(async (req, res) => {
  const { courseId, couponCode } = req.body;
  if (!courseId) throw new ApiError(400, "courseId is required");

  const course = await Course.findOne({ _id: courseId, status: "published" }).lean();
  if (!course) throw new ApiError(404, "Course not found");

  const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (existing) throw new ApiError(409, "You are already enrolled in this course");

  const originalAmount = course.pricing?.price || 0;
  if (originalAmount === 0) throw new ApiError(400, "Use the free enrollment endpoint for free courses");

  let discount = 0;
  let finalAmount = originalAmount;
  let appliedCoupon = "";

  if (couponCode) {
    const result = await validateCoupon(couponCode, courseId, originalAmount);
    discount = result.discount;
    finalAmount = result.finalAmount;
    appliedCoupon = result.coupon.code;
  }

  // Clean stale PayPal orders
  await Order.deleteMany({
    user: req.user._id,
    course: courseId,
    orderStatus: "pending",
    paymentMethod: "paypal",
  });

  const order = await Order.create({
    user: req.user._id,
    course: courseId,
    amount: toCents(finalAmount),
    currency: course.pricing?.currency || "USD",
    originalAmount: toCents(originalAmount),
    couponCode: appliedCoupon,
    couponDiscount: toCents(discount),
    paymentMethod: "paypal",
  });

  const paypalData = await createPayPalAPI({
    amountStr: finalAmount.toFixed(2),
    currency: course.pricing?.currency || "USD",
    courseTitle: course.title,
    orderId: order._id,
  });

  order.paypalOrderId = paypalData.id;
  await order.save();

  res.json({ success: true, paypalOrderId: paypalData.id, orderId: order._id });
});

export const capturePayPalOrder = asyncHandler(async (req, res) => {
  const { paypalOrderId, orderId } = req.body;
  if (!paypalOrderId || !orderId) throw new ApiError(400, "paypalOrderId and orderId are required");

  const order = await Order.findOne({ _id: orderId, user: req.user._id, orderStatus: "pending" });
  if (!order) throw new ApiError(404, "Order not found or already processed");

  const captureData = await capturePayPalAPI(paypalOrderId);
  const { status, transactionId } = verifyPayPalCapture(captureData);

  if (status !== "COMPLETED") {
    order.paymentStatus = "failed";
    order.orderStatus = "failed";
    await order.save();
    throw new ApiError(402, "PayPal payment was not completed");
  }

  await processSuccessfulPayment({
    order,
    gateway: "paypal",
    gatewayTransactionId: transactionId,
    metadata: { paypalOrderId },
  });

  const enrollment = await Enrollment.findOne({ user: req.user._id, course: order.course }).lean();
  res.json({ success: true, enrollment });
});

// ── Orders ────────────────────────────────────────────────────────────────────

export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .populate("course", "title thumbnail pricing")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.json({
    success: true,
    orders,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id })
    .populate("course", "title thumbnail pricing category")
    .lean();
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, order });
});
