import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const RAZORPAY_WEBHOOK_SECRET = "RBJv97CiLyQ_4m7";
const ZEPTO_MAIL_API_URL =
  process.env.ZEPTO_MAIL_API_URL || "https://api.zeptomail.in/v1.1/email";
const SENDER_EMAIL = "noreply@universalmail.in";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature")!;

  const supabase = getSupabaseBrowserClient();

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);

  const { shipment_id, payment_type } = event.payload.payment.entity.notes;

  switch (event.event) {
    case "payment.captured":
      // Handle successful payment
      console.log("Payment captured:", event.payload.payment.entity);
      const payment_id = event.payload.payment.entity.id;
      const { data: shipmentData } = await supabase
        .from("shipments")
        .select("*")
        .eq("shipment_id", shipment_id)
        .single();

      if (!shipmentData) {
        return new NextResponse("Shipment not found", { status: 404 });
      }

      // Fetch shipment items
      const { data: shipmentItems } = await supabase
        .from("shipment_items")
        .select("*")
        .eq("shipment_id", shipment_id);

      // Check if this is a product payment or regular payment
      const isProductPayment = payment_type === "product_payment";

      // Parse status_timeline (it's stored as JSON string)
      let statusTimeline = [];
      try {
        statusTimeline =
          typeof shipmentData.status_timeline === "string"
            ? JSON.parse(shipmentData.status_timeline)
            : Array.isArray(shipmentData.status_timeline)
            ? shipmentData.status_timeline
            : [];
      } catch (e) {
        console.error("Error parsing status_timeline:", e);
        statusTimeline = [];
      }

      if (isProductPayment) {
        // Update product payment fields
        const { error: updateError } = await supabase
          .from("shipments")
          .update({
            drop_and_ship_product_payment_status: "paid",
            drop_and_ship_product_paid_at: new Date().toISOString(),
            current_status_updated_at: new Date().toISOString(),
            drop_and_ship_product_payment_id: payment_id,
            status_timeline: JSON.stringify([
              ...statusTimeline,
              {
                status: "Product Payment Paid",
                updated_at: new Date().toISOString(),
                description: "Product payment has been captured",
              },
            ]),
            drop_and_ship_product_payment_details: JSON.stringify(
              event.payload.payment.entity
            ),
            drop_and_ship_product_payment_method: "Online Payment",
          })
          .eq("shipment_id", shipment_id);
        if (updateError) {
          return new NextResponse("Error updating shipment", { status: 500 });
        }
      } else {
        // Update regular payment fields
        const { error: updateError } = await supabase
          .from("shipments")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            current_status_updated_at: new Date().toISOString(),
            payment_id: payment_id,
            status_timeline: JSON.stringify([
              ...statusTimeline,
              {
                status: "Paid",
                updated_at: new Date().toISOString(),
                description: "Payment has been captured",
              },
            ]),
            current_status: "Paid",
            payment_details: JSON.stringify(event.payload.payment.entity),
            payment_method: "Online Payment",
          })
          .eq("shipment_id", shipment_id);
        if (updateError) {
          return new NextResponse("Error updating shipment", { status: 500 });
        }
      }

      // Send payment success email
      try {
        const emailHtml = generatePaymentSuccessEmail(
          shipmentData,
          shipmentItems || [],
          payment_id
        );
        await sendEmailViaZeptoMail({
          to: shipmentData.receiver_email,
          subject: `Payment Successful - Order ${
            shipmentData.order_id || shipmentData.shipment_id
          }`,
          htmlBody: emailHtml,
          recipientName: `${shipmentData.receiver_first_name} ${shipmentData.receiver_last_name}`,
        });
        console.log("Payment success email sent successfully");
      } catch (emailError) {
        console.error("Failed to send payment success email:", emailError);
        // Don't fail the webhook if email fails
      }

      return new NextResponse("Shipment updated", { status: 200 });

    case "payment.failed":
      await supabase
        .from("shipments")
        .update({ ecommerce_payment_status: "failed" })
        .eq("id", shipment_id);
      console.log("Payment failed:", event.payload.payment.entity);
      break;

    default:
      console.log("Unhandled event:", event.event);
  }

  return new NextResponse("Webhook received", { status: 200 });
}

// Helper function to format shipment type
function formatShipmentType(type: string): string {
  if (!type) return "Standard";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper function to format status
function formatStatus(status: string): string {
  if (!status) return "Pending";
  return status
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Generate payment success email HTML
function generatePaymentSuccessEmail(
  shipment: any,
  items: any[],
  paymentId: string
): string {
  const COMPANY_NAME = "Universal Mail";
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.universalmail.in";
  const shipmentLink = `${BASE_URL}/shipments/${shipment.shipment_id}`;
  const orderDisplayId = shipment.order_id || shipment.shipment_id;
  const shipmentDisplayId = shipment.shipment_id;

  // Format receiver address
  const receiverAddress = [
    shipment.receiver_address_line1,
    shipment.receiver_address_line2,
    shipment.receiver_address_line3,
    shipment.receiver_address_line4,
    shipment.receiver_postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  // Generate items HTML
  const itemsHtml =
    items && items.length > 0
      ? items
          .map(
            (item) => `
            <tr>
              <td style="padding: 12px; border: 1px solid #e0e0e0; color: #666666; font-size: 14px;">${
                item.name || item.description || "N/A"
              }</td>
              <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center; color: #666666; font-size: 14px;">${
                item.quantity || 1
              }</td>
              <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right; color: #666666; font-size: 14px;">${
                item.value_currency || "INR"
              } ${(item.declared_value || 0).toFixed(2)}</td>
            </tr>
          `
          )
          .join("")
      : '<tr><td colspan="3" style="padding: 12px; text-align: center; border: 1px solid #e0e0e0; color: #a2a2a2;">No items added</td></tr>';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
      <!-- Header with Logo -->
      <div style="padding: 30px 20px; text-align: center; border-bottom: 2px solid #9c4cd2;">
        <img src="https://www.universalmail.in/logo.png" alt="${COMPANY_NAME}" style="max-width: 180px; height: auto; display: block; margin: 0 auto;">
      </div>

      <!-- Main Content -->
      <div style="padding: 30px 20px; background-color: #ffffff;">
        <!-- Greeting -->
        <h3 style="margin: 0 0 20px 0; color: #3f3f3f; font-size: 20px; font-weight: 600;">
          Hi ${shipment.receiver_first_name} ${shipment.receiver_last_name},
        </h3>

        <p style="margin: 0 0 25px 0; color: #666666; font-size: 15px; line-height: 1.6;">
          Great news! Your payment has been <strong style="color: #9c4cd2;">successfully processed</strong> for your Order ID (<strong style="color: #9c4cd2;">${orderDisplayId}</strong>) with Shipment No (<strong style="color: #9c4cd2;">${shipmentDisplayId}</strong>).
          <br><br>
          <strong style="color: #9c4cd2;">Payment ID:</strong> ${paymentId}
          <br><br>
          Your shipment is now confirmed and will be processed shortly. You can track the status of your shipment by logging into your account or by clicking the link below:
          <br><br>
          <a href="${shipmentLink}" style="color: #9c4cd2; text-decoration: none; font-weight: 500;">${shipmentLink}</a>
        </p>

        <!-- Shipment Information -->
        <div style="padding: 20px; border-left: 4px solid #9c4cd2; margin: 25px 0;">
          <h4 style="margin: 0 0 15px 0; color: #3f3f3f; font-size: 16px; font-weight: 600;">Shipment Information</h4>
          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.8;">
            <strong style="color: #3f3f3f;">Shipment Type:</strong> ${formatShipmentType(
              shipment.shipment_type
            )}<br>
            ${
              shipment.shipment_total_weight
                ? `<strong style="color: #3f3f3f;">Total Weight:</strong> ${shipment.shipment_total_weight} kg<br>`
                : ""
            }
            ${
              shipment.package_length &&
              shipment.package_width &&
              shipment.package_height
                ? `<strong style="color: #3f3f3f;">Package Dimensions:</strong> ${shipment.package_length}cm × ${shipment.package_width}cm × ${shipment.package_height}cm<br>`
                : ""
            }
            <strong style="color: #3f3f3f;">Destination Country:</strong> ${
              shipment.shipment_country_code?.toUpperCase() || "N/A"
            }<br>
            <strong style="color: #3f3f3f;">Status:</strong> <span style="color: #9c4cd2; font-weight: 600;">${formatStatus(
              shipment.current_status
            )}</span>
          </p>
        </div>

        <!-- Receiver Information -->
        <div style="padding: 20px; border-left: 4px solid #9c4cd2; margin: 25px 0;">
          <h4 style="margin: 0 0 15px 0; color: #3f3f3f; font-size: 16px; font-weight: 600;">Receiver Information</h4>
          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.8;">
            <strong style="color: #3f3f3f;">Name:</strong> ${
              shipment.receiver_first_name
            } ${shipment.receiver_last_name}
            ${
              shipment.receiver_company
                ? `<br><strong style="color: #3f3f3f;">Company:</strong> ${shipment.receiver_company}`
                : ""
            }<br>
            <strong style="color: #3f3f3f;">Address:</strong> ${receiverAddress}<br>
            <strong style="color: #3f3f3f;">Email:</strong> ${
              shipment.receiver_email
            }<br>
            <strong style="color: #3f3f3f;">Phone:</strong> +${
              shipment.receiver_phone_code || ""
            } ${shipment.receiver_phone}
          </p>
        </div>

        <!-- Shipment Items -->
        <div style="margin: 25px 0;">
          <h4 style="margin: 0 0 15px 0; color: #3f3f3f; font-size: 16px; font-weight: 600;">Shipment Items</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden;">
            <thead>
              <tr style="background-color: #9c4cd2;">
                <th style="padding: 12px; border: 1px solid #9c4cd2; text-align: left; color: #ffffff; font-weight: 600; font-size: 14px;">Description</th>
                <th style="padding: 12px; border: 1px solid #9c4cd2; text-align: center; color: #ffffff; font-weight: 600; font-size: 14px;">Qty</th>
                <th style="padding: 12px; border: 1px solid #9c4cd2; text-align: right; color: #ffffff; font-weight: 600; font-size: 14px;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Pricing Summary -->
        <div style="padding: 20px; border-left: 4px solid #9c4cd2; margin: 25px 0;">
          <h4 style="margin: 0 0 15px 0; color: #3f3f3f; font-size: 16px; font-weight: 600;">Pricing Summary</h4>
          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.8;">
            ${
              shipment.shipment_weight_price
                ? `<strong style="color: #3f3f3f;">Weight Charges:</strong> INR ${(
                    Number(shipment.shipment_weight_price) || 0
                  ).toFixed(2)}<br>`
                : ""
            }
            ${
              shipment.shipment_dimentional_price
                ? `<strong style="color: #3f3f3f;">Dimensional Charges:</strong> INR ${(
                    Number(shipment.shipment_dimentional_price) || 0
                  ).toFixed(2)}<br>`
                : ""
            }
            ${
              shipment.price_details_tax
                ? `<strong style="color: #3f3f3f;">Tax:</strong> INR ${(
                    Number(shipment.price_details_tax) || 0
                  ).toFixed(2)}<br>`
                : ""
            }
            ${
              shipment.price_details_discount
                ? `<strong style="color: #3f3f3f;">Discount:</strong> -INR ${(
                    Number(shipment.price_details_discount) || 0
                  ).toFixed(2)}<br>`
                : ""
            }
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #9c4cd2;">
              <strong style="color: #9c4cd2; font-size: 16px;">Grand Total: INR ${(
                Number(shipment.grand_total) || 0
              ).toFixed(2)}</strong>
            </div>
          </p>
        </div>

        <!-- Payment Information -->
        <div style="padding: 20px; border-left: 4px solid #9c4cd2; margin: 25px 0; background-color: #f5e5ff;">
          <h4 style="margin: 0 0 15px 0; color: #3f3f3f; font-size: 16px; font-weight: 600;">✅ Payment Information</h4>
          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.8;">
            <strong style="color: #3f3f3f;">Payment Method:</strong> ${
              shipment.payment_method || "Online Payment"
            }<br>
            <strong style="color: #3f3f3f;">Payment ID:</strong> ${paymentId}<br>
            <strong style="color: #3f3f3f;">Status:</strong> <span style="color: #10b981; font-weight: 600;">Paid Successfully</span><br>
            <strong style="color: #3f3f3f;">Paid At:</strong> ${new Date(
              shipment.paid_at || new Date()
            ).toLocaleString()}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f5e5ff; padding: 20px; text-align: center; border-top: 2px solid #9c4cd2;">
        <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
          © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  `;

  return htmlBody;
}

async function sendEmailViaZeptoMail({
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
    apiUrl: ZEPTO_MAIL_API_URL,
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
        Authorization: `Zoho-enczapikey PHtE6r0KQb263WF69RYF4f65FJOnN44r/esyJQdFuYlFCvcGTU1cqtsukTDh/0gjUaUXEKLKnt1s57Oase/XLTnkNDpKX2qyqK3sx/VYSPOZsbq6x00aslkff0PUXIDocdBr1CbQs9eX`,
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
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      headers: Object.fromEntries(response.headers.entries()),
    });

    const result = await response.json();
    console.log("[ZeptoMail] API response data", {
      success: response.ok,
      result: result,
    });

    if (!response.ok) {
      console.error("[ZeptoMail] Failed to send email", {
        status: response.status,
        statusText: response.statusText,
        error: result,
        to,
        subject,
        recipientName,
        responseTime: `${responseTime}ms`,
      });
      throw new Error(`Failed to send email: ${JSON.stringify(result)}`);
    }

    const totalTime = Date.now() - startTime;
    console.log("[ZeptoMail] Email successfully sent", {
      to,
      subject,
      recipientName,
      totalTime: `${totalTime}ms`,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[ZeptoMail] Error sending email", {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      to,
      subject,
      recipientName,
      totalTime: `${totalTime}ms`,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
