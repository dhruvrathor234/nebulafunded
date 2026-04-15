import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function analyzeEnvValue(value: string | undefined) {
  if (!value) {
    return {
      present: false,
      hasLeadingOrTrailingWhitespace: false,
      hasWrappingQuotes: false,
      hasHiddenCharacters: false,
    };
  }

  const cleaned = stripInvisibleChars(value);
  const trimmed = cleaned.trim();
  return {
    present: trimmed.length > 0,
    hasLeadingOrTrailingWhitespace: trimmed !== value,
    hasWrappingQuotes:
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")),
    hasHiddenCharacters: cleaned !== value,
  };
}

function normalizeKeyId(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = stripInvisibleChars(value).trim();
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const razorpayKeyId = requiredEnv("RAZORPAY_KEY_ID");
  const razorpayKeySecret = requiredEnv("RAZORPAY_KEY_SECRET");

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  // API Routes
  app.post("/api/payment/order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      const options = {
        amount: amount * 100, // amount in the smallest currency unit (paise for INR)
        currency,
        receipt,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({
        error: getOrderErrorMessage(error),
        details: getOrderErrorDetails(error),
      });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature === expectedSign) {
        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/payment/health", (req, res) => {
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

    res.status(missing.length === 0 ? 200 : 503).json({
      ok: missing.length === 0,
      checks,
      diagnostics,
      consistency,
      missing,
      service: "payment",
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
