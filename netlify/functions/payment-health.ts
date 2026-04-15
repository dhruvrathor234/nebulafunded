export const handler = async (event: any) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
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

  const backendKeyId = normalizeKeyId(process.env.RAZORPAY_KEY_ID);
  const frontendKeyId = normalizeKeyId(process.env.VITE_RAZORPAY_KEY_ID);

  const consistency = {
    backendKeyIdFingerprint: getKeyFingerprint(backendKeyId),
    frontendKeyIdFingerprint: getKeyFingerprint(frontendKeyId),
    backendMode: getKeyMode(backendKeyId),
    frontendMode: getKeyMode(frontendKeyId),
    keyIdMatchesFrontend: Boolean(backendKeyId && frontendKeyId && backendKeyId === frontendKeyId),
  };

  const missing = Object.entries(checks)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  return {
    statusCode: missing.length === 0 ? 200 : 503,
    body: JSON.stringify({
      ok: missing.length === 0,
      checks,
      diagnostics,
      consistency,
      missing,
      service: "payment",
    }),
  };
};

function normalizeKeyId(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getKeyFingerprint(value: string): string | null {
  if (!value) {
    return null;
  }
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function getKeyMode(value: string): "test" | "live" | "unknown" {
  if (value.startsWith("rzp_test_")) {
    return "test";
  }
  if (value.startsWith("rzp_live_")) {
    return "live";
  }
  return "unknown";
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
