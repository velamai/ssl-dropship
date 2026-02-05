"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { convertCurrencyByCountryCode, countryCodeToCurrencies, currenciesToCountryCode, getDomesticCourierCharge, getHandlingCharge, getProductPrice } from "@/lib/api/product-price-calculator";
import { formatNumber } from "@/lib/product-price-calculator";
import type { ShipmentPriceBreakdown } from "@/lib/shipment-price-calculator";
import { Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ShippingEstimateCreate } from "../product-price-calculator/shipping-estimate-create";

type ProductPriceBreakDown = {
  productPriceInSourceCountry: number;
  productPriceInDestinationCountry: number;
  warehouseHandlingChargeInSourceCountry: number;
  warehouseHandlingChargeInDestinationCountry: number;
  courierChargeInSourceCountry: number;
  courierChargeInDestinationCountry: number;
};
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
  items = [],
}: ShipmentPriceBreakdownProps) {

  const [productPriceBreakdown, setProductPriceBreakdown] = useState<ProductPriceBreakDown | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceBreakdown = async () => {
      if (
        !destinationCountryCode ||
        !sourceCountryCode
      ) {
        return;
      }

      setIsLoadingBreakdown(true);
      setBreakdownError(null);

      try {
        const fromCountry = sourceCountryCode;
        const toCountry = destinationCountryCode;

        // Convert each item to source currency before summing (handles mixed currencies)
        const uniqueCurrencies = [...new Set(items.map((i) => i.valueCurrency || "INR"))];
        const ratesToSource: Record<string, number> = {};
        await Promise.all(
          uniqueCurrencies.map(async (currency) => {
            const itemCountryCode = currenciesToCountryCode(currency);
            const rate = await convertCurrencyByCountryCode({
              sourceCountryCode: itemCountryCode,
              destinationCountryCode: sourceCountryCode,
              amount: null,
            });
            ratesToSource[currency] = rate || 1;
          })
        );

        const totalProductPriceInSource = items.reduce((sum, item) => {
          const itemTotal = (item.price || 0) * (item.quantity || 1);
          const rate = ratesToSource[item.valueCurrency || "INR"] || 1;
          return sum + itemTotal * rate;
        }, 0);

        const sourceCurrency = countryCodeToCurrencies(sourceCountryCode) || "INR";

        // Call all three API functions in parallel - use totalProductPriceInSource with source currency
        const [productPriceData, handlingChargeData, courierChargeData] =
          await Promise.all([
            getProductPrice({
              productPrice: totalProductPriceInSource,
              fromCountry: sourceCountryCode,
              toCountry: destinationCountryCode,
              productPriceCurrency: sourceCurrency,
            }),
            getHandlingCharge({
              itemPrice: totalProductPriceInSource,
              itemCurrency: sourceCurrency,
              fromCountry,
              toCountry,
            }),
            getDomesticCourierCharge({
              fromCountry,
              toCountry,
            }),
          ]);

        // Combine results into the state structure
        setProductPriceBreakdown({
          productPriceInSourceCountry: productPriceData.sourceCountryPrice,
          productPriceInDestinationCountry:
            productPriceData.destinationCountryPrice,
          warehouseHandlingChargeInSourceCountry:
            handlingChargeData.sourceCountryPrice,
          warehouseHandlingChargeInDestinationCountry:
            handlingChargeData.destinationCountryPrice,
          courierChargeInSourceCountry: courierChargeData.sourceCountryCharge,
          courierChargeInDestinationCountry:
            courierChargeData.destinationCountryCharge,
        });
      } catch (error) {
        console.error("Error fetching price breakdown:", error);
        setBreakdownError(
          error instanceof Error
            ? error.message
            : "Failed to fetch price breakdown",
        );
      } finally {
        setIsLoadingBreakdown(false);
      }
    };

    fetchPriceBreakdown();
  }, [destinationCountryCode, sourceCountryCode, items]);


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {isLoadingBreakdown && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading price breakdown...</span>
          </div>
        )}

        {/* Product Information */}
        {!isLoadingBreakdown && (
          <>
            {/* Item Price */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Item Price</span>
                <div className="text-right">
                  {productPriceBreakdown?.productPriceInSourceCountry && (
                    <p className="font-semibold">
                      {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.productPriceInSourceCountry
                      )}
                    </p>
                  )}

                  {productPriceBreakdown?.productPriceInDestinationCountry && (
                    <p className="text-sm text-muted-foreground">
                      {countryCodeToCurrencies(destinationCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.productPriceInDestinationCountry
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Domestic Courier Charge */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Domestic Courier Charge</span>
                <div className="text-right">
                  {/* handlingChargeData */}

                  {productPriceBreakdown?.courierChargeInSourceCountry && (
                    <p className="font-semibold">
                      {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.courierChargeInSourceCountry,
                        2,
                      )}
                    </p>
                  )}
                  {productPriceBreakdown?.courierChargeInDestinationCountry && (
                    <p className="text-sm text-muted-foreground">
                      {countryCodeToCurrencies(destinationCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.courierChargeInDestinationCountry,
                        2,
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Warehouse Handling Charges */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Warehouse Handling Charges</span>
                <div className="text-right">
                  {productPriceBreakdown?.warehouseHandlingChargeInSourceCountry && (
                    <p className="font-semibold">
                      {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.warehouseHandlingChargeInSourceCountry,
                      )}
                    </p>
                  )}
                  {productPriceBreakdown?.warehouseHandlingChargeInDestinationCountry && (
                    <p className="text-sm text-muted-foreground">
                      {countryCodeToCurrencies(destinationCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.warehouseHandlingChargeInDestinationCountry,
                      )}
                    </p>
                  )}
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
                  {productPriceBreakdown &&
                    productPriceBreakdown.productPriceInSourceCountry &&
                    productPriceBreakdown.courierChargeInSourceCountry &&
                    productPriceBreakdown.warehouseHandlingChargeInSourceCountry && (
                      <p className="font-bold text-lg">
                        {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                        {formatNumber(
                          productPriceBreakdown.productPriceInSourceCountry +
                          productPriceBreakdown.courierChargeInSourceCountry +
                          productPriceBreakdown.warehouseHandlingChargeInSourceCountry,
                        )}
                      </p>
                    )}
                  {productPriceBreakdown &&
                    productPriceBreakdown.productPriceInDestinationCountry &&
                    productPriceBreakdown.courierChargeInDestinationCountry &&
                    productPriceBreakdown.warehouseHandlingChargeInDestinationCountry && (
                      <p className="text-sm font-semibold">
                        {countryCodeToCurrencies(destinationCountryCode || "")}{" "}
                        {formatNumber(
                          productPriceBreakdown.productPriceInDestinationCountry +
                          productPriceBreakdown.courierChargeInDestinationCountry +
                          productPriceBreakdown.warehouseHandlingChargeInDestinationCountry,
                        )}
                      </p>
                    )}
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
        )}
      </CardContent>

      <div className="px-6 pb-6">
        <ShippingEstimateCreate sourceCountryCode={sourceCountryCode || ""} destinationCountryCode={destinationCountryCode || ""} />
      </div>
    </Card>
  );
}
