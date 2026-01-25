"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { fetchCourierServicesByType, fetchCurrencies } from "@/lib/api-client";
import { convertCurrencyByCountryCode, countryCodeToCurrencies, productPriceCalculatorApi } from "@/lib/api/product-price-calculator";
import { calculatePrice, type CourierService, type Currency, type PriceCalculationResult } from "@/lib/price-calculator";
import { formatNumber } from "@/lib/product-price-calculator";
import type { OriginCountry, ProductCategory } from "@/lib/shipping-rates";
import { getCountryCode, getDomesticShippingDestination, getServiceChargePercentage, getShippingRate } from "@/lib/shipping-rates";
import { cn } from "@/lib/utils";
import { Calculator, ChevronDown, ChevronUp, Loader2, Package } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ShippingEstimateProps {
  originCountry: OriginCountry;
  category: ProductCategory;
  exchangeRate: number;
  originCurrency: string;
  destinationCurrency: string;
  priceCalculatorTotalLKR: number; // Price Calculator Total in LKR for service charge calculation
  destinationCountryCode?: string; // ISO country code for destination
  shipmentType?: "import" | "export"; // Shipment type for courier service filtering
  originCountryCode?: string; // ISO country code for origin (for calculatePrice)
}

type ExchangeRate = {
  sourceCountryExchangeRate: number;
  destinationCountryExchangeRate: number;
}

export function ShippingEstimate({
  originCountry,
  category,
  exchangeRate,
  originCurrency,
  destinationCurrency,
  priceCalculatorTotalLKR,
  destinationCountryCode = "LK",
  shipmentType = "export",
  originCountryCode,
}: ShippingEstimateProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [weight, setWeight] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [deliveryOption, setDeliveryOption] = useState<"delivery" | "pickup">("delivery");
  const [shippingRatePerKg, setShippingRatePerKg] = useState<number | null>(null);
  const [domesticShipping, setDomesticShipping] = useState<number | null>(null);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(15);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRate | null>(null);
  const [isLoadingExchangeRateData, setIsLoadingExchangeRateData] = useState(false);

  // Get origin country code
  const originCode = useMemo(() => {
    if (originCountryCode) return originCountryCode;
    return getCountryCode(originCountry);
  }, [originCountry, originCountryCode]);

  console.log({ originCountryCode });


  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!originCode || !destinationCountryCode) {
        setExchangeRateData(null);
        return;
      }

      setIsLoadingExchangeRateData(true);
      try {
        const [sourceCountryExchangeRate, destinationCountryExchangeRate] = await Promise.all([
          convertCurrencyByCountryCode({
            amount: null,
            sourceCountryCode: "IN",
            destinationCountryCode: originCountryCode || "",
          }),
          convertCurrencyByCountryCode({
            amount: null,
            sourceCountryCode: "IN",
            destinationCountryCode: destinationCountryCode,
          }),
        ]);

        setExchangeRateData({
          sourceCountryExchangeRate: sourceCountryExchangeRate || 1,
          destinationCountryExchangeRate: destinationCountryExchangeRate || 1,
        });
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        setExchangeRateData(null);
      } finally {
        setIsLoadingExchangeRateData(false);
      }
    };

    fetchExchangeRate();
  }, [originCode, destinationCountryCode]);

  // Courier service pricing state
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoadingCourierPrices, setIsLoadingCourierPrices] = useState(false);
  const [courierPriceResult, setCourierPriceResult] = useState<PriceCalculationResult | null>(null);

  // Receiving country pricing state (for IN, MY, LK, AE, GB destinations)
  const [exchangeRatePrice, setExchangeRatePrice] = useState<number | null>(null);
  const [isLoadingExchangeRate, setIsLoadingExchangeRate] = useState(false);

  // Converted prices state (INR -> source and destination currencies)
  const [convertedPrices, setConvertedPrices] = useState<Map<string, { sourcePrice: number | null; destinationPrice: number | null }>>(new Map());
  const [isConvertingPrices, setIsConvertingPrices] = useState(false);

  // Countries that use drop_and_ship_receiving_country_price table for pricing
  const useReceivingCountryPriceCountries = ["IN", "MY", "LK", "AE", "GB"];
  const shouldUseExchangeRate = useReceivingCountryPriceCountries.includes(destinationCountryCode);

  // Calculate volume metric weight: (L × W × H) / 5000 (standard formula)
  const calculateVolumeMetricWeight = (): number | null => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (l > 0 && w > 0 && h > 0) {
      return (l * w * h) / 5000;
    }
    return null;
  };

  // Load shipping rates on mount and when dependencies change
  useEffect(() => {
    const loadRates = async () => {
      setIsLoadingRates(true);
      try {
        const [rate, domestic, servicePercent] = await Promise.all([
          getShippingRate(originCountry, category, destinationCountryCode),
          getDomesticShippingDestination(destinationCountryCode),
          getServiceChargePercentage(),
        ]);
        setShippingRatePerKg(rate);
        setDomesticShipping(domestic);
        setServiceChargePercent(servicePercent);
      } catch (error) {
        console.error("Error loading shipping rates:", error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    loadRates();
  }, [originCountry, category, destinationCountryCode]);

  // Load courier services and currencies
  useEffect(() => {
    const loadCourierData = async () => {
      try {
        const [courierData, currencyData] = await Promise.all([
          fetchCourierServicesByType(shipmentType),
          fetchCurrencies(),
        ]);
        setCourierServices(courierData);
        setCurrencies(currencyData);
      } catch (error) {
        console.error("Error loading courier services:", error);
      }
    };

    loadCourierData();
  }, [shipmentType]);


  // Calculate price using drop_and_ship_receiving_country_price table for specific countries
  useEffect(() => {
    const calculateReceivingCountryPrice = async () => {
      if (!shouldUseExchangeRate || !weight || !originCode) {
        setExchangeRatePrice(null);
        return;
      }

      setIsLoadingExchangeRate(true);
      try {
        const weightInKg = parseFloat(weight);
        if (isNaN(weightInKg) || weightInKg <= 0) {
          setExchangeRatePrice(null);
          return;
        }

        // Fetch price_per_kg from drop_and_ship_receiving_country_price table
        // Price is in INR
        const pricePerKg = await productPriceCalculatorApi.getReceivingCountryPrice(
          originCode,
          destinationCountryCode
        );

        if (pricePerKg !== null) {
          // Price = weight (kg) * price_per_kg (INR per kg)
          const price = weightInKg * pricePerKg;
          setExchangeRatePrice(price);
        } else {
          setExchangeRatePrice(null);
        }
      } catch (error) {
        console.error("Error calculating receiving country price:", error);
        setExchangeRatePrice(null);
      } finally {
        setIsLoadingExchangeRate(false);
      }
    };

    calculateReceivingCountryPrice();
  }, [weight, originCode, destinationCountryCode, shouldUseExchangeRate]);

  // Calculate courier service prices when weight/dimensions change
  // Only calculate if NOT using exchange rate pricing
  useEffect(() => {
    const calculateCourierPrices = async () => {
      // Skip if using exchange rate pricing (for IN, MY, LK, AE, GB)
      if (shouldUseExchangeRate) {
        setCourierPriceResult(null);
        return;
      }

      if (!weight || courierServices.length === 0 || currencies.length === 0 || !originCode) {
        setCourierPriceResult(null);
        return;
      }

      setIsLoadingCourierPrices(true);
      try {
        const weightInGrams = parseFloat(weight) * 1000; // Convert kg to grams

        // Calculate volume in cm³
        let volume = 0;
        if (length && width && height) {
          const l = parseFloat(length);
          const w = parseFloat(width);
          const h = parseFloat(height);
          if (l > 0 && w > 0 && h > 0) {
            volume = l * w * h; // Volume in cm³
          }
        }

        // Determine from/to countries based on shipment type
        const fromCountry = shipmentType === "export" ? originCode : destinationCountryCode;
        const toCountry = shipmentType === "export" ? destinationCountryCode : originCode;

        const calculationInput = {
          from: fromCountry,
          selected_to: toCountry,
          selected_courier_service: null, // Show all courier services
          selected_type: shipmentType,
          selected_weight: weightInGrams,
          selected_volume: volume,
          currency: currencies,
          Allcourierservicesdata: courierServices,
        };

        const result = calculatePrice(calculationInput);
        setCourierPriceResult(result);
      } catch (error) {
        console.error("Error calculating courier prices:", error);
        setCourierPriceResult(null);
      } finally {
        setIsLoadingCourierPrices(false);
      }
    };

    calculateCourierPrices();
  }, [weight, length, width, height, courierServices, currencies, originCode, destinationCountryCode, shipmentType, shouldUseExchangeRate]);

  // Sort courier prices by final price
  const sortedCourierPrices = useMemo(() => {
    if (!courierPriceResult?.prices) return [];
    return [...courierPriceResult.prices].sort(
      (a, b) => (a.finalPrice || 0) - (b.finalPrice || 0)
    );
  }, [courierPriceResult]);

  // Convert INR prices to source and destination currencies
  useEffect(() => {
    const convertPrices = async () => {
      if (sortedCourierPrices.length === 0 || !originCode) {
        setConvertedPrices(new Map());
        return;
      }

      setIsConvertingPrices(true);
      const newConvertedPrices = new Map<string, { sourcePrice: number | null; destinationPrice: number | null }>();

      try {
        await Promise.all(
          sortedCourierPrices.map(async (servicePrice) => {
            const inrPrice = servicePrice.finalPrice || 0;
            const serviceId = servicePrice.courier_service_id;

            // Convert from INR (country code "IN") to source currency (originCode)
            const sourcePrice = await convertCurrencyByCountryCode({
              amount: inrPrice,
              sourceCountryCode: "IN",
              destinationCountryCode: originCode,
            });

            // Convert from INR (country code "IN") to destination currency (destinationCountryCode)
            const destPrice = await convertCurrencyByCountryCode({
              amount: inrPrice,
              sourceCountryCode: "IN",
              destinationCountryCode: destinationCountryCode,
            });

            newConvertedPrices.set(serviceId, {
              sourcePrice,
              destinationPrice: destPrice,
            });
          })
        );

        setConvertedPrices(newConvertedPrices);
      } catch (error) {
        console.error("Error converting prices:", error);
      } finally {
        setIsConvertingPrices(false);
      }
    };

    convertPrices();
  }, [sortedCourierPrices, originCode, destinationCountryCode]);

  // Currency formatting helper
  const formatCurrencyAmount = useCallback((amount: number, currencyCode: string = destinationCurrency) => {
    const formatter = new Intl.NumberFormat(
      currencyCode === "INR" ? "en-IN" : "en-US",
      {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
      }
    );
    return formatter.format(amount);
  }, [destinationCurrency]);

  // Calculate shipping estimate using new formula
  const calculateShippingEstimate = () => {
    if (shippingRatePerKg === null || domesticShipping === null) {
      return null;
    }

    const weightValue = parseFloat(weight);
    const volumeWeight = calculateVolumeMetricWeight();

    if (!weightValue && !volumeWeight) {
      return null;
    }

    // Calculate weight-based international shipping
    const weightBasedInternational = weightValue > 0 ? weightValue * shippingRatePerKg : 0;

    // Calculate volume-based international shipping
    const volumeBasedInternational = volumeWeight ? volumeWeight * shippingRatePerKg : 0;

    // International Shipping = Max(Weight-based, Volume-based)
    const internationalShipping = Math.max(weightBasedInternational, volumeBasedInternational);

    // Add Service Charge to International Shipping
    // Service Charge = (International Shipping + Price Calculator Total in LKR) × percentage
    const serviceCharge = (internationalShipping + priceCalculatorTotalLKR) * (serviceChargePercent / 100);
    const internationalShippingWithService = internationalShipping + serviceCharge;

    // Domestic Shipping in destination country (only if delivery)
    const domesticShippingAmount = deliveryOption === "delivery" ? domesticShipping : 0;

    // Shipping Total = International Shipping (with service charge) + Domestic Shipping
    const shippingTotal = internationalShippingWithService + domesticShippingAmount;

    return {
      weightBasedInternational,
      volumeBasedInternational,
      internationalShipping,
      internationalShippingWithService,
      domesticShipping: domesticShippingAmount,
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

          {/* Loading State */}
          {(isLoadingRates || isLoadingCourierPrices || isLoadingExchangeRate || isLoadingExchangeRateData) && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading shipping rates...</span>
            </div>
          )}

          {/* Exchange Rate Pricing Display (for IN, MY, LK, AE, GB) */}
          {shouldUseExchangeRate && !isLoadingExchangeRate && exchangeRatePrice !== null && (
            <div className="mt-4 space-y-4">
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-base">Shipping Price</span>
                </div>

                {/* Volume Weight Display */}
                {length && width && height && parseFloat(length) > 0 && parseFloat(width) > 0 && parseFloat(height) > 0 && (
                  <div className="text-sm bg-purple-50 rounded-lg p-3">
                    <span className="text-muted-foreground">Volume Metric Weight: </span>
                    <span className="font-medium">
                      {formatNumber((parseFloat(length) * parseFloat(width) * parseFloat(height)) / 5000, 2)} kg
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (L × W × H ÷ 5000)
                    </span>
                  </div>
                )}

                {/* Price Card */}
                <Card className="border-2 border-purple-500 bg-purple-50/30 transition-all hover:shadow-lg">
                  <CardContent className="p-6 flex flex-col items-center">
                    <div className="w-full">
                      {/* Price */}
                      <div className="text-center mb-2">
                        <p className="text-3xl font-bold text-purple-600">
                          {destinationCurrency} {formatNumber(exchangeRatePrice, 2)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Weight: {formatNumber(parseFloat(weight), 2)} kg
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Note */}
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <p>
                    <strong>Note:</strong> Prices are calculated based on weight using receiving country rates. All prices are in INR and are estimates. Final charges may vary after courier verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* All Courier Services Display */}
          {!shouldUseExchangeRate && !isLoadingCourierPrices && sortedCourierPrices.length > 0 && (
            <div className="mt-4 space-y-4">
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-base">Courier Service Prices</span>
                </div>

                {/* Volume Weight Display */}
                {length && width && height && parseFloat(length) > 0 && parseFloat(width) > 0 && parseFloat(height) > 0 && (
                  <div className="text-sm bg-purple-50 rounded-lg p-3">
                    <span className="text-muted-foreground">Volume Metric Weight: </span>
                    <span className="font-medium">
                      {formatNumber((parseFloat(length) * parseFloat(width) * parseFloat(height)) / 5000, 2)} kg
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (L × W × H ÷ 5000)
                    </span>
                  </div>
                )}

                {/* All Courier Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedCourierPrices.map((servicePrice, index) => {
                    const serviceId = servicePrice.courier_service_id;
                    const convertedPrice = convertedPrices.get(serviceId);

                    // Get currency codes for display
                    const sourceCurrencyCode = countryCodeToCurrencies(originCode);
                    const destinationCurrencyCode = countryCodeToCurrencies(destinationCountryCode);

                    // Use converted prices if available, otherwise fallback to original logic
                    const sourcePrice = convertedPrice?.sourcePrice ?? servicePrice.finalPrice ?? 0;
                    const destinationPrice = convertedPrice?.destinationPrice ?? servicePrice.finalPrice ?? 0;

                    const sourcePriceDisplay = formatCurrencyAmount(
                      sourcePrice,
                      sourceCurrencyCode
                    );

                    const destinationPriceDisplay = formatCurrencyAmount(
                      destinationPrice,
                      destinationCurrencyCode
                    );

                    const isBestPrice = index === 0;

                    return (
                      <Card
                        key={servicePrice.courier_service_id}
                        className={cn(
                          "border-2 transition-all hover:shadow-lg flex flex-col",
                          isBestPrice
                            ? "border-purple-500 bg-purple-50/30"
                            : "border-purple-100 bg-white"
                        )}
                      >
                        <CardContent className="p-4 flex flex-col flex-1">
                          <div className="flex flex-col gap-2 flex-1 relative">
                            {/* Best Price Badge */}
                            {isBestPrice && (
                              <div className="absolute -top-3 -left-3 inline-flex items-center rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white w-fit z-10">
                                Best Price
                              </div>
                            )}

                            {/* Company Name */}
                            <h3
                              className={cn(
                                "text-sm md:text-base font-semibold text-gray-800 text-center",
                                isBestPrice && "pt-3"
                              )}
                            >
                              {(() => {
                                const name = servicePrice.name;
                                if (
                                  (name.includes("Singapore Simple") ||
                                    name.includes("Singapore Smart")) &&
                                  name.includes("(")
                                ) {
                                  const splitIndex = name.indexOf("(");
                                  const firstPart = name.substring(0, splitIndex).trim();
                                  const secondPart = name.substring(splitIndex).trim();
                                  return (
                                    <>
                                      {firstPart}
                                      <br />
                                      {secondPart}
                                    </>
                                  );
                                }
                                return name;
                              })()}
                            </h3>

                            {/* Logo */}
                            <div className="flex justify-center">
                              {servicePrice.image_url ? (
                                <div className="relative size-32">
                                  <Image
                                    src={servicePrice.image_url}
                                    alt={servicePrice.name}
                                    fill
                                    className="object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="h-32 w-32 flex-shrink-0 flex items-center justify-center bg-purple-100 rounded-lg">
                                  <Package className="h-12 w-12 text-purple-600" />
                                </div>
                              )}
                            </div>

                            {/* Price */}
                            <div className="text-center">
                              <div className="space-y-1">
                                {isLoadingExchangeRateData ? (
                                  <div className="flex items-center justify-center gap-2 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Loading exchange rates...</span>
                                  </div>
                                ) : (
                                  <>
                                    {exchangeRateData && servicePrice.finalPrice ? (
                                      <>
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-0.5">
                                            Source ({sourceCurrencyCode})
                                          </p>
                                          <p className="text-lg font-bold text-gray-900">
                                            {formatCurrencyAmount(
                                              (servicePrice.finalPrice || 0) * exchangeRateData.sourceCountryExchangeRate,
                                              sourceCurrencyCode
                                            )}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-0.5 mt-2">
                                            Destination ({destinationCurrencyCode})
                                          </p>
                                          <p className="text-base font-semibold text-gray-700">
                                            {formatCurrencyAmount(
                                              (servicePrice.finalPrice || 0) * exchangeRateData.destinationCountryExchangeRate,
                                              destinationCurrencyCode
                                            )}
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        {convertedPrice?.sourcePrice !== null && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">
                                              Source ({sourceCurrencyCode})
                                            </p>
                                            <p className="text-lg font-bold text-gray-900">
                                              {sourcePriceDisplay}
                                            </p>
                                          </div>
                                        )}
                                        {convertedPrice?.destinationPrice !== null && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-0.5 mt-2">
                                              Destination ({destinationCurrencyCode})
                                            </p>
                                            <p className="text-base font-semibold text-gray-700">
                                              {destinationPriceDisplay}
                                            </p>
                                          </div>
                                        )}
                                        {/* Fallback if conversion failed */}
                                        {(!convertedPrice || (convertedPrice.sourcePrice === null && convertedPrice.destinationPrice === null)) && (
                                          <p className="text-lg font-bold text-gray-900">
                                            {formatCurrencyAmount(servicePrice.finalPrice || 0, destinationCurrency)}
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                              {servicePrice.transhipment_time && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Transit: {servicePrice.transhipment_time}
                                </p>
                              )}
                            </div>

                            {/* Weight Info */}
                            {servicePrice.final_weight && (
                              <div className="text-xs text-muted-foreground text-center">
                                Weight: {formatNumber(servicePrice.final_weight / 1000, 2)} kg
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Note */}
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  <p>
                    <strong>Note:</strong> Prices are calculated based on the higher of actual or volumetric weight. All prices are estimates. Final charges may vary after courier verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Results Message */}
          {!shouldUseExchangeRate && !isLoadingCourierPrices && weight && sortedCourierPrices.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No courier services available for this route and weight. Please check your inputs.
            </div>
          )}

          {/* Exchange Rate Error Message */}
          {shouldUseExchangeRate && !isLoadingExchangeRate && weight && exchangeRatePrice === null && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Unable to calculate shipping price. Please check your inputs or try again later.
            </div>
          )}

          {/* Enter Weight Message */}
          {!weight && !length && !width && !height && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Enter weight or dimensions to see shipping prices
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

