const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🔐 ENV variables use karo (hardcode nahi)
const razorpay = new Razorpay({
  key_id: process.env.rzp_live_SVW1H9xlRqsscV,
  key_secret: process.env.bRxXoa1r2XzPCkzlwktQwHAz,
});

app.post("/api/payment/order", async (req, res) => {
  try {
    const options = {
      amount: 100, // ₹1
      currency: "INR",
      receipt: "order_rcptid_11",
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));