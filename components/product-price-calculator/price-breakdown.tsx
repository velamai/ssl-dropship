"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { PriceBreakdown as PriceBreakdownType } from "@/lib/product-price-calculator";
import { formatNumber } from "@/lib/product-price-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Info, Loader2 } from "lucide-react";
import { ShippingEstimate } from "./shipping-estimate";
import type { ProductCategory } from "@/lib/shipping-rates";
import { getCountryCode } from "@/lib/shipping-rates";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import {
  getHandlingCharge,
  getDomesticCourierCharge,
  getProductPrice,
  countryCodeToCurrencies,
} from "@/lib/api/product-price-calculator";

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
  sourceCountryCode?: string;
  productPrice: number | null;
  productName: string;
  quantity: number;
  originCountry:
  | "india"
  | "malaysia"
  | "dubai"
  | "us"
  | "srilanka"
  | "singapore";
  category: ProductCategory;
  destinationCountryCode?: string;
}

type ProductPriceBreakDown = {
  productPriceInSourceCountry: number;
  productPriceInDestinationCountry: number;
  warehouseHandlingChargeInSourceCountry: number;
  warehouseHandlingChargeInDestinationCountry: number;
  courierChargeInSourceCountry: number;
  courierChargeInDestinationCountry: number;
};

export function PriceBreakdown({
  breakdown,
  productName,
  quantity,
  originCountry,
  category,
  productPrice,
  destinationCountryCode = "LK",
  sourceCountryCode,
}: PriceBreakdownProps) {

  const [productPriceBreakdown, setProductPriceBreakdown] =
    useState<ProductPriceBreakDown | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceBreakdown = async () => {
      if (
        !destinationCountryCode ||
        !sourceCountryCode ||
        !productPrice ||
        !quantity
      ) {
        return;
      }

      setIsLoadingBreakdown(true);
      setBreakdownError(null);

      try {
        const fromCountry = sourceCountryCode || getCountryCode(originCountry);
        const toCountry = destinationCountryCode;
        const productPriceCurrency = breakdown.originCurrency;

        // Call all three API functions in parallel
        const [productPriceData, handlingChargeData, courierChargeData] =
          await Promise.all([
            getProductPrice({
              productPrice: productPrice,
              fromCountry: sourceCountryCode,
              toCountry: destinationCountryCode,
              productPriceCurrency: "INR",
            }),
            getHandlingCharge({
              itemPrice: productPrice,
              itemCurrency: productPriceCurrency,
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
  }, [destinationCountryCode, sourceCountryCode, productPrice, quantity]);

  const router = useRouter();
  const { user, isLoading } = useAuth();
  const {
    exchangeRate,
    originCurrency,
    destinationCurrency,
  } = breakdown;

  const handlePlaceOrder = () => {
    // Wait for auth to finish loading
    if (isLoading) {
      return;
    }

    // Check if user is authenticated
    if (user) {
      // User is logged in, redirect to create shipments
      router.push("/create-shipments");
    } else {
      // User is not logged in, redirect to login page with redirect parameter
      router.push(`/login?redirect=${encodeURIComponent("/create-shipments")}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading State */}
        {isLoadingBreakdown && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading price breakdown...</span>
          </div>
        )}

        {/* Product Information */}
        {!isLoadingBreakdown && (
          <>
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold text-lg mb-2">Product</h3>
                <p className="text-sm text-muted-foreground">{productName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Item Quantity</span>
                  <p className="font-medium">{quantity}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Item Price */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Item Price</span>
                <div className="text-right">
                  {productPriceBreakdown?.productPriceInSourceCountry && (
                    <p className="font-semibold">
                      {countryCodeToCurrencies(sourceCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.productPriceInSourceCountry *
                        quantity,
                        2,
                      )}
                    </p>
                  )}

                  {productPriceBreakdown?.productPriceInDestinationCountry && (
                    <p className="text-sm text-muted-foreground">
                      {countryCodeToCurrencies(destinationCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.productPriceInDestinationCountry *
                        quantity,
                        2,
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
                        productPriceBreakdown?.warehouseHandlingChargeInSourceCountry * quantity,
                        2,
                      )}
                    </p>
                  )}
                  {productPriceBreakdown?.warehouseHandlingChargeInDestinationCountry && (
                    <p className="text-sm text-muted-foreground">
                      {countryCodeToCurrencies(destinationCountryCode || "")}{" "}
                      {formatNumber(
                        productPriceBreakdown?.warehouseHandlingChargeInDestinationCountry * quantity,
                        2,
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
                          productPriceBreakdown.productPriceInSourceCountry *
                          quantity +
                          productPriceBreakdown.courierChargeInSourceCountry +
                          productPriceBreakdown.warehouseHandlingChargeInSourceCountry,
                          2,
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
                          productPriceBreakdown.productPriceInDestinationCountry *
                          quantity +
                          productPriceBreakdown.courierChargeInDestinationCountry +
                          productPriceBreakdown.warehouseHandlingChargeInDestinationCountry,
                          2,
                        )}
                      </p>
                    )}
                </div>
              </div>
              {exchangeRate && (
                <p className="text-xs text-muted-foreground text-right mt-1">
                  (Exchange Rate {countryCodeToCurrencies(sourceCountryCode || "")}1
                  = {countryCodeToCurrencies(destinationCountryCode || "")}{" "}
                  {formatNumber(exchangeRate, 2)})
                </p>
              )}
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

            {/* Place Order Button */}
            <Button
              onClick={handlePlaceOrder}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Place Order
            </Button>
          </>
        )}
      </CardContent>

      {/* Shipping Estimate Component */}
      <div className="px-6 pb-6">
        <ShippingEstimate
          originCountry={originCountry}
          category={category}
          exchangeRate={exchangeRate}
          originCurrency={originCurrency}
          destinationCurrency={destinationCurrency}
          priceCalculatorTotalLKR={breakdown.priceCalculatorTotalLKR}
          destinationCountryCode={destinationCountryCode}
          shipmentType="export"
          originCountryCode={sourceCountryCode}
        />
      </div>
    </Card>
  );
}
