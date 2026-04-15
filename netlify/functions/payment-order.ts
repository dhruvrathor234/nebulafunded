import Razorpay from "razorpay";

function requiredEnv(name: "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET"): string {
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
    const keyId = requiredEnv("RAZORPAY_KEY_ID");
    const keySecret = requiredEnv("RAZORPAY_KEY_SECRET");

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const parsedBody = event.body ? JSON.parse(event.body) : {};
    const { amount, currency = "INR", receipt } = parsedBody;

    if (typeof amount !== "number" || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid amount" }),
      };
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(order),
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
};
