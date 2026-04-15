import Razorpay from "razorpay";

function stripInvisibleChars(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");
}

function normalizeEnvValue(value: string): string {
  const cleaned = stripInvisibleChars(value);
  const trimmed = cleaned.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function requiredEnv(name: "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET"): string {
  const raw = process.env[name];
  if (!raw) {
    throw new Error(`Missing ${name}`);
  }

  const value = normalizeEnvValue(raw);
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function getOrderErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const candidate = error as any;
  return (
    candidate?.error?.description ||
    candidate?.error?.reason ||
    candidate?.description ||
    candidate?.message ||
    "Failed to create order"
  );
}

function getOrderErrorDetails(error: unknown) {
  const candidate = error as any;
  return {
    code: candidate?.error?.code || candidate?.code || null,
    reason: candidate?.error?.reason || candidate?.reason || null,
    source: candidate?.error?.source || candidate?.source || null,
    step: candidate?.error?.step || candidate?.step || null,
  };
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
    const message = getOrderErrorMessage(error);
    const details = getOrderErrorDetails(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message, details }),
    };
  }
};
