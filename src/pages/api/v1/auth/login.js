// src/app/api/auth/signup/route.js
import connectDB from "../../lib/mongoose";
import Customer from "../../models/Customer";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { name, phone, otp } = body;

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Phone and OTP are required",
        }),
        { status: 400 }
      );
    }

    const cleanedPhone = String(phone).replace(/\s+/g, "");

    const user = await Customer.findOne({ phone: cleanedPhone });

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User / OTP session not found. Please request OTP again.",
        }),
        { status: 404 }
      );
    }

    if (!user.otp || !user.otpExpiresAt) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No OTP generated. Please request OTP again.",
        }),
        { status: 400 }
      );
    }

    const now = new Date();
    if (now > user.otpExpiresAt) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "OTP expired. Please request a new one.",
        }),
        { status: 400 }
      );
    }

    if (String(otp).trim() !== user.otp) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid OTP",
        }),
        { status: 400 }
      );
    }

    // OTP is correct – finalize user data
    if (name && name.trim() && user.name !== name.trim()) {
      user.name = name.trim();
    }

    // clear OTP fields so they can’t be reused
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Signup / login successful",
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("signup error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Signup failed",
      }),
      { status: 500 }
    );
  }
}
