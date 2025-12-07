// src/pages/api/auth/otp-login.js
import connectDB from "../../lib/mongoose";
import User from "../../models/Customer";
import { runCors } from "../../lib/cors";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await runCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    await connectDB();

    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const cleanedEmail = String(email).trim().toLowerCase();
    const trimmedOtp = String(otp).trim();

    const userDoc = await User.findOne({ email: cleanedEmail });

    if (!userDoc || !userDoc.name) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }

    if (!userDoc.otp || !userDoc.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message:
          "OTP not generated or already used. Please request OTP again.",
      });
    }

    if (userDoc.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (userDoc.otp !== trimmedOtp) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
      });
    }

    userDoc.otp = undefined;
    userDoc.otpExpiresAt = undefined;
    await userDoc.save();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[otp-login] Missing JWT_SECRET env var");
    }

    const token = jwt.sign(
      { id: userDoc._id.toString(), email: userDoc.email },
      secret || "dev-secret",
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userDoc,
    });
  } catch (err) {
    console.error("[otp-login] error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  }
}
