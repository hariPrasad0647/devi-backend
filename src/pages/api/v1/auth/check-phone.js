// src/pages/api/v1/auth/check-phone.js
import { runCors } from "../../lib/cors";
import connectDB from "../../lib/mongoose";
import User from "../../models/Customer";

export default async function handler(req, res) {
  await runCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { phone } = req.body || {};

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const cleanedPhone = String(phone).trim();

    const user = await User.findOne({ phone: cleanedPhone });

    if (user) {
      return res.status(200).json({
        success: true,
        exists: true,
        name: user.name || null,
        message: "User already registered. Proceed to login.",
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      name: null,
      message: "User not found. Proceed to signup.",
    });
  } catch (err) {
    console.error("[check-phone] error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
}
