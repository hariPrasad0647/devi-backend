// src/pages/api/v1/payments/create-order.js
import { runCors } from "../../lib/cors"; // adjust path if your cors helper lives elsewhere
import { getRazorpayInstance } from "../../lib/razorpay";
import connectDB from "../../lib/mongoose";// <--- adjust if needed
import Order from "../../models/Order"; // <--- adjust if needed

export default async function handler(req, res) {
  // CORS and preflight
  try {
    await runCors(req, res);
  } catch (err) {
    console.warn("[create-order] runCors failed, continuing:", err && err.message);
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const {
      amount,
      currency = "INR",
      receipt,
      notes,
      paymentMethod = "razorpay", // "razorpay" | "cod"
      customerId,
      items,
      address,
    } = req.body || {};

    if (amount == null) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    const normalizedPaymentMethod =
      String(paymentMethod || "razorpay").toLowerCase() === "cod" ? "cod" : "razorpay";

    // --- COD flow ---
    if (normalizedPaymentMethod === "cod") {
      try {
        await connectDB();

        const orderDoc = new Order({
          customerId: customerId || null,
          items: Array.isArray(items) ? items : [],
          amount: Number(amount),
          address: address || {},
          paymentMethod: "cod",
          paymentDetails: {},
        });

        await orderDoc.save();

        return res.status(201).json({
          success: true,
          message: "Order created with Cash on Delivery.",
          order: orderDoc,
        });
      } catch (err) {
        console.error("[create-order][cod] DB save failed:", err);
        // still return success so frontend can continue — but note DB save failed
        return res.status(201).json({
          success: true,
          message:
            "Cash on Delivery chosen. Order creation succeeded but DB save failed on server. Contact support.",
          order: null,
        });
      }
    }

    // --- RAZORPAY flow ---
    const razorpay = getRazorpayInstance();

    const options = {
      amount: Math.round(Number(amount) * 100), // rupees -> paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save order in DB with razorpay_order_id
    let savedOrder = null;
    try {
      await connectDB();

      const orderDoc = new Order({
        customerId: customerId || null,
        items: Array.isArray(items) ? items : [],
        amount: Number(amount),
        address: address || {},
        paymentMethod: "razorpay",
        razorpay_order_id: razorpayOrder.id,
        paymentDetails: { razorpayOrder },
      });

      savedOrder = await orderDoc.save();
    } catch (err) {
      // If DB save fails, log it but still return razorpayOrder so frontend can continue
      console.error("[create-order][razorpay] Failed to save order in DB:", err);
    }

    // 🔥 key change: `order` is the Razorpay order (what frontend expects)
    // DB doc is returned as `dbOrder` if you want to use it
    return res.status(200).json({
      success: true,
      message: "Razorpay order created",
      order: razorpayOrder,              // 👈 frontend uses this
      keyId: process.env.RAZORPAY_KEY_ID,
      dbOrder: savedOrder,               // 👈 optional extra
    });
  } catch (err) {
    console.error("[create-order] error:", err);
    return res.status(500).json({ success: false, message: "Failed to create order" });
  }
}
