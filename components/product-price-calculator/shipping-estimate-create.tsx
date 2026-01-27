"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  fetchCourierServicesByType,
  fetchCurrencies,
} from "@/lib/api-client";
import { convertCurrencyByCountryCode, countryCodeToCurrencies, productPriceCalculatorApi } from "@/lib/api/product-price-calculator";
import {
  calculatePrice,
  type CourierService,
  type Currency,
  type PriceCalculationResult,
} from "@/lib/price-calculator";
import { formatNumber } from "@/lib/product-price-calculator";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Calculator,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type ExchangeRate = {
  sourceCountryExchangeRate: number;
  destinationCountryExchangeRate: number;
}

export function ShippingEstimateCreate({ sourceCountryCode, destinationCountryCode }: { sourceCountryCode: string, destinationCountryCode: string }) {
  const [shipmentType, setShipmentType] = useState<"import" | "export">("export");
  const [weight, setWeight] = useState(""); // Weight in kg (for display)
  const [dimensionUnit, setDimensionUnit] = useState<"cm" | "in">("cm");
  const [length, setLength] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"delivery" | "pickup">("delivery");
  const [isExpanded, setIsExpanded] = useState(false);
  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRate | null>(null);
  const [isLoadingExchangeRateData, setIsLoadingExchangeRateData] = useState(false);
  const [receivingCountryPricePerKg, setReceivingCountryPricePerKg] = useState<number | null>(null);
  const [isLoadingReceivingCountryPrice, setIsLoadingReceivingCountryPrice] = useState(false);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!sourceCountryCode || !destinationCountryCode) {
        setExchangeRateData(null);
        return;
      }

      setIsLoadingExchangeRateData(true);
      try {
        const [sourceCountryExchangeRate, destinationCountryExchangeRate] = await Promise.all([
          convertCurrencyByCountryCode({
            amount: null,
            sourceCountryCode: "IN",
            destinationCountryCode: sourceCountryCode || "",
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
  }, [sourceCountryCode, destinationCountryCode]);

  const sourceCountryCurrency = useMemo(() => {
    return countryCodeToCurrencies(sourceCountryCode);
  }, [sourceCountryCode]);

  const destinationCountryCurrency = useMemo(() => {
    return countryCodeToCurrencies(destinationCountryCode);
  }, [destinationCountryCode]);

  // Countries that use drop_and_ship_receiving_country_price table for pricing
  const useReceivingCountryPriceCountries = ["IN", "LK", "AE", "GB", "MY"];
  const shouldUseReceivingCountryPrice = destinationCountryCode && useReceivingCountryPriceCountries.includes(destinationCountryCode);

  // Fetch price_per_kg from drop_and_ship_receiving_country_price table
  useEffect(() => {
    const fetchReceivingCountryPrice = async () => {
      if (!shouldUseReceivingCountryPrice || !sourceCountryCode || !destinationCountryCode) {
        setReceivingCountryPricePerKg(null);
        return;
      }

      setIsLoadingReceivingCountryPrice(true);
      try {
        const pricePerKg = await productPriceCalculatorApi.getReceivingCountryPrice(
          sourceCountryCode,
          destinationCountryCode
        );
        setReceivingCountryPricePerKg(pricePerKg);
      } catch (error) {
        console.error("Error fetching receiving country price:", error);
        setReceivingCountryPricePerKg(null);
      } finally {
        setIsLoadingReceivingCountryPrice(false);
      }
    };

    fetchReceivingCountryPrice();
  }, [shouldUseReceivingCountryPrice, sourceCountryCode, destinationCountryCode]);

  // API data state
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [detailedCourierServices, setDetailedCourierServices] = useState<
    CourierService[]
  >([]);

  // UI state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [priceCalculationResult, setPriceCalculationResult] =
    useState<PriceCalculationResult | null>(null);

  // Validation function
  const areRequiredFieldsFilled = useCallback(() => {
    const requiredFields = {
      country: destinationCountryCode !== "",
      weight: weight.trim() !== "" && Number(weight) > 0,
    };

    return Object.values(requiredFields).every(Boolean);
  }, [destinationCountryCode, weight]);


  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [currenciesData, courierServicesData] = await Promise.all([
          fetchCurrencies(),
          fetchCourierServicesByType("export"),
        ]);
        setCurrencies(currenciesData);
        setDetailedCourierServices(courierServicesData);
      } catch (error) {
        console.error("Error loading initial data:", error);
        setCalculationError("Failed to load required data. Please try again.");
      }
    }

    loadData();
  }, []);

  // Input normalization functions
  const normalizeWeightInput = (value: string) => {
    if (value.trim() === "") {
      return "";
    }

    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return "";
    }

    return parsed.toString();
  };

  const handleDimensionChange = (
    value: string,
    setter: (value: string) => void
  ) => {
    if (value === "" || value === "-" || value === ".") {
      setter(value);
      return;
    }

    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setter(value);
    }
  };

  const handleDimensionBlur = (
    value: string,
    setter: (value: string) => void
  ) => {
    if (value.trim() === "") {
      setter("");
      return;
    }

    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      setter("");
      return;
    }

    setter(parsed.toFixed(1));
  };

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }),
    []
  );


  // Sort prices by minimum price
  const sortedPrices = useMemo(() => {
    if (!priceCalculationResult?.prices) return [];
    return [...priceCalculationResult.prices].sort(
      (a, b) => (a.finalPrice || 0) - (b.finalPrice || 0)
    );
  }, [priceCalculationResult]);

  const canDisplayPrices = Boolean(
    priceCalculationResult?.transportable && sortedPrices.length > 0
  );

  // Calculate effective weight: use the greater of actual weight or volume weight
  const calculateEffectiveWeight = useMemo((): number | null => {
    const weightValue = weight ? parseFloat(weight) : null;

    // Calculate volume weight if dimensions are provided
    let volumeWeight: number | null = null;
    if (length && width && height) {
      const l = parseFloat(length);
      const w = parseFloat(width);
      const h = parseFloat(height);
      if (l > 0 && w > 0 && h > 0) {
        // Volume weight = (L × W × H) / 5000 (in kg)
        volumeWeight = (l * w * h) / 5000;
      }
    }

    // If both are null/invalid, return null
    if ((!weightValue || isNaN(weightValue) || weightValue <= 0) && !volumeWeight) {
      return null;
    }

    // If only one is valid, return that one
    if ((!weightValue || isNaN(weightValue) || weightValue <= 0) && volumeWeight) {
      return volumeWeight;
    }

    if (weightValue && (!volumeWeight || volumeWeight <= 0)) {
      return weightValue;
    }

    // Both are valid, return the greater value
    return Math.max(weightValue!, volumeWeight!);
  }, [weight, length, width, height]);

  // Calculate receiving country price
  const receivingCountryPrice = useMemo((): number | null => {
    if (!shouldUseReceivingCountryPrice || !receivingCountryPricePerKg || !calculateEffectiveWeight) {
      return null;
    }
    return receivingCountryPricePerKg * calculateEffectiveWeight;
  }, [shouldUseReceivingCountryPrice, receivingCountryPricePerKg, calculateEffectiveWeight]);

  const canDisplayReceivingCountryPrice = Boolean(
    shouldUseReceivingCountryPrice && receivingCountryPrice !== null && calculateEffectiveWeight !== null
  );

  // Calculation function
  const performCalculation = useCallback(async () => {
    if (!areRequiredFieldsFilled()) {
      setCalculationError("Please fill in all required fields.");
      setPriceCalculationResult(null);
      return;
    }

    // Skip courier service calculation if using receiving country price
    if (shouldUseReceivingCountryPrice) {
      setPriceCalculationResult(null);
      return;
    }

    try {
      setIsCalculating(true);
      setCalculationError(null);

      const toCentimeters = (value: string) => {
        const numericValue = Number.parseFloat(value);
        if (Number.isNaN(numericValue)) {
          return 0;
        }
        return dimensionUnit === "cm" ? numericValue : numericValue * 2.54;
      };

      // Convert weight from kg to grams
      const weightInKg = Number.parseFloat(weight || "0");
      if (Number.isNaN(weightInKg) || weightInKg <= 0) {
        setCalculationError("Please enter a valid weight.");
        return;
      }
      const weightInGrams = weightInKg * 1000;

      let volume = 0;
      if (length && width && height) {
        const l = toCentimeters(length);
        const w = toCentimeters(width);
        const h = toCentimeters(height);
        if (
          !Number.isNaN(l) &&
          !Number.isNaN(w) &&
          !Number.isNaN(h) &&
          l > 0 &&
          w > 0 &&
          h > 0
        ) {
          volume = l * w * h; // Volume in cm³
        }
      }

      const calculationInput = {
        from: sourceCountryCode,
        selected_to: destinationCountryCode,
        selected_courier_service: null,
        selected_type: shipmentType,
        selected_weight: weightInGrams,
        selected_volume: volume,
        currency: currencies,
        Allcourierservicesdata: detailedCourierServices,
      };

      const result = calculatePrice(calculationInput);

      if (
        !result ||
        !result.prices ||
        !Array.isArray(result.prices) ||
        result.prices.length === 0
      ) {
        result.transportable = false;
      }

      setPriceCalculationResult(result);
    } catch (error) {
      console.error("Error calculating price:", error);
      setCalculationError(
        "Failed to calculate shipping price. Please try again."
      );
    } finally {
      setIsCalculating(false);
    }
  }, [
    areRequiredFieldsFilled,
    weight,
    length,
    width,
    height,
    dimensionUnit,
    shipmentType,
    sourceCountryCode,
    destinationCountryCode,
    currencies,
    detailedCourierServices,
    shouldUseReceivingCountryPrice,
  ]);

  // Auto-calculate when inputs change (debounced)
  useEffect(() => {
    // Skip auto-calculation if using receiving country price (it's calculated via useMemo)
    if (shouldUseReceivingCountryPrice) {
      return;
    }

    if (
      areRequiredFieldsFilled() &&
      currencies.length > 0 &&
      detailedCourierServices.length > 0
    ) {
      const timeoutId = setTimeout(() => {
        performCalculation();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [
    destinationCountryCode,
    weight,
    length,
    width,
    height,
    dimensionUnit,
    shipmentType,
    currencies,
    detailedCourierServices,
    areRequiredFieldsFilled,
    performCalculation,
    shouldUseReceivingCountryPrice,
  ]);

  return (
    <Card className="w-full border-dashed border-2">
      <CardHeader>
        <button
          type="button"
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
            {/* Delivery Option */}
            {destinationCountryCode === "LK" && <div className="space-y-3">
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
            </div>}

            {/* Weight Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimate-weight">Weight (Kg)</Label>
                <Input
                  id="estimate-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter weight in kg"
                  value={weight}
                  onChange={(e) => setWeight(normalizeWeightInput(e.target.value))}
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
                    onChange={(e) =>
                      handleDimensionChange(e.target.value, setLength)
                    }
                    onBlur={(e) =>
                      handleDimensionBlur(e.target.value, setLength)
                    }
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Width"
                    value={width}
                    onChange={(e) =>
                      handleDimensionChange(e.target.value, setWidth)
                    }
                    onBlur={(e) =>
                      handleDimensionBlur(e.target.value, setWidth)
                    }
                  />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Height"
                    value={height}
                    onChange={(e) =>
                      handleDimensionChange(e.target.value, setHeight)
                    }
                    onBlur={(e) =>
                      handleDimensionBlur(e.target.value, setHeight)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {!shouldUseReceivingCountryPrice && (isCalculating || currencies.length === 0 || detailedCourierServices.length === 0) && !priceCalculationResult && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading shipping rates...</span>
            </div>
          )}

          {/* Error State */}
          {calculationError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium">{calculationError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State for Receiving Country Price */}
          {shouldUseReceivingCountryPrice && isLoadingReceivingCountryPrice && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading shipping rates...</span>
            </div>
          )}

          {/* Receiving Country Price Display */}
          {canDisplayReceivingCountryPrice && !isLoadingReceivingCountryPrice && receivingCountryPrice !== null && (
            <div className="mt-4 space-y-4">
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-base">Shipping Price</span>
                </div>

                <Card className="border-2 border-purple-200 rounded-lg bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-around gap-6 mb-4">
                      {/* Source Currency */}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Source Currency ({sourceCountryCurrency})</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {sourceCountryCurrency} {formatNumber(receivingCountryPrice * (exchangeRateData?.sourceCountryExchangeRate || 1), 2)}
                        </p>
                      </div>

                      {/* Destination Currency */}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Destination Currency ({destinationCountryCurrency})</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {destinationCountryCurrency} {formatNumber(receivingCountryPrice * (exchangeRateData?.destinationCountryExchangeRate || 1), 2)}
                        </p>
                      </div>
                    </div>

                    {/* Effective Weight */}
                    {calculateEffectiveWeight !== null && (
                      <div className="text-center pt-4 border-t border-purple-100">
                        <p className="text-sm font-medium text-gray-700">
                          Effective Weight: {formatNumber(calculateEffectiveWeight, 2)} kg
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Courier Service Prices */}
          {!shouldUseReceivingCountryPrice && canDisplayPrices && !isCalculating && (
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
                      {((parseFloat(length) * parseFloat(width) * parseFloat(height)) / 5000).toFixed(2)} kg
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (L × W × H ÷ 5000)
                    </span>
                  </div>
                )}

                {/* All Courier Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedPrices.map((servicePrice, index) => {
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
                        <CardContent className="p-4 flex flex-col flex-1 relative">
                          {/* Best Price Badge */}
                          {isBestPrice && (
                            <div className="absolute -top-3 -left-3 inline-flex items-center rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white w-fit z-10">
                              Best Price
                            </div>
                          )}
                          <div className="flex flex-col gap-2 flex-1">
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
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">
                                    Source ({sourceCountryCurrency})
                                  </p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {sourceCountryCurrency} {" "} {formatNumber(servicePrice.finalPrice * (exchangeRateData?.sourceCountryExchangeRate || 1), 2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5 mt-2">
                                    Destination ({destinationCountryCurrency})
                                  </p>
                                  <p className="text-base font-semibold text-gray-700">
                                    {destinationCountryCurrency} {" "} {formatNumber(servicePrice.finalPrice * (exchangeRateData?.destinationCountryExchangeRate || 1), 2)}
                                  </p>
                                </div>
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
                                Weight: {(servicePrice.final_weight / 1000).toFixed(2)} kg
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
          {!shouldUseReceivingCountryPrice && !isCalculating &&
            priceCalculationResult &&
            !priceCalculationResult.transportable && (
              <div className="text-sm text-muted-foreground text-center py-4">
                No courier services available for this route and weight. Please check your inputs.
              </div>
            )}

          {/* Enter Weight Message */}
          {!areRequiredFieldsFilled() && (
            <div className="text-sm text-muted-foreground text-center py-2">
              Enter weight and select country to see shipping prices
            </div>
          )}

          {/* No Receiving Country Price Message */}
          {shouldUseReceivingCountryPrice && !isLoadingReceivingCountryPrice && receivingCountryPrice === null && areRequiredFieldsFilled() && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Shipping price not available for this route. Please check your inputs.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
