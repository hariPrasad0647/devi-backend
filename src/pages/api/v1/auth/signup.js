// src/pages/api/v1/auth/signup.js
import { runCors } from "../../lib/cors";
import connectDB from "../../lib/mongoose";
import Customer from "../../models/Customer"; // email-based schema
import OtpSession from "../../models/OtpSession";
import { signAuthToken } from "../../lib/jwt";

export default async function handler(req, res) {
  // CORS for localhost:3001 → 3000
  await runCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { name, email, otp } = req.body || {};

    if (!name || !email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name, email and OTP are required",
      });
    }

    const cleanedEmail = String(email).trim().toLowerCase();
    const trimmedName = String(name).trim();
    const trimmedOtp = String(otp).trim();
    const now = new Date();

    // 1️⃣ Check if user already fully registered
    let existingUser = await Customer.findOne({ email: cleanedEmail });

    if (existingUser && existingUser.name) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered. Please login instead.",
      });
    }

    // 2️⃣ Look up OTP in OtpSession (signup flow)
    const session = await OtpSession.findOne({ email: cleanedEmail });

    if (!session || !session.otp || !session.otpExpiresAt) {
      return res.status(404).json({
        success: false,
        message: "No OTP session found. Please request OTP again.",
      });
    }

    if (session.otpExpiresAt < now) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (session.otp !== trimmedOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 3️⃣ OTP valid → create or complete user
    let userDoc;

    if (existingUser) {
      // partially created user without name
      existingUser.name = trimmedName;
      userDoc = await existingUser.save();
    } else {
      userDoc = await Customer.create({
        name: trimmedName,
        email: cleanedEmail,
      });
    }

    // 4️⃣ Clean up OTP session
    await OtpSession.deleteOne({ _id: session._id });

    // 5️⃣ Issue JWT
    const token = signAuthToken(userDoc);

    return res.status(200).json({
      success: true,
      message: "Signup successful",
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
      },
      token,
    });
  } catch (err) {
    console.error("[signup] error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Signup failed",
    });
  }
}
