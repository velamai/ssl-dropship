import "server-only";

const ZEPTO_MAIL_API_URL =
  process.env.ZEPTO_MAIL_API_URL || "https://api.zeptomail.in/v1.1/email";
const SENDER_EMAIL = "noreply@universalmail.in";

function getZeptoMailApiKey(): string {
  const apiKey = process.env.ZEPTO_MAIL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ZEPTO_MAIL_API_KEY is not configured. Set it in your server environment (.env).",
    );
  }
  return apiKey;
}

export function formatShipmentType(type: string): string {
  if (!type) return "Standard";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatStatus(status: string): string {
  if (!status) return "Pending";
  return status
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function sendEmailViaZeptoMail({
  to,
  subject,
  htmlBody,
  recipientName,
}: {
  to: string;
  subject: string;
  htmlBody: string;
  recipientName: string;
}) {
  const startTime = Date.now();
  console.log("[ZeptoMail] Starting email send request", {
    to,
    subject,
    recipientName,
    senderEmail: SENDER_EMAIL,
    htmlBodyLength: htmlBody.length,
    timestamp: new Date().toISOString(),
  });

  try {
    console.log("[ZeptoMail] Preparing API request payload", {
      from: SENDER_EMAIL,
      to,
      subject,
      hasHtmlBody: !!htmlBody,
    });

    const response = await fetch(ZEPTO_MAIL_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Zoho-enczapikey ${getZeptoMailApiKey()}`,
      },
      body: JSON.stringify({
        from: { address: SENDER_EMAIL },
        to: [{ email_address: { address: to } }],
        subject,
        htmlbody: htmlBody,
      }),
    });

    const responseTime = Date.now() - startTime;
    console.log("[ZeptoMail] Received API response", {
      status: response.status,
      responseTime: `${responseTime}ms`,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[ZeptoMail] Failed to send email", {
        status: response.status,
        error: result,
        to,
        subject,
      });
      throw new Error(`Failed to send email: ${JSON.stringify(result)}`);
    }

    console.log("[ZeptoMail] Email successfully sent", {
      to,
      subject,
      totalTime: `${Date.now() - startTime}ms`,
    });

    return { success: true };
  } catch (error) {
    console.error("[ZeptoMail] Error sending email", {
      error: error instanceof Error ? error.message : String(error),
      to,
      subject,
    });
    throw error;
  }
}
