import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { shipmentId, amount } = await req.json();

    if (!shipmentId || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paisa
        currency: "INR",
        receipt: `shipment_${shipmentId}`,
        notes: {
          shipment_id: shipmentId,
          source: "drop_and_ship",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error.description || "Failed to create Razorpay order"
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
      { status: 500 }
    );
  }
}
