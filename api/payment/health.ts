export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const checks = {
    RAZORPAY_KEY_ID: Boolean(process.env.RAZORPAY_KEY_ID),
    RAZORPAY_KEY_SECRET: Boolean(process.env.RAZORPAY_KEY_SECRET),
    VITE_RAZORPAY_KEY_ID: Boolean(process.env.VITE_RAZORPAY_KEY_ID),
  };

  const missing = Object.entries(checks)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  return res.status(missing.length === 0 ? 200 : 503).json({
    ok: missing.length === 0,
    checks,
    missing,
    service: "payment",
  });
}
