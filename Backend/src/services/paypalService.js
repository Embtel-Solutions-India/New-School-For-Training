import axios from "axios";

const BASE_URL =
  process.env.PAYPAL_MODE === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

/**
 * Get a short-lived PayPal OAuth access token.
 */
const getAccessToken = async () => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    throw new Error("PayPal credentials are not configured");
  }

  const { data } = await axios.post(
    `${BASE_URL}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: { username: process.env.PAYPAL_CLIENT_ID, password: process.env.PAYPAL_SECRET },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  return data.access_token;
};

/**
 * Create a PayPal Order.
 * Amount should be a dollar string, e.g. "29.99".
 */
export const createPayPalOrder = async ({ amountStr, currency = "USD", courseTitle, orderId }) => {
  const token = await getAccessToken();

  const { data } = await axios.post(
    `${BASE_URL}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId.toString(),
          description: courseTitle,
          amount: { currency_code: currency, value: amountStr },
        },
      ],
    },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );

  return data; // { id, status, links }
};

/**
 * Capture a PayPal Order after user approves it.
 */
export const capturePayPalOrder = async (paypalOrderId) => {
  const token = await getAccessToken();

  const { data } = await axios.post(
    `${BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
    {},
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );

  return data; // { id, status, purchase_units }
};

/**
 * Verify a captured PayPal Order — returns the captured amount and transaction ID.
 */
export const verifyPayPalCapture = (captureData) => {
  const unit = captureData.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];

  return {
    status: captureData.status,               // "COMPLETED"
    transactionId: capture?.id || "",
    amount: parseFloat(capture?.amount?.value || "0"),
    currency: capture?.amount?.currency_code || "USD",
    referenceId: unit?.reference_id || "",    // our orderId
  };
};
