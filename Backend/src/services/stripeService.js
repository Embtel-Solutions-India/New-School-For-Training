import Stripe from "stripe";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });
};

/**
 * Create a Stripe Checkout Session for a course purchase.
 * Amount must be in cents (e.g. $29.99 → 2999).
 */
export const createCheckoutSession = async ({
  courseId,
  courseTitle,
  courseThumbnail,
  amountCents,
  currency = "usd",
  userId,
  orderId,
  successUrl,
  cancelUrl,
}) => {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: courseTitle,
            ...(courseThumbnail ? { images: [courseThumbnail] } : {}),
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { courseId: courseId.toString(), userId: userId.toString(), orderId: orderId.toString() },
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  });

  return { sessionId: session.id, sessionUrl: session.url };
};

/**
 * Retrieve a checkout session to verify payment status.
 */
export const retrieveCheckoutSession = async (sessionId) => {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
};

/**
 * Construct and verify a Stripe webhook event from raw body + signature.
 */
export const constructWebhookEvent = (rawBody, signature) => {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
};
