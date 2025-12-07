// src/pages/api/v1/auth/send-otp.js
import { runCors } from "../../lib/cors";
import connectDB from "../../lib/mongoose";
import User from "../../models/Customer";
import OtpSession from "../../models/OtpSession";
import { sendOtpEmail } from "../../lib/mailer";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit string
}

export default async function handler(req, res) {
  await runCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { email, name } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const cleanedEmail = String(email).trim().toLowerCase();
    const now = new Date();

    const existingUser = await User.findOne({ email: cleanedEmail });

    // --- CASE 1: EXISTING USER → LOGIN OTP (stored on user document) ---
    if (existingUser) {
      let otp = existingUser.otp;
      let otpExpiresAt = existingUser.otpExpiresAt;

      // if no OTP or expired -> generate new
      if (!otp || !otpExpiresAt || new Date(otpExpiresAt) <= now) {
        otp = generateOtp();
        otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

        existingUser.otp = otp;
        existingUser.otpExpiresAt = otpExpiresAt;

        // IMPORTANT: persist changes
        await existingUser.save();

        // Log (dev) - remove or reduce in production
        if (process.env.NODE_ENV === "development") {
          console.log("[send-otp] saved otp on user:", {
            id: existingUser._id,
            email: existingUser.email,
            otp: existingUser.otp,
            otpExpiresAt: existingUser.otpExpiresAt,
          });
        }
      }

      // always (re)send the OTP email
      try {
        await sendOtpEmail(cleanedEmail, otp);
      } catch (mailErr) {
        console.error("[send-otp] sendOtpEmail error:", mailErr);
        // do NOT fail the entire request for email send errors; still return success so user can try again
      }

      return res.status(200).json({
        success: true,
        exists: true,
        message: "Login OTP sent to your email.",
        debugOtp: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    }

    // --- CASE 2: NEW USER → SIGNUP OTP (stored in OtpSession collection) ---
    let session = await OtpSession.findOne({ email: cleanedEmail });

    let otp = session?.otp;
    let otpExpiresAt = session?.otpExpiresAt;

    if (!otp || !otpExpiresAt || new Date(otpExpiresAt) <= now) {
      otp = generateOtp();
      otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

      session = await OtpSession.findOneAndUpdate(
        { email: cleanedEmail },
        { otp, otpExpiresAt },
        { upsert: true, new: true }
      );

      if (process.env.NODE_ENV === "development") {
        console.log("[send-otp] saved otp in OtpSession:", {
          email: session.email,
          otp: session.otp,
          otpExpiresAt: session.otpExpiresAt,
        });
      }
    }

    // always (re)send the OTP email
    try {
      await sendOtpEmail(cleanedEmail, otp);
    } catch (mailErr) {
      console.error("[send-otp] sendOtpEmail error (signup):", mailErr);
    }

    return res.status(200).json({
      success: true,
      exists: false,
      message: "Signup OTP sent to your email.",
      debugOtp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (err) {
    console.error("[send-otp] error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}
