// src/models/OtpSession.js
import mongoose from "mongoose";

const OtpSessionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const OtpSession =
  mongoose.models.OtpSession || mongoose.model("OtpSession", OtpSessionSchema);

export default OtpSession;
