import express from "express";
import Razorpay from "razorpay";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const razorpay = new Razorpay({
 key_id: process.env.RAZORPAY_KEY_ID,
key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/api/payment/order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 100,
      currency: "INR",
      receipt: "receipt#1",
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));