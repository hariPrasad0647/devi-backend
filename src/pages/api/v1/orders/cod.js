// pages/api/v1/orders/cod.js
import connectDB from "../../lib/mongoose";
import Order from "../../models/Order";
import { runCors } from "../../lib/cors"; // <-- your cors helper

export default async function handler(req, res) {
  // --- USE YOUR CORS HELPER ---
  await runCors(req, res); // <-- added

  // --- Only allow POST ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.warn(
      "[COD_ORDER] Method not allowed:",
      req.method,
      "from",
      req.headers.origin
    );
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    const { customerId, items, amount, address } = req.body;

    console.log("[COD_ORDER] Incoming body:", {
      customerId,
      itemsCount: Array.isArray(items) ? items.length : 0,
      amount,
      address,
    });

    // Basic validation
    if (!customerId) {
      console.error("[COD_ORDER] Missing customerId");
      return res
        .status(400)
        .json({ success: false, message: "customerId is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error("[COD_ORDER] Missing items");
      return res
        .status(400)
        .json({ success: false, message: "At least one item is required" });
    }

    if (!amount || typeof amount !== "number") {
      console.error("[COD_ORDER] Invalid amount", amount);
      return res
        .status(400)
        .json({ success: false, message: "Valid amount is required" });
    }

    if (!address) {
      console.error("[COD_ORDER] Missing address");
      return res
        .status(400)
        .json({ success: false, message: "address is required" });
    }

    const { name, phone, line1, city, pincode } = address;

    if (!name || !phone || !line1 || !city || !pincode) {
      console.error("[COD_ORDER] Incomplete address:", address);
      return res.status(400).json({
        success: false,
        message:
          "Address must include name, phone, line1, city, and pincode",
      });
    }

    // Create COD order
    const orderPayload = {
      customerId,
      items,
      amount,
      address: {
        name,
        phone,
        line1,
        line2: address.line2 || "",
        city,
        pincode,
      },
      paymentMethod: "cod",
    };

    console.log("[COD_ORDER] Creating order with payload:", orderPayload);

    const order = await Order.create(orderPayload);

    console.log("[COD_ORDER] Order created:", order._id.toString());

    return res.status(200).json({
      success: true,
      message: "COD order created successfully",
      order,
    });
  } catch (err) {
    console.error("[COD_ORDER] Error while creating COD order:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create COD order",
      error: err.message,
    });
  }
}
