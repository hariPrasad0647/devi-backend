export async function sendOtpSms(phone, otp) {
  // 🔥 LOCAL MODE — NO SMS SENT
  if (process.env.OTP_MODE === "local") {
    console.log("########################################");
    console.log("###   LOCAL OTP MODE (NO SMS SENT)   ###");
    console.log("########################################");
    console.log("Phone:", phone);
    console.log("OTP:", otp);
    console.log("########################################");

    return { success: true, mode: "local" };
  }

  // 🔥 LIVE MODE — USE MSG91
  try {
    const res = await fetch("https://api.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: phone,
        otp: otp,
        template_id: process.env.MSG91_TEMPLATE_ID,
      }),
    });

    const data = await res.json().catch(() => ({}));

    return data;
  } catch (err) {
    console.error("[MSG91 ERROR]", err);
    return { success: false, message: "SMS sending failed" };
  }
}
