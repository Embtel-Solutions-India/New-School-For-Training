import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  applyCoupon,
  capturePayPalOrder,
  createPayPalOrder,
  createStripeSession,
  getCheckoutConfig,
  getMyOrders,
  getOrderById,
  stripeWebhook,
  verifyStripeSession,
} from "../controllers/checkoutController.js";

const router = express.Router();

// ── Public
router.get("/config", getCheckoutConfig);

// ── Stripe webhook — raw body is set in app.js BEFORE the JSON middleware
router.post("/webhook/stripe", stripeWebhook);

// ── Authenticated routes
router.use(protect);

router.post("/stripe/create-session", createStripeSession);
router.get("/stripe/verify/:sessionId", verifyStripeSession);

router.post("/paypal/create-order", createPayPalOrder);
router.post("/paypal/capture", capturePayPalOrder);

router.post("/coupon/apply", applyCoupon);

router.get("/orders", getMyOrders);
router.get("/orders/:orderId", getOrderById);

export default router;
