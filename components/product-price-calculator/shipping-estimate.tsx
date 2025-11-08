"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Calculator, Package } from "lucide-react";
import type { OriginCountry, ProductCategory } from "@/lib/shipping-rates";
import { getShippingRate, getDomesticShippingDestination } from "@/lib/shipping-rates";
import { formatNumber } from "@/lib/product-price-calculator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ShippingEstimateProps {
  originCountry: OriginCountry;
  category: ProductCategory;
  exchangeRate: number;
  originCurrency: string;
  destinationCurrency: string;
  priceCalculatorTotalLKR: number; // Price Calculator Total in LKR for service charge calculation
}

export function ShippingEstimate({
  originCountry,
  category,
  exchangeRate,
  originCurrency,
  destinationCurrency,
  priceCalculatorTotalLKR,
}: ShippingEstimateProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [weight, setWeight] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [deliveryOption, setDeliveryOption] = useState<"delivery" | "pickup">("delivery");

  // Calculate volume metric weight: (L × W × H) / 5000 (standard formula)
  const calculateVolumeMetricWeight = (): number | null => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (l > 0 && w > 0 && h > 0) {
      return (l * w * h) / 5000; // Volume metric weight in kg
    }
    return null;
  };

  // Calculate shipping estimate using new formula
  const calculateShippingEstimate = () => {
    const weightValue = parseFloat(weight);
    const volumeWeight = calculateVolumeMetricWeight();

    if (!weightValue && !volumeWeight) {
      return null;
    }

    const shippingRatePerKg = getShippingRate(originCountry, category);

    // Calculate weight-based international shipping
    const weightBasedInternational = weightValue > 0 ? weightValue * shippingRatePerKg : 0;

    // Calculate volume-based international shipping
    const volumeBasedInternational = volumeWeight ? volumeWeight * shippingRatePerKg : 0;

    // International Shipping = Max(Weight-based, Volume-based)
    const internationalShipping = Math.max(weightBasedInternational, volumeBasedInternational);

    // Add Colombo Service Charge (15%) directly to International Shipping
    // Service Charge = (International Shipping + Price Calculator Total in LKR) × 15%
    const serviceCharge = (internationalShipping + priceCalculatorTotalLKR) * 0.15;
    const internationalShippingWithService = internationalShipping + serviceCharge;

    // Domestic Shipping in destination country (only if delivery)
    const domesticShipping = deliveryOption === "delivery" 
      ? getDomesticShippingDestination() 
      : 0;

    // Shipping Total = International Shipping (with service charge) + Domestic Shipping
    const shippingTotal = internationalShippingWithService + domesticShipping;

    return {
      weightBasedInternational,
      volumeBasedInternational,
      internationalShipping,
      internationalShippingWithService,
      domesticShipping,
      shippingTotal,
      shippingRatePerKg,
      volumeWeight,
    };
  };

  const estimate = calculateShippingEstimate();

  return (
    <Card className="w-full border-dashed border-2">
      <CardHeader>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Estimate Shipping Charges</CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <p className="text-sm text-muted-foreground mt-2">
          Optional: Get an estimate of international shipping costs based on weight and dimensions
        </p>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Delivery/Pickup Option */}
            <div className="space-y-3">
              <Label>Delivery Option</Label>
              <RadioGroup
                value={deliveryOption}
                onValueChange={(value) => setDeliveryOption(value as "delivery" | "pickup")}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="estimate-delivery" />
                  <Label htmlFor="estimate-delivery" className="font-normal cursor-pointer">
                    Delivery to Address
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="estimate-pickup" />
                  <Label htmlFor="estimate-pickup" className="font-normal cursor-pointer">
                    Pickup from Office
                  </Label>
                </div>
              </RadioGroup>
              
              {/* Office Address Card - Show when pickup is selected */}
              {deliveryOption === "pickup" && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">SRI LANKA OFFICE</h4>
                      <div className="text-sm space-y-1">
                        <p className="font-medium">SUPER SAVE LANKA (PVT) LTD.</p>
                        <p>No.4, COUNCIL AVENUE, (NEAR DEHIWALA MUNICIPAL COUNCIL)</p>
                        <p>DEHIWALA, SRILANKA.</p>
                        <div className="mt-2 space-y-1">
                          <p>
                            <span className="font-medium">Email:</span>{" "}
                            <a href="mailto:info@colombomail.lk" className="text-purple-600 hover:underline">
                              info@colombomail.lk
                            </a>
                          </p>
                          <p>
                            <span className="font-medium">Phone:</span>{" "}
                            <a href="tel:+94114896660" className="text-purple-600 hover:underline">
                              (+94) 114 896 660
                            </a>
                            {", "}
                            <a href="tel:+94755192192" className="text-purple-600 hover:underline">
                              (+94) 755 192 192
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weight Input */}
              <div className="space-y-2">
                <Label htmlFor="estimate-weight">Weight (Kg)</Label>
                <Input
                  id="estimate-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter weight in kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <Label>Dimensions (cm) - Optional</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Width"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Estimate Results */}
          {estimate && (
            <div className="mt-4 space-y-3">
              <Separator />
              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-sm">Shipping Estimate</span>
                </div>

                {estimate.volumeWeight && estimate.volumeWeight > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Volume Metric Weight: </span>
                    <span className="font-medium">{formatNumber(estimate.volumeWeight, 2)} kg</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (L × W × H ÷ 5000)
                    </span>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>International Shipping (includes service charge):</span>
                    <span>
                      {destinationCurrency} {formatNumber(estimate.internationalShippingWithService, 2)}
                    </span>
                  </div>
                  
                  {deliveryOption === "delivery" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Domestic Shipping:</span>
                      <span className="font-medium">
                        {destinationCurrency} {formatNumber(estimate.domesticShipping, 2)}
                      </span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Estimated Shipping Total:</span>
                    <div className="text-right">
                      <p className="font-bold text-lg text-purple-600">
                        {destinationCurrency} {formatNumber(estimate.shippingTotal, 2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({originCurrency} {formatNumber(estimate.shippingTotal / exchangeRate, 2)})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <p>
                    <strong>Note:</strong> This is an estimate only. Final shipping cost will be
                    calculated when the package is received at the warehouse based on actual
                    weight and dimensions. The higher of weight-based or volume-based pricing
                    will be applied.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!estimate && (weight || length || width || height) && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Enter weight or dimensions to see shipping estimate
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

