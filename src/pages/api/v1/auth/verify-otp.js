// src/pages/api/v1/auth/verify-otp.js
import { runCors } from "../../lib/cors";
import connectDB from "../../lib/mongoose";
import User from "../../models/Customer";
import { signAuthToken } from "../../lib/jwt";

const DEBUG = true; // turn true while debugging locally ONLY

export default async function handler(req, res) {
  await runCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    // log incoming body
    if (DEBUG) console.log("[verify-otp] req.body:", req.body);

    const { email, otp } = req.body || {};

    if (!email || !otp) {
      if (DEBUG) console.warn("[verify-otp] missing email or otp", { email, otp });
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
        debug: { receivedEmail: email ?? null, receivedOtp: otp ?? null }
      });
    }

    const cleanedEmail = String(email).trim().toLowerCase();
    const cleanedOtp = String(otp).trim();

    if (DEBUG) console.log("[verify-otp] cleaned values", { cleanedEmail, cleanedOtp });

    const user = await User.findOne({ email: cleanedEmail }).lean();

    if (!user) {
      if (DEBUG) console.warn("[verify-otp] user not found for", cleanedEmail);
      return res.status(404).json({ success: false, message: "Account not found. Please sign up first." });
    }

    const storedOtp = user.otp ?? null;
    const storedExpiryRaw = user.otpExpiresAt ?? null;
    const storedExpiry = storedExpiryRaw ? new Date(storedExpiryRaw) : null;

    if (DEBUG) console.log("[verify-otp] stored", { storedOtp, storedExpiryRaw, storedExpiryType: storedExpiry ? typeof storedExpiry : null });

    if (!storedOtp || !storedExpiryRaw) {
      return res.status(400).json({
        success: false,
        message: "OTP not requested or already used. Please request a new one.",
        debug: { storedOtpPresent: !!storedOtp, storedExpiryRaw }
      });
    }

    if (!storedExpiry || isNaN(storedExpiry.getTime())) {
      console.error("[verify-otp] invalid expiry:", storedExpiryRaw);
      return res.status(500).json({ success: false, message: "Server error (invalid OTP expiry). Please request a new OTP." });
    }

    if (storedExpiry.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (String(storedOtp).trim() !== cleanedOtp) {
      if (DEBUG) console.warn("[verify-otp] otp mismatch", { provided: cleanedOtp, stored: storedOtp });
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // clear otp atomically
    await User.findByIdAndUpdate(user._id, { $unset: { otp: "", otpExpiresAt: "" } });

    const token = signAuthToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
      token
    });
  } catch (err) {
    console.error("[v1/verify-otp] error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
}
