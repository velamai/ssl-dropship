import { NextResponse } from "next/server";

const ONLINE_PAYMENT_CHARGE_PERCENT = 0.035; // 3.5%

export async function POST(req: Request) {
  try {
    console.log("[razorpay-create-order-checkout] Request received");

    const body = await req.json();
    console.log("[razorpay-create-order-checkout] Request body:", {
      amount: body.amount,
      sourceCurrencyCode: body.sourceCurrencyCode,
      exchangeRateSourceToInr: body.exchangeRateSourceToInr,
      addOnTotal: body.addOnTotal,
    });

    const {
      amount,
      sourceCurrencyCode,
      exchangeRateSourceToInr,
      addOnTotal,
      receipt,
      notes,
    } = body;

    if (!amount || !sourceCurrencyCode || !exchangeRateSourceToInr) {
      console.error("[razorpay-create-order-checkout] Missing parameters:", {
        amount: !!amount,
        sourceCurrencyCode: !!sourceCurrencyCode,
        exchangeRateSourceToInr: !!exchangeRateSourceToInr,
      });
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Check if Razorpay credentials are configured
    const hasKeyId = !!process.env.RAZORPAY_KEY_ID;
    const hasKeySecret = !!process.env.RAZORPAY_KEY_SECRET;
    console.log(
      "[razorpay-create-order-checkout] Razorpay credentials check:",
      {
        hasKeyId,
        hasKeySecret,
        keyIdLength: process.env.RAZORPAY_KEY_ID?.length || 0,
      },
    );

    if (!hasKeyId || !hasKeySecret) {
      console.error(
        "[razorpay-create-order-checkout] Razorpay credentials not configured",
      );
      return NextResponse.json(
        { success: false, error: "Payment service not configured" },
        { status: 500 },
      );
    }

    // Convert amount from source currency to INR
    // exchangeRateSourceToInr means "1 source currency = X INR"
    // So: amountInInr = amount * exchangeRateSourceToInr
    const amountInInr = amount;

    // Add add-ons total (add-ons are already in INR, so no conversion needed)
    const baseAmountInInr = amountInInr;

    if (baseAmountInInr <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    // Apply 3.5% online payment charge
    const onlinePaymentCharges =
      baseAmountInInr * ONLINE_PAYMENT_CHARGE_PERCENT;
    const totalAmountInInr = baseAmountInInr + onlinePaymentCharges;

    // Create Razorpay order (Razorpay only accepts INR)
    const razorpayPayload = {
      amount: Math.round(totalAmountInInr * 100), // Convert to paisa
      // currency: "INR",
      currency: sourceCurrencyCode,
      receipt: receipt || `checkout_${Date.now()}`,
      notes: {
        source_currency_code: sourceCurrencyCode,
        exchange_rate_source_to_inr: exchangeRateSourceToInr,
        original_amount: amount,
        add_ons_total: addOnTotal || 0,
        ...notes,
      },
    };

    console.log("[razorpay-create-order-checkout] Calling Razorpay API with:", {
      amount: razorpayPayload.amount,
      currency: razorpayPayload.currency,
      receipt: razorpayPayload.receipt,
    });

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
        ).toString("base64")}`,
      },
      body: JSON.stringify(razorpayPayload),
    });

    console.log(
      "[razorpay-create-order-checkout] Razorpay API response status:",
      response.status,
    );

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: { description: errorText } };
      }

      console.error("[razorpay-create-order-checkout] Razorpay API error:", {
        status: response.status,
        statusText: response.statusText,
        error,
        errorText,
      });

      // Check if it's an authentication error from Razorpay
      if (response.status === 401 || response.status === 403) {
        const errorMsg =
          error.error?.description ||
          error.error?.message ||
          "Payment service authentication failed";
        console.error(
          "[razorpay-create-order-checkout] Razorpay authentication failed:",
          errorMsg,
        );
        return NextResponse.json(
          {
            success: false,
            error: `Razorpay API Error: ${errorMsg}. Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct.`,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            error.error?.description ||
            error.error?.message ||
            "Failed to create Razorpay order",
        },
        { status: 500 },
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
        amountInInr: totalAmountInInr,
        originalAmount: amount,
        sourceCurrencyCode,
      },
    });
  } catch (error: any) {
    console.error("Error creating Razorpay checkout order:", {
      message: error.message,
      stack: error.stack,
      error,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create order",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
