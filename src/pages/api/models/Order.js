// models/Order.js
import mongoose from "mongoose";

// Each item in an order
const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

// Address inside an order (snapshot of delivery address)
const OrderAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

// Main Order schema
const OrderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    items: {
      type: [OrderItemSchema],
      required: true,
    },

    amount: { type: Number, required: true },

    // snapshot of user's delivery address
    address: {
      type: OrderAddressSchema,
      required: true,
    },

    /*
      paymentStatus:
        - pending: order created but not paid (or waiting for payment confirmation)
        - paid: payment received
        - failed: payment failed
        - cod_pending: created with Cash on Delivery, payment pending until delivery
    */
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cod_pending"],
      default: "pending",
    },

    /*
      paymentMethod:
        - 'razorpay' (existing online flow)
        - 'cod' (cash on delivery)
      Keep the existing 'razorpay' default for backwards compatibility.
    */
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      default: "razorpay",
    },

    // convenience boolean (useful for queries)
    cashOnDelivery: {
      type: Boolean,
      default: false,
    },

    // Generic place to store payment gateway meta (optional)
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Razorpay fields — required only when paymentMethod is 'razorpay'
    razorpay_order_id: {
      type: String,
      required: function () {
        return this.paymentMethod === "razorpay";
      },
    },
    razorpay_payment_id: {
      type: String,
      required: function () {
        return this.paymentMethod === "razorpay";
      },
    },
    razorpay_signature: {
      type: String,
      required: function () {
        return this.paymentMethod === "razorpay";
      },
    },
  },
  { timestamps: true }
);

// Pre-save hook to keep cashOnDelivery synced with paymentMethod
OrderSchema.pre("save", function () {
  if (this.paymentMethod === "cod") {
    this.cashOnDelivery = true;
    // If COD created, set paymentStatus to cod_pending if still 'pending'
    if (!this.paymentStatus || this.paymentStatus === "pending") {
      this.paymentStatus = "cod_pending";
    }
  } else {
    this.cashOnDelivery = false;
  }
});



export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
