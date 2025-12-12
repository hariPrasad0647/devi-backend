// src/pages/api/v1/auth/login.js

import { runCors } from "../../lib/cors";       // ✅ add this
import connectDB from "../../lib/mongoose";
import Customer from "../../models/Customer";

export default async function handler(req, res) {
  // ✅ Apply CORS first
  await runCors(req, res);

  // ✅ Handle OPTIONS for preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { phone, otp } = req.body || {};

    if (!phone || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Phone and OTP are required" });
    }

    const cleanedPhone = String(phone).replace(/\s+/g, "");
    const user = await Customer.findOne({ phone: cleanedPhone });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User / OTP session not found" });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No OTP generated. Please request OTP again.",
      });
    }

    const now = new Date();
    if (now > user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (String(otp).trim() !== user.otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // clear OTP after successful login
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("[login handler] error:", err);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}
