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

function getRazorpayClient() {
  const keyIdRaw = process.env.RAZORPAY_KEY_ID;
  const keySecretRaw = process.env.RAZORPAY_KEY_SECRET;

  if (!keyIdRaw || !keySecretRaw) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
  }

  const keyId = normalizeEnvValue(keyIdRaw);
  const keySecret = normalizeEnvValue(keySecretRaw);

  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, currency = "INR", receipt } = req.body ?? {};

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res.status(500).json({
      error: getOrderErrorMessage(error),
      details: getOrderErrorDetails(error),
    });
  }
}
