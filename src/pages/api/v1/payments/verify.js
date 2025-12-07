// src/pages/api/v1/payments/verify.js
import crypto from "crypto";
import { runCors } from "../../lib/cors";         // adjust path if needed
import connectDB from "../../lib/mongoose";      // adjust path if needed
import Order from "../../models/Order";          // adjust path if needed

export default async function handler(req, res) {
  // --- CORS + preflight ---
  try {
    await runCors(req, res);
  } catch (err) {
    console.warn("[payments/verify] runCors failed, continuing:", err?.message);
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerId,
      items,
      amount,
      address,
      paymentDetails,
    } = req.body || {};

    // --- basic validation ---
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("[payments/verify] Missing required Razorpay fields", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment details.",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error(
        "[payments/verify] RAZORPAY_KEY_SECRET is not configured in env"
      );
      return res.status(500).json({
        success: false,
        message: "Payment configuration error on server.",
      });
    }

    // --- verify signature ---
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[payments/verify] Signature mismatch", {
        expectedSignature,
        razorpay_signature,
      });
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature." });
    }

    // At this point payment is VERIFIED with Razorpay key.
    // Now we update/save our Order in MongoDB.

    await connectDB();

    // Try to find an existing order created in /create-order
    let orderDoc = await Order.findOne({ razorpay_order_id }).exec();

    // common fields we want to set
    const baseFields = {
      customerId: customerId || orderDoc?.customerId || null,
      items: Array.isArray(items) && items.length ? items : orderDoc?.items || [],
      amount:
        typeof amount === "number"
          ? amount
          : orderDoc?.amount || 0,
      address: address || orderDoc?.address || {},
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentDetails: {
        ...(orderDoc?.paymentDetails || {}),
        ...(paymentDetails || {}),
        razorpay: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
        },
      },
    };

    try {
      if (orderDoc) {
        // Update existing order
        Object.assign(orderDoc, baseFields);
      } else {
        // No pre-created order (fallback) – create a fresh one
        orderDoc = new Order(baseFields);
      }

      await orderDoc.save();

      console.log(
        "[payments/verify] Payment verified and order saved:",
        orderDoc._id.toString()
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified and order saved.",
        order: orderDoc,
      });
    } catch (err) {
      // IMPORTANT: Payment is VERIFIED, but DB save failed.
      // We still return success: true so frontend does not treat it as payment failure.
      console.error(
        "[payments/verify] Payment verified but failed to save order:",
        err
      );
      return res.status(200).json({
        success: true,
        message:
          "Payment verified but order save failed. Please contact support with your payment id.",
        order: null,
      });
    }
  } catch (err) {
    console.error("[payments/verify] error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify payment" });
  }
}
