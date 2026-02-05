import { NextRequest, NextResponse } from "next/server";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  sendEmailViaZeptoMail,
  formatShipmentType,
  formatStatus,
} from "@/lib/zepto-mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shipment_id } = body;

    if (!shipment_id || typeof shipment_id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid shipment_id" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseBrowserClient();

    const { data: shipmentData, error: shipmentError } = await supabase
      .from("shipments")
      .select("*")
      .eq("shipment_id", shipment_id)
      .single();

    if (shipmentError || !shipmentData) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    if (!shipmentData.receiver_email) {
      return NextResponse.json(
        { error: "No receiver email for this shipment" },
        { status: 400 }
      );
    }

    const { data: shipmentItems } = await supabase
      .from("shipment_items")
      .select("*")
      .eq("shipment_id", shipment_id);

    const emailHtml = generateOrderConfirmationEmail(
      shipmentData,
      shipmentItems || []
    );

    await sendEmailViaZeptoMail({
      to: shipmentData.receiver_email,
      subject: `Order Confirmed - Order ${
        shipmentData.order_id || shipmentData.shipment_id
      }`,
      htmlBody: emailHtml,
      recipientName: `${shipmentData.receiver_first_name || ""} ${shipmentData.receiver_last_name || ""}`.trim() || "Customer",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-order-confirmation] Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send order confirmation email" },
      { status: 500 }
    );
  }
}

function generateOrderConfirmationEmail(shipment: any, items: any[]): string {
  const COMPANY_NAME = "Universal Mail";
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.universalmail.in";
  const shipmentLink = `${BASE_URL}/shipments/${shipment.shipment_id}`;
  const orderDisplayId = shipment.order_id || shipment.shipment_id;
  const shipmentDisplayId = shipment.shipment_id;

  const receiverAddress = [
    shipment.receiver_address_line1,
    shipment.receiver_address_line2,
    shipment.receiver_address_line3,
    shipment.receiver_address_line4,
    shipment.receiver_postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const itemsHtml =
    items && items.length > 0
      ? items
          .map(
            (item) => `
            <tr>
              <td style="padding: 12px; border: 1px solid #e0e0e0; color: #666666; font-size: 14px;">${
                item.product_name || item.name || item.description || "N/A"
              }</td>
              <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: center; color: #666666; font-size: 14px;">${
                item.quantity || 1
              }</td>
              <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right; color: #666666; font-size: 14px;">${
                item.value_currency || "INR"
              } ${(item.declared_value ?? item.price ?? 0).toFixed(2)}</td>
            </tr>
          `
          )
          .join("")
      : '<tr><td colspan="3" style="padding: 12px; text-align: center; border: 1px solid #e0e0e0; color: #a2a2a2;">No items added</td></tr>';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
      <div style="padding: 30px 20px; text-align: center; border-bottom: 2px solid #9c4cd2;">
        <img src="https://www.universalmail.in/logo.png" alt="${COMPANY_NAME}" style="max-width: 180px; height: auto; display: block; margin: 0 auto;">
      </div>

      <div style="padding: 30px 20px; background-color: #ffffff;">
        <h3 style="margin: 0 0 20px 0; color: #3f3f3f; font-size: 20px; font-weight: 600;">
          Hi ${shipment.receiver_first_name || ""} ${shipment.receiver_last_name || ""},
        </h3>

        <p style="margin: 0 0 25px 0; color: #666666; font-size: 15px; line-height: 1.6;">
          Your order has been <strong style="color: #9c4cd2;">successfully placed</strong>. Order ID: <strong style="color: #9c4cd2;">${orderDisplayId}</strong>, Shipment No: <strong style="color: #9c4cd2;">${shipmentDisplayId}</strong>.
          <br><br>
          You can track the status of your shipment by logging into your account or by clicking the link below:
          <br><br>
          <a href="${shipmentLink}" style="color: #9c4cd2; text-decoration: none; font-weight: 500;">${shipmentLink}</a>
        </p>

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
              shipment.current_status || "Pending"
            )}</span>
          </p>
        </div>

        <div style="padding: 20px; border-left: 4px solid #9c4cd2; margin: 25px 0;">
          <h4 style="margin: 0 0 15px 0; color: #3f3f3f; font-size: 16px; font-weight: 600;">Receiver Information</h4>
          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.8;">
            <strong style="color: #3f3f3f;">Name:</strong> ${shipment.receiver_first_name || ""} ${shipment.receiver_last_name || ""}
            ${
              shipment.receiver_company
                ? `<br><strong style="color: #3f3f3f;">Company:</strong> ${shipment.receiver_company}`
                : ""
            }<br>
            <strong style="color: #3f3f3f;">Address:</strong> ${receiverAddress}<br>
            <strong style="color: #3f3f3f;">Email:</strong> ${shipment.receiver_email}<br>
            <strong style="color: #3f3f3f;">Phone:</strong> +${shipment.receiver_phone_code || ""} ${shipment.receiver_phone || ""}
          </p>
        </div>

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
      </div>

      <div style="background-color: #f5e5ff; padding: 20px; text-align: center; border-top: 2px solid #9c4cd2;">
        <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
          © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  `;
}
