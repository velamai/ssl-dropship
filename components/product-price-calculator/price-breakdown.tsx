"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { PriceBreakdown as PriceBreakdownType } from "@/lib/product-price-calculator";
import { formatNumber } from "@/lib/product-price-calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
  productName: string;
  weight: number;
  quantity: number;
}

export function PriceBreakdown({ breakdown, productName, weight, quantity }: PriceBreakdownProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const {
    productPriceOrigin,
    productPriceLKR,
    shippingAndHandlingLKR,
    totalPriceLKR,
    totalPriceOrigin,
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
        {/* Product Information */}
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-lg mb-2">Product</h3>
            <p className="text-sm text-muted-foreground">{productName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Weight (Kg)</span>
              <p className="font-medium">{formatNumber(weight, 2)}</p>
            </div>
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
              <p className="font-semibold">
                {originCurrency} {formatNumber(productPriceOrigin, 2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {destinationCurrency} {formatNumber(productPriceLKR, 2)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Shipping + Duties + Handling */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium">Shipping + Duties + Handling</span>
            <div className="text-right">
              <p className="font-semibold">
                {originCurrency} {formatNumber(shippingAndHandlingLKR / breakdown.exchangeRate, 2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {destinationCurrency} {formatNumber(shippingAndHandlingLKR, 2)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Total Price */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Total Price</span>
            <div className="text-right">
              <p className="font-bold text-lg">
                {originCurrency} {formatNumber(totalPriceOrigin, 2)}
              </p>
              <p className="text-sm font-semibold">
                {destinationCurrency} {formatNumber(totalPriceLKR, 2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">
            (Exchange Rate {originCurrency}1 = {destinationCurrency} {formatNumber(exchangeRate, 2)})
          </p>
        </div>

        <Separator />

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Place Order
        </Button>
      </CardContent>
    </Card>
  );
}

