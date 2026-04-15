export const handler = async (event: any) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const checks = {
    RAZORPAY_KEY_ID: Boolean(process.env.RAZORPAY_KEY_ID),
    RAZORPAY_KEY_SECRET: Boolean(process.env.RAZORPAY_KEY_SECRET),
    VITE_RAZORPAY_KEY_ID: Boolean(process.env.VITE_RAZORPAY_KEY_ID),
  };

  const missing = Object.entries(checks)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  return {
    statusCode: missing.length === 0 ? 200 : 503,
    body: JSON.stringify({
      ok: missing.length === 0,
      checks,
      missing,
      service: "payment",
    }),
  };
};
