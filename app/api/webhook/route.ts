import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import Razorpay from "razorpay";

const RAZORPAY_WEBHOOK_SECRET = "RBJv97CiLyQ_4m7";

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

  const { shipment_id } = event.payload.payment.entity.notes;

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
      const { error: updateError } = await supabase
        .from("shipments")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          payment_id: payment_id,
          current_status: "Paid",
          payment_method: "Online Payment",
          current_status_updated_at: new Date().toISOString(),
          status_timeline: [
            ...shipmentData.status_timeline,
            {
              status: "Paid",
              updated_at: new Date().toISOString(),
              description: "Payment has been captured",
            },
          ],
          payment_details: event.payload.payment.entity,
        })
        .eq("shipment_id", shipment_id);
      if (updateError) {
        return new NextResponse("Error updating shipment", { status: 500 });
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
