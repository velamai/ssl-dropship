"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { countryCodeToCurrencies } from "@/lib/api/product-price-calculator";
import { formatNumber } from "@/lib/product-price-calculator";
import type { ShipmentPriceBreakdown } from "@/lib/shipment-price-calculator";
import { Info } from "lucide-react";
import { ShippingEstimateCreate } from "../product-price-calculator/shipping-estimate-create";
export type ShipmentItem = {
  uuid: string;
  productUrl: string;
  productName: string;
  productNote?: string;
  price?: number;
  valueCurrency: string;
  quantity?: number;
};
interface ShipmentPriceBreakdownProps {
  breakdown: ShipmentPriceBreakdown;
  sourceCountryCode?: string;
  destinationCountryCode?: string;
  destinationCurrencyCode?: string;
  sourceCurrencyCode?: string;
  items?: ShipmentItem[]; // Product items array
}

export function ShipmentPriceBreakdown({
  breakdown,
  sourceCountryCode,
  destinationCountryCode,
}: ShipmentPriceBreakdownProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Information - uses breakdown from page */}
        <>
            {/* Item Price - use breakdown from page (single source of truth) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Item Price</span>
                <div className="text-right">
                  <p className="font-semibold">
                    {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                    {formatNumber(breakdown.itemPriceOrigin)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Domestic Courier Charge */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Domestic Courier Charge</span>
                <div className="text-right">
                  <p className="font-semibold">
                    {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                    {formatNumber(breakdown.domesticCourier, 2)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Warehouse Handling Charges */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Warehouse Handling Charges</span>
                <div className="text-right">
                  <p className="font-semibold">
                    {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                    {formatNumber(breakdown.warehouseHandling)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total Price */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">
                  Total Price (before shipping)
                </span>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                    {formatNumber(breakdown.totalPriceOrigin)}
                  </p>
                </div>
              </div>
              {/* {exchangeRate && (
                <p className="text-xs text-muted-foreground text-right mt-1">
                  (Exchange Rate {countryCodeToCurrencies(sourceCountryCode || "")}1
                  = {countryCodeToCurrencies(destinationCountryCode || "")}{" "}
                  {formatNumber(exchangeRate, 2)})
                </p>
              )} */}
            </div>

            <Separator />

            {/* Notification */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <p className="font-semibold mb-2">Price Calculation:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>
                    The base price includes item cost, domestic shipping charges,
                    and warehouse handling charges.
                  </li>
                  <li>
                    International shipping costs will be calculated separately when
                    the package is received at the warehouse based on actual weight
                    and dimensions.
                  </li>
                  <li className="font-semibold">
                    You can use our shipping calculator below to estimate shipping
                    costs.
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
        </>
      </CardContent>

      <div className="px-6 pb-6">
        <ShippingEstimateCreate sourceCountryCode={sourceCountryCode || ""} destinationCountryCode={destinationCountryCode || ""} />
      </div>
    </Card>
  );
}
