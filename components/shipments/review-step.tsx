"use client";

import {
  ShipmentPriceBreakdown,
  type ShipmentItem,
} from "@/components/shipments/price-breakdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSourceCountries } from "@/lib/hooks/useSourceCountries";
import type { ShipmentPriceBreakdown as ShipmentPriceBreakdownType } from "@/lib/shipment-price-calculator";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Info,
  Landmark,
  Loader2,
  LogIn,
  Send,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { toast as sonnerToast } from "sonner";

type AddOnId = "gift-wrapper" | "gift-message" | "extra-packing";

interface ReviewStepProps {
  baseAmount: number;
  selectedAddOns: AddOnId[];
  addOnTotal: number;
  priceBreakdown: ShipmentPriceBreakdownType | null;
  isCalculatingBreakdown?: boolean;
  sourceCountryCode?: string;
  destinationCountryCode?: string;
  items?: ShipmentItem[]; // Product items array
  purchasedSite?: string; // For warehouse order summary
  purchasedDate?: Date | string; // For warehouse order summary
  onBack: () => void;
  user?: { id: string } | null; // For login gate at Place Order
  onLoginRequired?: () => void; // Called when guest tries to place order
  loginRedirectUrl?: string; // Redirect URL after login (includes type for link/warehouse)
  onSubmit: (currencyData?: {
    sourceCurrencyCode: string;
    destinationCurrencyCode: string;
    exchangeRateSourceToInr: number;
    exchangeRateDestinationToInr: number;
    totalGrandTotal: number;
    warehouseHandlingCharge: number;
    courierCharge: number;
  }) => Promise<void>; // Creates order in database
  isSubmitting: boolean;
  isLinkService?: boolean;
  paymentMethod?: "Online Payment" | "Bank Transfer";
  onPaymentMethodChange?: (method: "Online Payment" | "Bank Transfer") => void;
  receiverInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export type ProductPriceBreakDown = {
  productPriceInSourceCountry: number;
  productPriceInDestinationCountry: number;
  warehouseHandlingChargeInSourceCountry: number;
  warehouseHandlingChargeInDestinationCountry: number;
  courierChargeInSourceCountry: number;
  courierChargeInDestinationCountry: number;
  exchangeRate: number;
  sourceCurrencyCode: string;
  destinationCurrencyCode: string;
  exchangeRateSourceToInr: number;
  exchangeRateDestinationToInr: number;
};

function showToast(props: {
  title?: string;
  description: string;
  variant?: "default" | "destructive";
}) {
  const { title, description, variant } = props;
  if (variant === "destructive") {
    sonnerToast.error(title || "Error", { description });
  } else {
    sonnerToast(title || "Success", { description });
  }
}

export function ReviewStep({
  baseAmount,
  selectedAddOns,
  addOnTotal,
  priceBreakdown,
  isCalculatingBreakdown = false,
  sourceCountryCode,
  destinationCountryCode,
  items = [],
  purchasedSite,
  purchasedDate,
  onBack,
  user,
  onLoginRequired,
  loginRedirectUrl = "/create-shipments?from=checkout",
  onSubmit,
  isSubmitting,
  isLinkService = false,
  paymentMethod = "Online Payment",
  onPaymentMethodChange,
  receiverInfo,
}: ReviewStepProps) {
  const formatCurrency = (value: number) =>
    `${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const { data: sourceCountries } = useSourceCountries();

  // Razorpay state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false);
  const razorpayTriggered = useRef(false);

  const sourceCurrencyCodeValue =
    sourceCountries?.find((country) => country.code === sourceCountryCode)
      ?.currency || "INR";
  const destinationCurrencyCodeValue =
    sourceCountries?.find((country) => country.code === destinationCountryCode)
      ?.currency || "USD";

  // Initialize Razorpay payment - creates order first, then creates database order after payment success
  const initializeRazorpay = async (
    amount: number,
    sourceCurrencyCode: string,
    exchangeRateSourceToInr: number,
    receiverInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    },
    currencyData: {
      sourceCurrencyCode: string;
      destinationCurrencyCode: string;
      exchangeRateSourceToInr: number;
      exchangeRateDestinationToInr: number;
      totalGrandTotal: number;
      warehouseHandlingCharge: number;
      courierCharge: number;
    },
  ) => {
    console.log("[initializeRazorpay] Called with:", {
      amount,
      sourceCurrencyCode,
      exchangeRateSourceToInr,
      receiverInfo,
      alreadyTriggered: razorpayTriggered.current,
    });

    if (razorpayTriggered.current) {
      console.log("[initializeRazorpay] Already triggered, returning");
      return;
    }
    razorpayTriggered.current = true;
    setIsProcessingPayment(true);

    try {
      console.log("[initializeRazorpay] Creating Razorpay order...");
      // Create Razorpay order with amount and currency from frontend
      const response = await fetch("/api/razorpay-create-order-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          sourceCurrencyCode: sourceCurrencyCode,
          exchangeRateSourceToInr: exchangeRateSourceToInr,
          addOnTotal: addOnTotal,
          receipt: `checkout_${Date.now()}`,
          notes: {
            source: "drop_and_ship",
            payment_type: "product_payment",
          },
        }),
      });

      console.log("[initializeRazorpay] API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error("[initializeRazorpay] API error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorText,
        });
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to create Razorpay order",
        );
      }

      const { data, success, error } = await response.json();
      console.log("[initializeRazorpay] API response:", {
        success,
        data,
        error,
      });

      if (!success || error) {
        throw new Error(error || "Failed to create order");
      }

      if (
        typeof window === "undefined" ||
        typeof (window as any).Razorpay === "undefined"
      ) {
        console.error("[initializeRazorpay] Razorpay script not loaded");
        throw new Error("Razorpay script not loaded");
      }

      console.log("[initializeRazorpay] Opening Razorpay modal...");

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Buy2Send",
        description: `Product payment for order`,
        order_id: data.orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // Payment successful - now create the database order
          try {
            setIsProcessingPayment(false);
            razorpayTriggered.current = false;

            // Create order in database after payment success
            await onSubmit(currencyData);

            showToast({
              title: "Payment Successful",
              description: "Your order has been placed successfully.",
            });
          } catch (error: any) {
            showToast({
              title: "Error",
              description:
                error.message ||
                "Payment successful but failed to create order. Please contact support.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            razorpayTriggered.current = false;
            setIsProcessingPayment(false);
          },
          confirm_close: true,
          escape: true,
        },
        prefill: {
          name: `${receiverInfo.firstName} ${receiverInfo.lastName}`,
          email: receiverInfo.email,
          contact: receiverInfo.phone,
        },
        notes: {
          payment_type: "product_payment",
          source_currency_code: sourceCurrencyCode,
        },
        theme: { color: "#0284c7" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        showToast({
          title: "Payment Failed",
          description:
            response.error?.description || "Payment failed. Please try again.",
          variant: "destructive",
        });
        razorpayTriggered.current = false;
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay init failed:", err);
      razorpayTriggered.current = false;
      setIsProcessingPayment(false);
      showToast({
        title: "Error",
        description: err.message || "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  // Wait for Razorpay script to load
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      setRazorpayScriptLoaded(true);
      return;
    }
    const pollInterval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        setRazorpayScriptLoaded(true);
        clearInterval(pollInterval);
      }
    }, 200);
    const timeout = setTimeout(() => clearInterval(pollInterval), 10000);
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Price Breakdown - Link service only; warehouse orders have no breakdown */}
      {isLinkService && isCalculatingBreakdown && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating price breakdown...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLinkService && priceBreakdown && !isCalculatingBreakdown && (
        <ShipmentPriceBreakdown
          breakdown={priceBreakdown}
          sourceCountryCode={sourceCountryCode}
          destinationCountryCode={destinationCountryCode}
          destinationCurrencyCode={destinationCurrencyCodeValue}
          sourceCurrencyCode={sourceCurrencyCodeValue}
          items={items}
        />
      )}

      {/* Warehouse order: info message about shipping payment */}
      {!isLinkService && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            After your product is received at our warehouse, we will calculate
            the weight and you will need to pay for shipping. No payment for
            product value is required at checkout.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Review and Confirm
          </CardTitle>
          <CardDescription>
            Review your order summary and terms before submitting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-2 rounded-md border border-dashed p-4 text-sm">
            <p className="font-medium text-foreground">Order summary</p>
            {!isLinkService ? (
              /* Warehouse order summary: Purchased Site, Date, Product names, Add-ons */
              <>
                {purchasedSite && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Purchased Site</span>
                    <span>{purchasedSite}</span>
                  </div>
                )}
                {purchasedDate && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Purchased Date</span>
                    <span>
                      {typeof purchasedDate === "string"
                        ? new Date(purchasedDate).toLocaleDateString()
                        : purchasedDate instanceof Date
                          ? purchasedDate.toLocaleDateString()
                          : ""}
                    </span>
                  </div>
                )}
                {items.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Products</span>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {items.map((item, idx) => (
                        <li key={item.uuid || idx}>
                          {item.productName || `Product ${idx + 1}`}
                          {item.quantity &&
                            item.quantity > 1 &&
                            ` (Qty: ${item.quantity})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedAddOns.length > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Add-ons ({selectedAddOns.length})</span>
                    <span>INR {formatCurrency(addOnTotal)}</span>
                  </div>
                )}
              </>
            ) : isCalculatingBreakdown || !priceBreakdown ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading order summary...</span>
              </div>
            ) : (
              /* Link service order summary */
              <>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Items Price</span>
                  <span>
                    {sourceCurrencyCodeValue}{" "}
                    {formatCurrency(priceBreakdown!.itemPriceOrigin)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Domestic Courier Charge</span>
                  <span>
                    {sourceCurrencyCodeValue}{" "}
                    {formatCurrency(priceBreakdown!.domesticCourier)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Warehouse Handling Charge</span>
                  <span>
                    {sourceCurrencyCodeValue}{" "}
                    {formatCurrency(priceBreakdown!.warehouseHandling)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Add-ons ({selectedAddOns.length})</span>
                  <span>
                    {sourceCurrencyCodeValue}{" "}
                    {formatCurrency(
                      addOnTotal /
                        (priceBreakdown!.exchangeRateSourceToInr || 1),
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 text-foreground">
                  <span className="text-sm font-semibold">Grand Total</span>
                  <span className="text-base font-semibold">
                    {sourceCurrencyCodeValue}{" "}
                    {formatCurrency(
                      priceBreakdown!.totalPriceOrigin +
                        addOnTotal /
                          (priceBreakdown!.exchangeRateSourceToInr || 1),
                    )}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Payment Method - Link to Ship only */}
          {isLinkService && onPaymentMethodChange && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Choose how you would like to pay for your order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("Online Payment")}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === "Online Payment"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Online Payment</p>
                      <p className="text-sm text-muted-foreground">
                        Pay by card or UPI (3.5% processing fee applies)
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPaymentMethodChange("Bank Transfer")}
                    className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === "Bank Transfer"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                  >
                    <Landmark className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-muted-foreground">
                        Upload payment proof after placing order
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Terms and Conditions</h3>
            <ScrollArea className="h-[60vh] pr-4 border rounded-md p-4">
              <div className="space-y-6 text-sm leading-relaxed text-foreground">
                {/* 1. IMPORTANT NOTICE */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    1. IMPORTANT NOTICE
                  </h2>
                  <p>
                    These Conditions of Carriage and Service ("Terms") EXCLUDE
                    LIABILITY on the part of Universal Mail and its employees or
                    agents for loss, damage, and delay in certain circumstances,
                    LIMIT LIABILITY to stated amounts where liability is
                    accepted, and REQUIRE NOTICE OF CLAIMS within strict time
                    limits.
                  </p>
                  <p className="mt-2">
                    Customers are strongly advised to read these conditions
                    carefully and obtain insurance cover where necessary to
                    protect their interests.
                  </p>
                </section>

                {/* 2. SERVICES PROVIDED */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    2. SERVICES PROVIDED
                  </h2>
                  <p>Universal Mail provides two categories of service:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      <strong>(a) Warehouse Service:</strong> Customers may
                      order goods from any online platform and ship them to the
                      address of our warehouse in the chosen country. Upon
                      receipt, Universal Mail will forward the parcel to the
                      customer's designated delivery address in another country.
                    </li>
                    <li>
                      <strong>(b) Link Service:</strong> Customers may submit a
                      product link (e.g., from Amazon, eBay, AliExpress, etc.).
                      Universal Mail will purchase the item on behalf of the
                      customer and ship it to their provided destination
                      address.
                    </li>
                  </ul>
                </section>

                {/* 3. TEMPORARY SURCHARGES */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    3. TEMPORARY SURCHARGES
                  </h2>
                  <p>
                    To continue providing uninterrupted services during
                    extraordinary circumstances such as pandemics or global
                    disruptions, a temporary surcharge may be applied on all
                    international parcels, freight, and shipments until further
                    notice.
                  </p>
                </section>

                {/* 4. QUOTATIONS AND CHARGES */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    4. QUOTATIONS AND CHARGES
                  </h2>
                  <p>
                    Rates and service quotations provided by Universal Mail
                    staff or agents are based on information provided by the
                    sender but are subject to final verification after shipment
                    inspection.
                  </p>
                  <p className="mt-2">
                    Final rates may differ depending on actual weight,
                    dimensions, and applicable courier tariffs.
                  </p>
                  <p className="mt-2">
                    Universal Mail will not be liable for, nor issue any refund,
                    credit, or adjustment due to discrepancies between
                    preliminary quotations and final invoiced rates.
                  </p>
                  <p className="mt-2">
                    Dimensional weight may apply. It is calculated as{" "}
                    <span className="font-medium">
                      (Length × Height × Width in cm) ÷ 5000
                    </span>
                    , or any updated divisor specified by Universal Mail. If the
                    dimensional weight exceeds the actual weight, charges will
                    be based on the dimensional weight.
                  </p>
                  <p className="mt-2">
                    For bulk or multiple-piece shipments, advance arrangements
                    are required. Details are available upon request.
                  </p>
                </section>

                {/* 5. RESTRICTED AND PROHIBITED ITEMS */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    5. RESTRICTED AND PROHIBITED ITEMS
                  </h2>
                  <p>
                    The following items are not acceptable for carriage under
                    any circumstances:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      Money (coins, currency notes, negotiable instruments,
                      etc.)
                    </li>
                    <li>Explosives, fireworks, or flammable items</li>
                    <li>Human or animal remains, organs, embryos</li>
                    <li>Firearms, ammunition, or weapon parts</li>
                    <li>Perishable food, beverages requiring refrigeration</li>
                    <li>
                      Hazardous or bio-waste (used needles, medical waste)
                    </li>
                    <li>Counterfeit or infringing goods</li>
                    <li>Goods requiring import/export licenses or permits</li>
                    <li>
                      Illegal, prohibited, or regulated substances under local
                      or international law
                    </li>
                    <li>Wet, leaking, or odorous packages</li>
                    <li>
                      Packages wrapped in kraft/brown paper without durable
                      external packaging
                    </li>
                  </ul>
                  <p className="mt-2">
                    Universal Mail reserves the right to reject, hold, or
                    dispose of any prohibited shipment without notice or
                    compensation.
                  </p>
                </section>

                {/* 6. PACKAGING AND ADDRESSING */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    6. PACKAGING AND ADDRESSING
                  </h2>
                  <p>
                    Each parcel must be legibly and durably marked with the
                    shipper and recipient's full name, complete postal address
                    (including postal code), and valid phone number.
                  </p>
                  <p className="mt-2">
                    Universal Mail is not liable for non-delivery or delay
                    resulting from incomplete or inaccurate addresses.
                  </p>
                  <p className="mt-2">
                    Customers must report any tracking or label discrepancies
                    within 24 hours of receiving tracking information.
                  </p>
                </section>

                {/* 7. LIABILITY LIMITATIONS */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    7. LIABILITY LIMITATIONS
                  </h2>
                  <p>
                    Except as expressly set out herein, Universal Mail makes no
                    warranties, express or implied.
                  </p>
                  <p className="mt-2">
                    Universal Mail's maximum liability for loss, damage, or
                    shortage of a shipment is USD 100 or the declared/invoice
                    value, whichever is lower.
                  </p>
                  <p className="mt-2">
                    Liability shall not exceed the actual direct loss. Indirect,
                    consequential, or economic losses are excluded.
                  </p>
                  <p className="mt-2">
                    For postal and economy courier services (e.g., USPS,
                    Singapore Post Smart, Hermes), where tracking or delivery
                    progress is unavailable or delayed, compensation is limited
                    to the shipping charges only.
                  </p>
                  <p className="mt-2">
                    Universal Mail shall not be responsible for delays caused by
                    customs, public authorities, or force majeure events
                    (natural disasters, wars, pandemics, etc.).
                  </p>
                </section>

                {/* 8. CUSTOMS, DUTIES, AND COMPLIANCE */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    8. CUSTOMS, DUTIES, AND COMPLIANCE
                  </h2>
                  <p>
                    All shipments are subject to customs clearance and
                    inspection. Any customs duties, import taxes, or additional
                    fees charged by destination authorities are solely the
                    receiver's responsibility.
                  </p>
                  <p className="mt-2">
                    Universal Mail acts as a forwarding agent and does not
                    guarantee clearance outcomes or timelines.
                  </p>
                  <p className="mt-2">
                    The customer is responsible for ensuring that all goods
                    comply with import/export laws of the origin and destination
                    countries.
                  </p>
                </section>

                {/* 9. PAYMENT & BILLING */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    9. PAYMENT & BILLING
                  </h2>
                  <p>
                    All payments must be made in advance for Link purchases and
                    before dispatch for Warehouse shipments.
                  </p>
                  <p className="mt-2">
                    Prices and currency conversion rates may fluctuate daily
                    based on exchange rate variations.
                  </p>
                  <p className="mt-2">
                    Additional charges such as registration, service fees, or
                    local courier handling fees may apply. For example, a Rs.
                    300 surcharge may be added for shipments handled through
                    national postal services.
                  </p>
                  <p className="mt-2">
                    Universal Mail reserves the right to revise service rates
                    periodically without prior notice.
                  </p>
                </section>

                {/* 10. CLAIMS AND NOTICE PERIODS */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    10. CLAIMS AND NOTICE PERIODS
                  </h2>
                  <p>
                    Any claims for damage, shortage, or loss must be reported in
                    writing within 7 days of delivery (or expected delivery).
                  </p>
                  <p className="mt-2">
                    Claims must include shipment details, photos, invoices, and
                    proof of damage/loss.
                  </p>
                  <p className="mt-2">
                    Failure to file a timely claim will discharge Universal Mail
                    from all liability.
                  </p>
                </section>

                {/* 11. REFUND & CANCELLATION POLICY */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    11. REFUND & CANCELLATION POLICY
                  </h2>
                  <p>
                    <strong>Warehouse Orders:</strong> Refunds are not available
                    once the parcel is received and shipping has been arranged.
                  </p>
                  <p className="mt-2">
                    <strong>Link Orders:</strong> Once a product has been
                    purchased from the source website, the order cannot be
                    cancelled.
                  </p>
                  <p className="mt-2">
                    If the product is unavailable or discontinued, Universal
                    Mail will issue a refund or wallet credit for the product
                    amount.
                  </p>
                  <p className="mt-2">
                    Shipping fees are non-refundable once a parcel is
                    dispatched.
                  </p>
                  <p className="mt-2">
                    Refunds for overpayment or cancelled orders will be
                    processed within 7–10 business days.
                  </p>
                </section>

                {/* 12. ACCOUNT & PRIVACY */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    12. ACCOUNT & PRIVACY
                  </h2>
                  <p>
                    Customers must keep their account credentials secure.
                    Universal Mail will use personal data only for shipment
                    processing and service delivery, in accordance with our{" "}
                    <span className="underline">Privacy Policy</span>.
                  </p>
                  <p className="mt-2">
                    Universal Mail may share necessary shipment data with
                    customs, couriers, and payment partners as required for
                    lawful operations.
                  </p>
                </section>

                {/* 13. SERVICE COMMUNICATIONS */}
                <section>
                  <h2 className="font-semibold text-lg mb-2">
                    13. SERVICE COMMUNICATIONS
                  </h2>
                  <p>
                    Customers will receive updates via email, SMS, or dashboard
                    notifications at the following stages:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Order created</li>
                    <li>Parcel received at warehouse</li>
                    <li>Shipping fee confirmed</li>
                    <li>Payment received</li>
                    <li>Shipment dispatched / tracking available</li>
                    <li>Customs or delay updates</li>
                    <li>Delivered</li>
                  </ul>
                </section>
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {!user ? (
          <div className="flex flex-col items-end gap-2">
            <p className="text-sm text-muted-foreground">
              Login or register to place your order
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link
                  href={`/login?redirect=${encodeURIComponent(loginRedirectUrl)}`}
                  onClick={onLoginRequired}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button asChild>
                <Link
                  href={`/register?redirect=${encodeURIComponent(loginRedirectUrl)}`}
                  onClick={onLoginRequired}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Razorpay Script */}
            {isLinkService && (
              <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
                onLoad={() => {
                  console.log("[ReviewStep] Razorpay script loaded");
                  setRazorpayScriptLoaded(true);
                }}
                onError={(e) => {
                  console.error(
                    "[ReviewStep] Razorpay script failed to load:",
                    e,
                  );
                  showToast({
                    title: "Error",
                    description:
                      "Failed to load payment script. Please refresh the page.",
                    variant: "destructive",
                  });
                }}
              />
            )}
            <Button
              type="button"
              onClick={async () => {
                console.log("[ReviewStep] Place Order clicked", {
                  isLinkService,
                  priceBreakdown: !!priceBreakdown,
                  sourceCurrencyCodeValue,
                  destinationCurrencyCodeValue,
                  paymentMethod,
                  receiverInfo,
                  razorpayScriptLoaded,
                });

                if (
                  isLinkService &&
                  priceBreakdown &&
                  sourceCurrencyCodeValue &&
                  destinationCurrencyCodeValue
                ) {
                  const addOnInSource =
                    addOnTotal / (priceBreakdown.exchangeRateSourceToInr || 1);
                  const grandTotal =
                    priceBreakdown.totalPriceOrigin + addOnInSource;

                  const currencyData = {
                    sourceCurrencyCode: sourceCurrencyCodeValue,
                    destinationCurrencyCode: destinationCurrencyCodeValue,
                    exchangeRateSourceToInr:
                      priceBreakdown.exchangeRateSourceToInr,
                    exchangeRateDestinationToInr: 1,
                    totalGrandTotal: grandTotal,
                    warehouseHandlingCharge: priceBreakdown.warehouseHandling,
                    courierCharge: priceBreakdown.domesticCourier,
                  };

                  // For Link service with Online Payment: create Razorpay order first, then create database order after payment success
                  if (paymentMethod === "Online Payment") {
                    if (!receiverInfo) {
                      console.error(
                        "[ReviewStep] Receiver info missing:",
                        receiverInfo,
                      );
                      showToast({
                        title: "Error",
                        description: "Receiver information is required",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Calculate total amount in source currency (same as displayed in UI)
                    const totalAmount = grandTotal;
                    console.log("[ReviewStep] Initializing Razorpay with:", {
                      totalAmount,
                      sourceCurrencyCodeValue,
                      exchangeRateSourceToInr:
                        priceBreakdown.exchangeRateSourceToInr,
                      receiverInfo,
                    });

                    // Check if Razorpay script is loaded
                    if (
                      typeof window !== "undefined" &&
                      (window as any).Razorpay
                    ) {
                      console.log(
                        "[ReviewStep] Razorpay script already loaded",
                      );
                      setRazorpayScriptLoaded(true);
                      setTimeout(() => {
                        initializeRazorpay(
                          totalAmount,
                          sourceCurrencyCodeValue,
                          priceBreakdown.exchangeRateSourceToInr,
                          receiverInfo,
                          currencyData,
                        );
                      }, 100);
                    } else if (razorpayScriptLoaded) {
                      console.log(
                        "[ReviewStep] Razorpay script loaded flag is true",
                      );
                      setTimeout(() => {
                        initializeRazorpay(
                          totalAmount,
                          sourceCurrencyCodeValue,
                          priceBreakdown.exchangeRateSourceToInr,
                          receiverInfo,
                          currencyData,
                        );
                      }, 100);
                    } else {
                      console.log(
                        "[ReviewStep] Waiting for Razorpay script to load...",
                      );
                      // Wait for script to load
                      const checkScript = setInterval(() => {
                        if (
                          typeof window !== "undefined" &&
                          (window as any).Razorpay
                        ) {
                          console.log(
                            "[ReviewStep] Razorpay script loaded, initializing...",
                          );
                          setRazorpayScriptLoaded(true);
                          clearInterval(checkScript);
                          initializeRazorpay(
                            totalAmount,
                            sourceCurrencyCodeValue,
                            priceBreakdown.exchangeRateSourceToInr,
                            receiverInfo,
                            currencyData,
                          );
                        }
                      }, 200);
                      setTimeout(() => {
                        clearInterval(checkScript);
                        if (!razorpayScriptLoaded) {
                          console.error(
                            "[ReviewStep] Razorpay script failed to load",
                          );
                          showToast({
                            title: "Error",
                            description:
                              "Payment script failed to load. Please refresh the page.",
                            variant: "destructive",
                          });
                        }
                      }, 10000);
                    }
                  } else {
                    // Bank Transfer: just submit the order
                    onSubmit(currencyData);
                  }
                } else if (!isLinkService) {
                  // Warehouse: no payment for item value; grand total = add-ons only; zeros for charges
                  onSubmit({
                    sourceCurrencyCode: sourceCurrencyCodeValue,
                    destinationCurrencyCode: destinationCurrencyCodeValue,
                    exchangeRateSourceToInr: 1,
                    exchangeRateDestinationToInr: 1,
                    totalGrandTotal: addOnTotal,
                    warehouseHandlingCharge: 0,
                    courierCharge: 0,
                  });
                } else {
                  console.warn(
                    "[ReviewStep] Missing required data for Link service:",
                    {
                      priceBreakdown: !!priceBreakdown,
                      sourceCurrencyCodeValue,
                      destinationCurrencyCodeValue,
                    },
                  );
                  showToast({
                    title: "Error",
                    description: "Please complete all required fields",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isSubmitting || isProcessingPayment}
              className="gap-2"
            >
              {isSubmitting || isProcessingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isProcessingPayment
                    ? "Processing Payment..."
                    : "Processing..."}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {isLinkService && paymentMethod === "Online Payment"
                    ? "Place Order and Pay"
                    : "Place Order"}
                  {isLinkService && priceBreakdown && (
                    <>
                      {" "}
                      ({sourceCurrencyCodeValue}{" "}
                      {formatCurrency(
                        priceBreakdown.totalPriceOrigin +
                          addOnTotal /
                            (priceBreakdown.exchangeRateSourceToInr || 1),
                      )}
                      )
                    </>
                  )}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
