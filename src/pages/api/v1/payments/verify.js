// src/pages/api/v1/payments/verify.js
import crypto from "crypto";
import nodemailer from "nodemailer";
import { runCors } from "../../lib/cors"; // adjust path if needed
import connectDB from "../../lib/mongoose"; // adjust path if needed
import Order from "../../models/Order"; // adjust path if needed

export default async function handler(req, res) {
  // --- CORS + preflight ---
  try {
    await runCors(req, res);
  } catch (err) {
    console.warn("[payments/verify] runCors failed, continuing:", err?.message);
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  // --- Setup: detect available Brevo creds and prepare smtpTransporter if possible ---
  // Accept multiple env patterns:
  // - BREVO_API_KEY (REST) -> should begin with xkeysib-....
  // - BREVO_API_KEY (if it begins with xsmtpsib-...) -> treat as SMTP password
  // - BREVO_SMTP_USER + BREVO_SMTP_PASS -> explicit SMTP
  let smtpTransporter = null;
  try {
    const restKey = process.env.BREVO_API_KEY; // could be REST key (xkeysib-) or SMTP key (xsmtpsib-)
    const explicitSmtpUser = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
    const explicitSmtpPass = process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS;

    // If explicit SMTP creds provided use them
    if (explicitSmtpUser && explicitSmtpPass) {
      smtpTransporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
        port: Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587),
        secure:
          (process.env.BREVO_SMTP_SECURE === "true") ||
          (process.env.SMTP_SECURE === "true") ||
          false,
        auth: {
          user: explicitSmtpUser,
          pass: explicitSmtpPass,
        },
      });

      smtpTransporter.verify().catch((err) => {
        console.warn("[payments/verify] SMTP transporter verify failed:", err?.message || err);
      });
    } else if (restKey && restKey.startsWith("xsmtpsib-") && explicitSmtpUser) {
      // You put an SMTP key into BREVO_API_KEY (xsmtpsib-...). Use it as password with the SMTP user.
      smtpTransporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
        port: Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587),
        secure:
          (process.env.BREVO_SMTP_SECURE === "true") ||
          (process.env.SMTP_SECURE === "true") ||
          false,
        auth: {
          user: explicitSmtpUser,
          pass: restKey, // use the xsmtpsib- token as SMTP password
        },
      });

      smtpTransporter.verify().catch((err) => {
        console.warn("[payments/verify] SMTP transporter verify failed (using BREVO_API_KEY as SMTP password):", err?.message || err);
      });
    } else {
      // no SMTP transporter configured; we'll still attempt REST if xkeysib- present
    }
  } catch (err) {
    console.error("[payments/verify] SMTP transporter setup error:", err);
    smtpTransporter = null;
  }

  /**
   * Send order confirmation — supports:
   * 1) Brevo REST if REST key (xkeysib-) present
   * 2) fallback: SMTP using BREVO_SMTP_USER + BREVO_SMTP_PASS OR BREVO_SMTP_USER + BREVO_API_KEY (xsmtpsib-)
   *
   * This is best-effort; logs errors and returns info but does not throw to break main flow.
   */
  async function sendOrderConfirmationEmail(order) {
    const REST_KEY = process.env.BREVO_API_KEY; // may be REST key or SMTP key
    const EMAIL_FROM = process.env.EMAIL_FROM || "Devi Foods <no-reply@yourdomain.com>";
    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || "support@yourdomain.com";

    if (!order) {
      console.warn("[payments/verify] sendOrderConfirmationEmail called without order");
      return null;
    }

    // derive recipient
    const recipientEmail =
      order.paymentDetails?.email ||
      order.customerEmail ||
      order.email ||
      (order.customer && order.customer.email) ||
      null;

    const customerName =
      order.customerName ||
      order.customer?.name ||
      order.name ||
      (recipientEmail ? String(recipientEmail).split("@")[0] : "Customer");

    console.log("[payments/verify] will attempt to send order email to:", {
      recipientEmail,
      derivedFrom: {
        paymentDetailsEmail: order.paymentDetails?.email,
        customerEmail: order.customerEmail || order.email,
        customerObjEmail: order.customer?.email,
      },
    });

    if (!recipientEmail) {
      console.warn("[payments/verify] No customer email available on order — skipping send");
      return null;
    }

    // small helpers
    const fmtINR = (value) =>
      typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value || "₹0";

    const orderId = order._id?.toString?.() || order.id || order.orderId || "—";
    const orderAmount = fmtINR(order.amount || 0);
    const orderDate = new Date(order.createdAt || Date.now()).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    // build items html
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsHtml = items.length
      ? items
          .map((it) => {
            const name = escapeHtml(it.name || it.title || it.productId || "Item");
            const qty = it.qty ?? it.quantity ?? 1;
            const price = fmtINR(it.price ?? it.amount ?? 0);
            return `<tr>
              <td style="padding:8px 12px;border:1px solid #eee">${name}</td>
              <td style="padding:8px 12px;border:1px solid #eee;text-align:center">${escapeHtml(String(qty))}</td>
              <td style="padding:8px 12px;border:1px solid #eee;text-align:right">${price}</td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="3" style="padding:8px 12px;border:1px solid #eee">No items</td></tr>`;

    const address = order.address || {};
    const addressHtml = `
      ${escapeHtml(address.name || customerName)}<br/>
      ${escapeHtml(address.line1 || address.line || "")}${address.line2 ? `, ${escapeHtml(address.line2)}` : ""}<br/>
      ${escapeHtml(address.city || "")} - ${escapeHtml(address.pincode || "")}<br/>
      ${escapeHtml(address.phone || order.phone || "")}
    `;

    const subject = `Order Confirmed • ${orderId} • Devi Foods`;
    const htmlContent = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial; background:#f6f6f8; margin:0; padding:20px;">
      <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
        <div style="padding:20px 28px;border-bottom:1px solid #f0f0f2;display:flex;align-items:center;">
          <div style="font-weight:700;color:#542316;font-size:18px">Devi Foods</div>
          <div style="margin-left:auto;color:#666;font-size:13px">Order #: <strong>${escapeHtml(orderId)}</strong></div>
        </div>
        <div style="padding:20px 28px">
          <h2 style="margin:0 0 12px 0;font-size:18px;color:#222;">Thanks for your order, ${escapeHtml(customerName)} 👋</h2>
          <p style="color:#555;line-height:1.45">We're preparing your items now. We'll update you when your order is out for delivery.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:14px;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px 12px;border:1px solid #eee;background:#fafafa">Item</th>
                <th style="text-align:center;padding:8px 12px;border:1px solid #eee;background:#fafafa">Qty</th>
                <th style="text-align:right;padding:8px 12px;border:1px solid #eee;background:#fafafa">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:10px 12px;border-top:1px solid #eee;text-align:right;color:#555">Total</td>
                <td style="padding:10px 12px;border-top:1px solid #eee;text-align:right;font-weight:600">${orderAmount}</td>
              </tr>
            </tfoot>
          </table>

          <div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:18px;">
            <div style="flex:1;min-width:220px">
              <div style="font-size:13px;color:#666;margin-bottom:6px">Delivery address</div>
              <div style="background:#fafafa;padding:12px;border-radius:6px;border:1px solid #f0f0f2">${addressHtml}</div>
            </div>

            <div style="width:240px;min-width:180px">
              <div style="font-size:13px;color:#666;margin-bottom:6px">Order details</div>
              <div style="background:#fafafa;padding:12px;border-radius:6px;border:1px solid #f0f0f2">
                <div style="font-size:13px;color:#333;margin-bottom:8px">Order ID: <strong>${escapeHtml(orderId)}</strong></div>
                <div style="font-size:13px;color:#333;margin-bottom:8px">Payment: <strong>${escapeHtml(order.paymentMethod || "razorpay")}</strong></div>
                <div style="font-size:13px;color:#333">Placed on: <strong>${escapeHtml(orderDate)}</strong></div>
              </div>
            </div>
          </div>

          <p style="color:#555;font-size:13px;margin-top:16px">If you need to make any changes, please reply to this email or contact our support at <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#542316">${escapeHtml(SUPPORT_EMAIL)}</a>.</p>
        </div>

        <div style="padding:14px 28px;background:#fbfbfd;border-top:1px solid #f0f0f2;color:#777;font-size:12px;display:flex;justify-content:space-between;">
          <div>Devi Foods — Homemade & Authentic</div>
          <div>© ${new Date().getFullYear()} Devi Foods</div>
        </div>
      </div>
    </body></html>`;

    const textContent = `Thanks ${customerName}! Your order ${orderId} has been confirmed. Total: ${orderAmount}.`;

    // parse EMAIL_FROM maybe "Name <email@domain.com>"
    function parseFrom(fromStr) {
      if (!fromStr) return { name: "Devi Foods", email: "no-reply@yourdomain.com" };
      const m = fromStr.match(/^(.*)<(.*)>$/);
      if (m) return { name: m[1].trim().replace(/(^"|"$)/g, ""), email: m[2].trim() };
      return { name: "Devi Foods", email: fromStr.trim() };
    }

    const sender = parseFrom(EMAIL_FROM);

    // 1) If REST key present and looks like a REST key (xkeysib-) -> send via Brevo REST
    if (REST_KEY && REST_KEY.startsWith("xkeysib-")) {
      const BREVO_KEY = REST_KEY;
      const payload = {
        sender,
        to: [{ email: recipientEmail, name: customerName }],
        subject,
        htmlContent,
        textContent,
      };

      try {
        console.log("[payments/verify] Sending email via Brevo REST to:", recipientEmail);
        const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": BREVO_KEY,
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await resp.json().catch(() => null);
        console.log("[payments/verify] Brevo response status:", resp.status, "body:", data);
        if (!resp.ok) {
          console.error("[payments/verify] Brevo send failed:", resp.status, data);
          return { ok: false, status: resp.status, data };
        }
        console.log("[payments/verify] Brevo email sent:", data);
        return { ok: true, data };
      } catch (err) {
        console.error("[payments/verify] Brevo send error:", err);
        // fallback to SMTP if configured
        if (smtpTransporter) {
          console.warn("[payments/verify] Brevo REST failed, attempting SMTP fallback");
        } else {
          return { ok: false, error: err };
        }
      }
    }

    // 2) Fallback: use SMTP transporter if available (either explicit, or using xsmtpsib- + BREVO_SMTP_USER)
    if (smtpTransporter) {
      const mailOptions = {
        from: EMAIL_FROM,
        to: recipientEmail,
        subject,
        html: htmlContent,
        text: textContent,
      };
      try {
        console.log("[payments/verify] Sending email via SMTP to:", recipientEmail);
        const info = await smtpTransporter.sendMail(mailOptions);
        console.log("[payments/verify] SMTP email sent:", info?.messageId || info);
        return { ok: true, info };
      } catch (err) {
        console.error("[payments/verify] SMTP send failed:", err);
        return { ok: false, error: err };
      }
    }

    // 3) No method available
    console.warn("[payments/verify] No Brevo REST API key (xkeysib-) and no SMTP transporter configured — cannot send email");
    return null;
  } // end sendOrderConfirmationEmail

  // helper to escape html text in inserted values
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // --- main handler flow ---
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerId,
      items,
      amount,
      address,
      paymentDetails,
    } = req.body || {};

    // --- basic validation ---
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("[payments/verify] Missing required Razorpay fields", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment details.",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error(
        "[payments/verify] RAZORPAY_KEY_SECRET is not configured in env"
      );
      return res.status(500).json({
        success: false,
        message: "Payment configuration error on server.",
      });
    }

    // --- verify signature ---
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[payments/verify] Signature mismatch", {
        expectedSignature,
        razorpay_signature,
      });
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature." });
    }

    // At this point payment is VERIFIED with Razorpay key.
    // Now we update/save our Order in MongoDB.

    await connectDB();

    // Try to find an existing order created in /create-order
    let orderDoc = await Order.findOne({ razorpay_order_id }).exec();

    // common fields we want to set
    const baseFields = {
      customerId: customerId || orderDoc?.customerId || null,
      items: Array.isArray(items) && items.length ? items : orderDoc?.items || [],
      amount:
        typeof amount === "number"
          ? amount
          : orderDoc?.amount || 0,
      address: address || orderDoc?.address || {},
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentDetails: {
        ...(orderDoc?.paymentDetails || {}),
        ...(paymentDetails || {}),
        razorpay: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
        },
      },
    };

    try {
      if (orderDoc) {
        // Update existing order
        Object.assign(orderDoc, baseFields);
      } else {
        // No pre-created order (fallback) – create a fresh one
        orderDoc = new Order(baseFields);
      }

      await orderDoc.save();

      console.log(
        "[payments/verify] Payment verified and order saved:",
        orderDoc._id.toString()
      );

      // Best-effort: send order confirmation email (do not block API failure state)
      try {
        const emailResult = await sendOrderConfirmationEmail(orderDoc);
        console.log("[payments/verify] sendOrderConfirmationEmail result:", emailResult);
      } catch (emailErr) {
        console.error("[payments/verify] sendOrderConfirmationEmail error:", emailErr);
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified and order saved.",
        order: orderDoc,
      });
    } catch (err) {
      // IMPORTANT: Payment is VERIFIED, but DB save failed.
      // We still return success: true so frontend does not treat it as payment failure.
      console.error(
        "[payments/verify] Payment verified but failed to save order:",
        err
      );

      return res.status(200).json({
        success: true,
        message:
          "Payment verified but order save failed. Please contact support with your payment id.",
        order: null,
      });
    }
  } catch (err) {
    console.error("[payments/verify] error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify payment" });
  }
}
