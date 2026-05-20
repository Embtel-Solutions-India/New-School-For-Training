import API from "./api";

// ── Admin payment settings (existing)
export const paymentApi = {
  getSettings: () => API.get("/payments/settings"),
  updateSettings: (payload) => API.patch("/payments/settings", payload),
  getFinancialDashboard: () => API.get("/payments/financial-dashboard"),
  updateCoursePricing: (courseId, pricing) =>
    API.patch(`/payments/courses/${courseId}/pricing`, { pricing }),

  // ── Checkout config (public keys)
  getCheckoutConfig: () => API.get("/checkout/config"),

  // ── Coupon
  applyCoupon: (code, courseId) => API.post("/checkout/coupon/apply", { code, courseId }),

  // ── Stripe
  createStripeSession: ({ courseId, couponCode }) =>
    API.post("/checkout/stripe/create-session", { courseId, couponCode }),
  verifyStripeSession: (sessionId) => API.get(`/checkout/stripe/verify/${sessionId}`),

  // ── PayPal
  createPayPalOrder: ({ courseId, couponCode }) =>
    API.post("/checkout/paypal/create-order", { courseId, couponCode }),
  capturePayPalOrder: ({ paypalOrderId, orderId }) =>
    API.post("/checkout/paypal/capture", { paypalOrderId, orderId }),

  // ── Orders
  getMyOrders: (params) => API.get("/checkout/orders", { params }),
  getOrderById: (orderId) => API.get(`/checkout/orders/${orderId}`),
};

export default paymentApi;
