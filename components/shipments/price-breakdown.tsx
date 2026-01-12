"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/lib/product-price-calculator";
import type { ShipmentPriceBreakdown } from "@/lib/shipment-price-calculator";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";

interface ShipmentPriceBreakdownProps {
  breakdown: ShipmentPriceBreakdown;
  sourceCountryCode?: string;
  destinationCountryCode?: string;
  destinationCurrencyCode?: string;
  sourceCurrencyCode?: string;
}

const supabase = getSupabaseBrowserClient();
export function ShipmentPriceBreakdown({
  breakdown,
  sourceCountryCode,
  destinationCountryCode,
  destinationCurrencyCode,
  sourceCurrencyCode,
}: ShipmentPriceBreakdownProps) {
  const {
    itemPriceOrigin,
    domesticCourier,
    warehouseHandling,
    totalPriceOrigin,
    originCurrency,
  } = breakdown;

  const { data: exchangeRateData } = useQuery({
    queryKey: ["exchange-rate", sourceCurrencyCode, destinationCurrencyCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exchange_rates")
        .select("rate")
        .eq("from_currency", sourceCurrencyCode)
        .eq("to_currency", destinationCurrencyCode)
        .eq("is_active", true)
        .order("effective_date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching exchange rate:", error);
        return null;
      }

      return data?.rate || null;
    },
    enabled: !!sourceCurrencyCode && !!destinationCurrencyCode,
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Item Price */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium">Item Price</span>
            <div className="text-right">
              <p className="font-semibold">
                {originCurrency} {formatNumber(itemPriceOrigin, 2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {destinationCurrencyCode}{" "}
                {formatNumber(itemPriceOrigin * (exchangeRateData || 0), 2)}
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
                {originCurrency} {formatNumber(domesticCourier, 2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {destinationCurrencyCode}{" "}
                {formatNumber(domesticCourier * (exchangeRateData || 0), 2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">
            (Fixed amount: {originCurrency} {formatNumber(domesticCourier, 2)})
          </p>
        </div>

        <Separator />

        {/* Warehouse Handling Charges */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium">Warehouse Handling Charges</span>
            <div className="text-right">
              <p className="font-semibold">
                {originCurrency} {formatNumber(warehouseHandling, 2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {destinationCurrencyCode}{" "}
                {formatNumber(warehouseHandling * (exchangeRateData || 0), 2)}
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
                {originCurrency} {formatNumber(totalPriceOrigin, 2)}
              </p>
              <p className="text-sm font-semibold">
                {destinationCurrencyCode}{" "}
                {formatNumber(totalPriceOrigin * (exchangeRateData || 0), 2)}
              </p>
            </div>
          </div>
          {/* <p className="text-xs text-muted-foreground text-right mt-1">
            {isDestinationInSourceList === false && originToUsdRate ? (
              <>
                (Exchange Rate via USD: {originCurrency}1 = USD{" "}
                {formatNumber(originToUsdRate, 4)} = {destinationCurrencyCode}{" "}
                {formatNumber(exchangeRateData || 0, 4)})
              </>
            ) : (
              <>
                (Exchange Rate {originCurrency}1 = {destinationCurrency}{" "}
                {formatNumber(exchangeRateData || 0, 4)})
              </>
            )}
          </p> */}
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
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
