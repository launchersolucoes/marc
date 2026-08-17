import "server-only";

function logDeliveryFailure(reason, providerStatus = null) {
  console.error(JSON.stringify({
    event: "marc_email_delivery_failed",
    reason,
    providerStatus,
  }));
}

export async function sendTransactionalEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return { sent: false, reason: "not_configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      logDeliveryFailure("provider_error", response.status);
      return { sent: false, reason: "provider_error" };
    }
    return { sent: true };
  } catch (error) {
    const reason = error?.name === "TimeoutError" ? "timeout" : "network_error";
    logDeliveryFailure(reason);
    return { sent: false, reason };
  }
}
