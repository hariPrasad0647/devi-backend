// src/pages/api/v1/userAccount/account.js

import connectDB from "../../lib/mongoose";// adjust if needed
import Customer from "../../models/Customer";
import Order from "../../models/Order";
import { verifyAuthToken } from "../../lib/jwt";
import { runCors } from "../../lib/cors"; // 👈 use your CORS helper

export default async function handler(req, res) {
  try {
    // 1) Run CORS for every request
    await runCors(req, res);

    // 2) Handle preflight OPTIONS quickly
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // 3) Allow only GET
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    await connectDB();

    // 4) Read token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Auth token not provided" });
    }

    // 5) Verify token
    const payload = verifyAuthToken(token);
    if (!payload) {
      console.error("[userAccount/account] Invalid or expired token");
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const customerId = payload.sub;
    if (!customerId) {
      console.error(
        "[userAccount/account] No 'sub' in token payload:",
        payload
      );
      return res
        .status(401)
        .json({ success: false, message: "Invalid token payload" });
    }

    // 6) Load customer
    const customer = await Customer.findById(customerId).lean();
    if (!customer) {
      console.error(
        "[userAccount/account] Customer not found for id:",
        customerId
      );
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    // 7) Load orders
    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .lean();

    const userData = {
      id: customer._id,
      name: customer.name || payload.name || "",
      email: customer.email || "",
      phone: customer.phone || payload.phone || "",
    };

    return res.status(200).json({
      success: true,
      user: userData,
      addresses: customer.addresses || [],
      orders,
    });
  } catch (err) {
    console.error("[userAccount/account] Failed to load account:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
