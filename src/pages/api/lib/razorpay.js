// src/lib/razorpay.js
import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    "⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set – Razorpay may not work."
  );
}

export function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}
