"use client";

import { ShipmentPriceBreakdown } from "@/components/shipments/price-breakdown";
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
import { ArrowLeft, FileText, Loader2, Send } from "lucide-react";

type AddOnId = "gift-wrapper" | "gift-message" | "extra-packing";

interface ReviewStepProps {
  baseAmount: number;
  selectedAddOns: AddOnId[];
  addOnTotal: number;
  priceBreakdown: ShipmentPriceBreakdownType | null;
  isCalculatingBreakdown?: boolean;
  sourceCountryCode?: string;
  destinationCountryCode?: string;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({
  baseAmount,
  selectedAddOns,
  addOnTotal,
  priceBreakdown,
  isCalculatingBreakdown = false,
  sourceCountryCode,
  destinationCountryCode,
  onBack,
  onSubmit,
  isSubmitting,
}: ReviewStepProps) {
  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const { data: sourceCountries } = useSourceCountries();

  const destinationCurrencyCode =
    sourceCountries?.find((country) => country.code === destinationCountryCode)
      ?.currency || "USD";

  const sourceCurrencyCode =
    sourceCountries?.find((country) => country.code === sourceCountryCode)
      ?.currency || "INR";

  // Calculate grand total: itemPriceOrigin + domesticCourier + warehouseHandling + addOnTotal
  const itemPrice = priceBreakdown?.itemPriceOrigin || 0;
  const domesticCourierCharge = priceBreakdown?.domesticCourier || 0;
  const warehouseHandlingCharge = priceBreakdown?.warehouseHandling || 0;
  const grandTotal =
    itemPrice + domesticCourierCharge + warehouseHandlingCharge + addOnTotal;

  return (
    <div className="space-y-6">
      {/* Price Breakdown */}
      {isCalculatingBreakdown && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating price breakdown...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {priceBreakdown && !isCalculatingBreakdown && (
        <ShipmentPriceBreakdown
          breakdown={priceBreakdown}
          sourceCountryCode={sourceCountryCode}
          destinationCountryCode={destinationCountryCode}
          destinationCurrencyCode={destinationCurrencyCode}
          sourceCurrencyCode={sourceCurrencyCode}
        />
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
          {/* Order Summary */}
          <div className="flex flex-col gap-2 rounded-md border border-dashed p-4 text-sm">
            <p className="font-medium text-foreground">Order summary</p>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Items Price</span>
              <span>{formatCurrency(itemPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Domestic Courier Charge</span>
              <span>{formatCurrency(domesticCourierCharge)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Warehouse Handling Charge</span>
              <span>{formatCurrency(warehouseHandlingCharge)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Add-ons ({selectedAddOns.length})</span>
              <span>{formatCurrency(addOnTotal)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-foreground">
              <span className="text-sm font-semibold">Grand Total</span>
              <span className="text-base font-semibold">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

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
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Place Order ({formatCurrency(grandTotal)})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
