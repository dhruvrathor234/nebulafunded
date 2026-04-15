import crypto from "crypto";

function requiredEnv(name: "RAZORPAY_KEY_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const keySecret = requiredEnv("RAZORPAY_KEY_SECRET");
    const parsedBody = event.body ? JSON.parse(event.body) : {};

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsedBody;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Missing payment fields" }),
      };
    }

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto.createHmac("sha256", keySecret).update(sign).digest("hex");

    if (razorpay_signature !== expectedSign) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Invalid signature" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Payment verified successfully" }),
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
