// src/models/Customer.js
import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const CustomerSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, required: true },
    phone: String,
    addresses: [AddressSchema],

    // --------------------
    // OTP fields for login
    // --------------------
    otp: { type: String },            // store plain OTP (or hashed if you change logic)
    otpExpiresAt: { type: Date },     // expiry time for the OTP
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
