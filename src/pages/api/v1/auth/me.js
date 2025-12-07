// src/pages/api/v1/auth/me.js
import { runCors } from "../../lib/cors";
import connectDB from "../../lib/mongoose";
import User from "../../models/Customer";
import { verifyAuthToken } from "../../lib/jwt";

export default async function handler(req, res) {
  await runCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  try {
    await connectDB();

    const user = await User.findById(payload.sub).select("name email");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("[me] error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
}
