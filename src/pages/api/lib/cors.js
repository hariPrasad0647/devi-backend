// src/lib/cors.js
import Cors from "cors";

// This helper lets us use cors() in Next.js API routes
export function runCors(req, res) {
  return new Promise((resolve, reject) => {
    Cors({
      origin: "http://localhost:3001", // your frontend origin
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
