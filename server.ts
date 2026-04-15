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

function requiredEnv(name: "RAZORPAY_KEY_ID" | "RAZORPAY_KEY_SECRET"): string {
  const value = process.env[name];
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
      res.status(500).json({ error: getOrderErrorMessage(error) });
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
    const checks = {
      RAZORPAY_KEY_ID: Boolean(process.env.RAZORPAY_KEY_ID),
      RAZORPAY_KEY_SECRET: Boolean(process.env.RAZORPAY_KEY_SECRET),
      VITE_RAZORPAY_KEY_ID: Boolean(process.env.VITE_RAZORPAY_KEY_ID),
    };

    const missing = Object.entries(checks)
      .filter(([, present]) => !present)
      .map(([name]) => name);

    res.status(missing.length === 0 ? 200 : 503).json({
      ok: missing.length === 0,
      checks,
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
