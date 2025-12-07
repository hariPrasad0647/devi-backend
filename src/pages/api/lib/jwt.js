// src/lib/jwt.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// Create a token for a user
export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(), // subject
      phone: user.phone,
      name: user.name,
    },
    JWT_SECRET,
    {
      expiresIn: "7d", // 7 days token
    }
  );
}

// Verify token and return payload or null
export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
