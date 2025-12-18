// src/lib/mailer.js
import nodemailer from "nodemailer";

const smtpUser = process.env.BREVO_SMTP_USER;
const smtpKey = process.env.BREVO_SMTP_PASS; // ✅ correct

const fromEmail = process.env.EMAIL_FROM;

if (!smtpUser || !smtpKey || !fromEmail) {
  console.error(
    "[mailer] Missing SMTP env vars. Got:",
    JSON.stringify(
      {
        BREVO_SMTP_USER: smtpUser,
        BREVO_API_KEY: smtpKey ? "present" : "missing",
        EMAIL_FROM: fromEmail,
      },
      null,
      2
    )
  );
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: smtpUser, // usually your Brevo login email
    pass: smtpKey,  // your xsmtpsib- key
  },
});

export async function sendOtpEmail(to, otp) {
  try {
    const info = await transporter.sendMail({
      from: fromEmail, // e.g. "Devi Pickles <devispicypickles@gmail.com>"
      to,
      subject: "Your Devi Pickles OTP",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });

    console.log("[sendOtpEmail] Email sent:", info.messageId);
  } catch (err) {
    console.error("[sendOtpEmail] Failed to send OTP email:", err);
    throw err;
  }
}
