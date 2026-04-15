export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const diagnostics = {
    RAZORPAY_KEY_ID: analyzeEnvValue(process.env.RAZORPAY_KEY_ID),
    RAZORPAY_KEY_SECRET: analyzeEnvValue(process.env.RAZORPAY_KEY_SECRET),
    VITE_RAZORPAY_KEY_ID: analyzeEnvValue(process.env.VITE_RAZORPAY_KEY_ID),
  };

  const checks = {
    RAZORPAY_KEY_ID: diagnostics.RAZORPAY_KEY_ID.present,
    RAZORPAY_KEY_SECRET: diagnostics.RAZORPAY_KEY_SECRET.present,
    VITE_RAZORPAY_KEY_ID: diagnostics.VITE_RAZORPAY_KEY_ID.present,
  };

  const missing = Object.entries(checks)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  return res.status(missing.length === 0 ? 200 : 503).json({
    ok: missing.length === 0,
    checks,
    diagnostics,
    missing,
    service: "payment",
  });
}

function analyzeEnvValue(value: string | undefined) {
  if (!value) {
    return {
      present: false,
      hasLeadingOrTrailingWhitespace: false,
      hasWrappingQuotes: false,
    };
  }

  const trimmed = value.trim();
  return {
    present: trimmed.length > 0,
    hasLeadingOrTrailingWhitespace: trimmed !== value,
    hasWrappingQuotes:
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")),
  };
}
