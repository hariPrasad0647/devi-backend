// src/pages/api/v1/account/address.js
import connectDB from "../../lib/mongoose";
import Customer from "../../models/Customer"; // adjust if needed
import { runCors } from "../../lib/cors"; // adjust if needed

export default async function handler(req, res) {
  try {
    // CORS + preflight
    await runCors(req, res);
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const { customerId, address } = req.body || {};

    if (!address || !address.line1 || !address.city || !address.pincode || !address.phone) {
      return res.status(400).json({ success: false, message: "Incomplete address" });
    }

    // require customerId for now (or derive from JWT if you add auth)
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message:
          "customerId is required in request body when not using server-side auth. Prefer deriving from JWT.",
      });
    }

    await connectDB();

    const cust = await Customer.findById(customerId);
    if (!cust) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (!Array.isArray(cust.addresses)) {
      cust.addresses = [];
    }

    const newAddr = {
      name: address.name || cust.name || "",
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      pincode: address.pincode,
    };

    cust.addresses.push(newAddr);
    await cust.save();

    return res.status(201).json({ success: true, message: "Address saved", address: newAddr });
  } catch (err) {
    console.error("[account/address] error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
