import { NextResponse } from "next/server";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const DROP_AND_SHIP_ADD_ON_PRICE = 100;
const ONLINE_PAYMENT_CHARGE_PERCENT = 0.035; // 3.5%

export async function POST(req: Request) {
  try {
    const { shipmentId, payment_type } = await req.json();

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseBrowserClient();

    // Fetch shipment from database
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*")
      .eq("shipment_id", shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 },
      );
    }

    let baseAmount = 0;

    // Calculate base amount based on payment type
    if (payment_type === "product_payment") {
      // For product payment: calculate from items + add-ons
      // Use drop_and_ship_product_payment_charges if available, otherwise calculate
      if (shipment.drop_and_ship_product_payment_charges) {
        baseAmount = Number(shipment.drop_and_ship_product_payment_charges);
      } else {
        // Fetch shipment items
        const { data: items, error: itemsError } = await supabase
          .from("shipment_items")
          .select("*")
          .eq("shipment_id", shipmentId);

        if (itemsError) {
          console.error("Error fetching items:", itemsError);
        }

        // Calculate items total
        const itemsTotal = (items || []).reduce((sum, item) => {
          const itemPrice = Number(item.declared_value) || 0;
          const itemQuantity = item.quantity || 1;
          return sum + itemPrice * itemQuantity;
        }, 0);

        // Calculate add-ons total
        const addOnSelections = Array.isArray(shipment.drop_and_ship_add_ons)
          ? shipment.drop_and_ship_add_ons
          : [];
        const addOnsTotal = addOnSelections.length * DROP_AND_SHIP_ADD_ON_PRICE;

        const courierCharge =
          Number(shipment.drop_and_ship_courier_charge ?? 0) || 0;
        const handlingCharges =
          Number(shipment.drop_and_ship_handling_charges ?? 0) || 0;

        baseAmount = itemsTotal + addOnsTotal + courierCharge + handlingCharges;
      }
    } else {
      // For regular payment: use grand_total
      baseAmount = Number(shipment.grand_total) || 0;
    }

    if (baseAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    // Apply 3.5% online payment charge
    const onlinePaymentCharges = baseAmount * ONLINE_PAYMENT_CHARGE_PERCENT;
    const totalAmount = baseAmount + onlinePaymentCharges;

    // Create Razorpay order
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(totalAmount * 100), // Convert to paisa
        currency: "INR",
        receipt: `shipment_${shipmentId}`,
        notes: {
          shipment_id: shipmentId,
          source: "drop_and_ship",
          payment_type: payment_type || "regular_payment",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error.description || "Failed to create Razorpay order",
      );
    }

    const order = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}
