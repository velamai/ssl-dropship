"use client";

// import { Footer } from "@/components/new-home/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchCountries,
  fetchCountriesByType,
  fetchCourierServices,
  fetchCourierServicesByType,
  fetchCurrencies,
} from "@/lib/api-client";
import {
  calculatePrice,
  type CourierService,
  type Currency,
  type PriceCalculationResult,
} from "@/lib/price-calculator";
import { cn } from "@/lib/utils";
import { ShippingEstimate } from "./shipping-estimate";
import { CategorySelector } from "./category-selector";
import type { OriginCountry, ProductCategory } from "@/lib/shipping-rates";
import { getOriginCountryFromCode, getExchangeRate, getCurrencyCode } from "@/lib/shipping-rates";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Calculator,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Mail,
  MapPin,
  Package,
  Phone,
  Plane,
  Ruler,
  ShieldAlert,
  Weight
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function ShippingCalculator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [shipmentType, setShipmentType] = useState<"import" | "export">(
    (searchParams.get("type") as "import" | "export") || "export"
  );
  const [selectedCountry, setSelectedCountry] = useState(
    searchParams.get("country") || ""
  );
  const [weight, setWeight] = useState(searchParams.get("weight") || ""); // Weight in grams
  const [useDimensions, setUseDimensions] = useState(
    Boolean(
      searchParams.get("length") ||
      searchParams.get("width") ||
      searchParams.get("height")
    )
  );
  const [dimensionUnit, setDimensionUnit] = useState<"cm" | "in">(
    (searchParams.get("unit") as "cm" | "in") || "cm"
  );
  const [length, setLength] = useState(searchParams.get("length") || "");
  const [height, setHeight] = useState(searchParams.get("height") || "");
  const [width, setWidth] = useState(searchParams.get("width") || "");
  const [displayCurrency, setDisplayCurrency] = useState<"INR" | "USD">(
    (searchParams.get("currency") as "INR" | "USD") || "INR"
  );
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [category, setCategory] = useState<ProductCategory>("others");

  // Shipping Estimate state
  const [shippingEstimateExchangeRate, setShippingEstimateExchangeRate] = useState<number>(1);
  const [shippingEstimateOriginCurrency, setShippingEstimateOriginCurrency] = useState<string>("INR");
  const [shippingEstimateDestinationCurrency] = useState<string>("INR"); // Always INR as requested

  // API data state
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>(
    []
  );
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
      country: selectedCountry !== "",
      weight: weight.trim() !== "" && Number(weight) > 0,
    };

    return Object.values(requiredFields).every(Boolean);
  }, [selectedCountry, weight]);

  // Fetch countries based on shipment type
  useEffect(() => {
    async function loadCountries() {
      try {
        const countriesData = await fetchCountriesByType(shipmentType);
        setCountries(countriesData);
        // Reset selected country when type changes
        if (
          countriesData.length > 0 &&
          !countriesData.find((c) => c.code === selectedCountry)
        ) {
          setSelectedCountry("");
        }
      } catch (error) {
        console.error("Error loading countries:", error);
      }
    }

    loadCountries();
  }, [shipmentType]);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [currenciesData, courierServicesData] = await Promise.all([
          fetchCurrencies(),
          fetchCourierServicesByType(shipmentType),
        ]);
        setCurrencies(currenciesData);
        setDetailedCourierServices(courierServicesData);
      } catch (error) {
        console.error("Error loading initial data:", error);
        setCalculationError("Failed to load required data. Please try again.");
      }
    }

    loadData();
  }, [shipmentType]);

  // Calculate origin country and destination for shipping estimate
  const shippingEstimateOriginCountry = useMemo<OriginCountry | null>(() => {
    if (shipmentType === "export") {
      // Export: From India (IN)
      return "india";
    } else {
      // Import: From selected country
      if (selectedCountry) {
        return getOriginCountryFromCode(selectedCountry);
      }
    }
    return null;
  }, [shipmentType, selectedCountry]);

  const shippingEstimateDestinationCountryCode = useMemo<string>(() => {
    if (shipmentType === "export") {
      // Export: To selected country
      return selectedCountry || "LK";
    } else {
      // Import: To India (IN)
      return "IN";
    }
  }, [shipmentType, selectedCountry]);

  // Load exchange rate and currency for shipping estimate
  useEffect(() => {
    async function loadShippingEstimateData() {
      if (!shippingEstimateOriginCountry) return;

      try {
        const [exchangeRate, originCurrency] = await Promise.all([
          getExchangeRate(shippingEstimateOriginCountry, shippingEstimateDestinationCountryCode),
          getCurrencyCode(shippingEstimateOriginCountry),
        ]);
        setShippingEstimateExchangeRate(exchangeRate);
        setShippingEstimateOriginCurrency(originCurrency);
      } catch (error) {
        console.error("Error loading shipping estimate data:", error);
      }
    }

    loadShippingEstimateData();
  }, [shippingEstimateOriginCountry, shippingEstimateDestinationCountryCode]);

  const normalizeNumericInput = (value: string) => {
    if (value.trim() === "") {
      return "";
    }

    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      return "";
    }

    return Math.floor(parsed).toString();
  };

  // Handle dimension input change - allow free typing
  const handleDimensionChange = (
    value: string,
    setter: (value: string) => void
  ) => {
    // Allow free typing - only validate that it's a valid number or empty
    if (value === "" || value === "-" || value === ".") {
      setter(value);
      return;
    }

    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setter(value);
    }
  };

  // Handle dimension blur - normalize on blur
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

  const adjustNumericField = (value: string, delta: number, minimum = 1) => {
    const parsedValue = Number.parseFloat(value || "0");
    const base = Number.isNaN(parsedValue) ? 0 : parsedValue;
    const nextValue = Math.max(Math.floor(base + delta), minimum);
    return nextValue.toString();
  };

  // Convert grams to kg for display
  const weightInKg = useMemo(() => {
    const grams = Number.parseFloat(weight || "0");
    if (Number.isNaN(grams) || grams === 0) return 0;
    return grams / 1000;
  }, [weight]);

  const handleDimensionUnitChange = (nextUnit: "cm" | "in") => {
    if (nextUnit === dimensionUnit) {
      return;
    }

    setDimensionUnit(nextUnit);

    const convert = (value: string) => {
      if (value.trim() === "") {
        return value;
      }

      const numericValue = Number.parseFloat(value);
      if (Number.isNaN(numericValue)) {
        return value;
      }

      const convertedValue =
        nextUnit === "cm" ? numericValue * 2.54 : numericValue / 2.54;
      return convertedValue.toFixed(1);
    };

    setLength((prev) => convert(prev));
    setWidth((prev) => convert(prev));
    setHeight((prev) => convert(prev));
  };

  /**
   * Get currency exchange rate from exchange_currencies table
   * Fetches rate based on currency_code (e.g., "USD", "INR")
   * INR is the base currency (rate = 1)
   * USD rate is fetched from exchange_currencies table where currency_code = "USD"
   *
   * @param code - Currency code (e.g., "USD", "INR")
   * @returns Exchange rate value or null if not found
   */
  const getCurrencyRate = useCallback(
    (code?: string | null) => {
      if (!code) {
        return null;
      }

      const normalizedCode = code.toUpperCase();

      // Find currency in exchange_currencies table by currency_code
      const matchedCurrency = currencies.find(
        (currency) => currency.currency_code?.toUpperCase() === normalizedCode
      );

      if (matchedCurrency && typeof matchedCurrency.value === "number") {
        return matchedCurrency.value;
      }

      // INR is base currency (rate = 1)
      if (normalizedCode === "INR") {
        return 1;
      }

      // USD rate should be fetched from exchange_currencies table
      // If not found in currencies array, return null
      return null;
    },
    [currencies]
  );

  /**
   * Convert amount from source currency to display currency
   *
   * Conversion process:
   * 1. Fetch source currency rate from exchange_currencies table (e.g., USD rate)
   * 2. Fetch target currency rate from exchange_currencies table (e.g., INR rate = 1)
   * 3. Convert using formula: amount * (targetRate / sourceRate)
   *
   * Formula: INR_rate / USD_rate
   * Example: Convert 100 USD to INR
   * - Source rate (USD): Fetched from exchange_currencies where currency_code = "USD" (e.g., 83.5)
   * - Target rate (INR): 1 (base currency)
   * - Result: 100 * (1 / 83.5) = 100 * 0.011976 = 1.1976 INR
   *
   * Or more generally: amount * (targetRate / sourceRate)
   *
   * @param amount - Amount in source currency
   * @param fromCurrency - Source currency code (defaults to displayCurrency)
   * @returns Converted amount in target currency
   */
  const convertAmountToDisplay = useCallback(
    (amount: number, fromCurrency?: string | null) => {
      if (!amount) {
        return 0;
      }

      // Get exchange rates from exchange_currencies table
      const sourceRate = getCurrencyRate(fromCurrency ?? displayCurrency);
      const targetRate = getCurrencyRate(displayCurrency);

      if (!sourceRate || !targetRate || sourceRate === 0) {
        return amount;
      }

      // Conversion formula: amount * (targetRate / sourceRate)
      // This is equivalent to: amount * (INR_rate / USD_rate)
      // This converts from source currency to target currency
      return amount * (targetRate / sourceRate);
    },
    [displayCurrency, getCurrencyRate]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(displayCurrency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency: displayCurrency,
        minimumFractionDigits: 2,
      }),
    [displayCurrency]
  );

  const formatCurrencyAmount = useCallback(
    (amount: number, fromCurrency?: string | null) => {
      const converted = convertAmountToDisplay(amount, fromCurrency);
      return currencyFormatter.format(
        Number.isFinite(converted) ? converted : 0
      );
    },
    [convertAmountToDisplay, currencyFormatter]
  );

  // Sort prices by minimum price (finalPrice)
  const sortedPrices = useMemo(() => {
    if (!priceCalculationResult?.prices) return [];
    return [...priceCalculationResult.prices].sort(
      (a, b) => (a.finalPrice || 0) - (b.finalPrice || 0)
    );
  }, [priceCalculationResult]);

  const canDisplayPrices = Boolean(
    priceCalculationResult?.transportable && sortedPrices.length > 0
  );

  // Extract calculation logic into a reusable function
  const performCalculation = useCallback(async () => {
    if (!areRequiredFieldsFilled()) {
      setCalculationError("Please fill in all required fields.");
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

      // Weight is already in grams
      const weightInGrams = Number.parseFloat(weight || "0");
      if (Number.isNaN(weightInGrams) || weightInGrams <= 0) {
        setCalculationError("Please enter a valid weight.");
        return;
      }

      // Volume in cm³ (not m³)
      let volume = 0;
      if (useDimensions && length && width && height) {
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
        from: shipmentType === "export" ? "IN" : selectedCountry,
        selected_to: shipmentType === "import" ? "IN" : selectedCountry,
        selected_courier_service: null, // No specific courier selected - show all
        selected_type: shipmentType,
        selected_weight: weightInGrams, // Weight in grams
        selected_volume: volume, // Volume in cm³
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
    useDimensions,
    dimensionUnit,
    shipmentType,
    selectedCountry,
    currencies,
    detailedCourierServices,
  ]);

  const calculateShippingPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    await performCalculation();
  };

  // Auto-calculate on mount if search params are present
  useEffect(() => {
    const hasSearchParams =
      searchParams.get("country") && searchParams.get("weight");
    if (
      hasSearchParams &&
      currencies.length > 0 &&
      detailedCourierServices.length > 0 &&
      areRequiredFieldsFilled()
    ) {
      // Small delay to ensure all state is initialized
      const timeoutId = setTimeout(() => {
        performCalculation();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [
    currencies,
    detailedCourierServices,
    searchParams,
    areRequiredFieldsFilled,
    performCalculation,
  ]);

  // Auto-calculate when inputs change (always if required fields are filled)
  useEffect(() => {
    if (
      areRequiredFieldsFilled() &&
      currencies.length > 0 &&
      detailedCourierServices.length > 0
    ) {
      const timeoutId = setTimeout(() => {
        performCalculation();
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [
    selectedCountry,
    weight,
    length,
    width,
    height,
    useDimensions,
    dimensionUnit,
    shipmentType,
    currencies,
    detailedCourierServices,
    areRequiredFieldsFilled,
    performCalculation,
  ]);

  const handleShipmentTypeChange = (type: string) => {
    setShipmentType(type as "import" | "export");
    setSelectedCountry("");
    setPriceCalculationResult(null);
  };

  // Handle courier service selection and routing
  const handleCourierSelect = useCallback(
    (courierServiceId: string) => {
      if (!user) {
        // Store the selection in sessionStorage and redirect to login
        const shipmentData = {
          shipmentType,
          country: selectedCountry,
          weight: weight,
          courierService: courierServiceId,
          dimensions: useDimensions ? { length, width, height } : undefined,
        };
        sessionStorage.setItem("pendingShipment", JSON.stringify(shipmentData));
        router.push("/login");
        return;
      }

      // Build query params for create-shipments page
      const params = new URLSearchParams({
        type: shipmentType,
        country: selectedCountry,
        weight: weight,
        courier: courierServiceId,
      });

      if (useDimensions && length && width && height) {
        params.append("length", length);
        params.append("width", width);
        params.append("height", height);
      }

      router.push(`/create-shipments?${params.toString()}`);
    },
    [
      user,
      shipmentType,
      selectedCountry,
      weight,
      length,
      width,
      height,
      useDimensions,
      router,
    ]
  );

  return (
    <>
      <section
        id="calculator"
        className="w-full bg-white py-12 md:py-24 md:pt-6 pt-6 relative overflow-hidden"
      >
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-bl-full opacity-70"></div>
        <div className="absolute top-1/4 left-10 w-16 h-16 border-2 border-red-200 rounded-full opacity-50"></div>
        <div className="absolute bottom-1/4 right-10 w-24 h-24 border-2 border-red-200 opacity-50 rotate-45"></div>

        <div className="container px-4 md:px-6 relative z-10 mt-24">
          {/* <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-lg bg-red-100 px-3 py-1 text-sm text-red-800">
              <Calculator className="mr-1 h-4 w-4" />
              <span>Shipping Calculator</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Calculate Your Shipping Costs
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Get instant estimates for your international air freight shipments
            </p>
          </div>
        </div> */}

          {/* Horizontal Calculator Form at Top */}
          <div className="mx-auto max-w-7xl">
            <Card className="border-red-100 shadow-lg">
              <CardHeader className="bg-red-50 rounded-t-lg">
                <CardTitle className="text-red-900 flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Shipping Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={calculateShippingPrice} className="w-full">
                  {/* Mobile View - Only Required Fields */}
                  <div className="grid grid-cols-1 gap-4 items-end sm:hidden">
                    {/* 1. Import or Export */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="shipment-type-mobile"
                        className="flex items-center text-sm font-medium whitespace-nowrap"
                      >
                        <ArrowRight className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                        Import or Export
                      </Label>
                      <Select
                        value={shipmentType}
                        onValueChange={handleShipmentTypeChange}
                      >
                        <SelectTrigger
                          id="shipment-type-mobile"
                          className="h-10 w-full"
                        >
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">
                            <div className="flex items-center">
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              <span>Import</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="export">
                            <div className="flex items-center">
                              <ArrowRight className="mr-2 h-4 w-4" />
                              <span>Export</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 2. Country */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="country-mobile"
                        className="flex items-center text-sm font-medium whitespace-nowrap"
                      >
                        <Plane className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                        {shipmentType === "import"
                          ? "From Country"
                          : "To Country"}
                      </Label>
                      <div className="w-full overflow-hidden">
                        <SearchableSelect
                          options={countries.map((c) => ({
                            value: c.code,
                            label: c.name,
                          }))}
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                          placeholder="Select country"
                          searchPlaceholder="Search countries..."
                          emptyMessage="No countries found"
                        />
                      </div>
                    </div>

                    {/* 3. Weight */}
                    <div className="space-y-2">
                      <Label className="flex items-center text-sm font-medium whitespace-nowrap">
                        <Weight className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                        Package Weight (grams)
                      </Label>
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10 rounded-full flex-shrink-0 p-0"
                          onClick={() =>
                            setWeight(adjustNumericField(weight, -100, 1))
                          }
                        >
                          −
                        </Button>
                        <Input
                          id="weight-mobile"
                          type="number"
                          inputMode="numeric"
                          min="1"
                          step="1"
                          className="text-center h-10 flex-1 min-w-0"
                          placeholder="0"
                          value={weight}
                          onChange={(e) =>
                            setWeight(normalizeNumericInput(e.target.value))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10 rounded-full flex-shrink-0 p-0"
                          onClick={() =>
                            setWeight(adjustNumericField(weight, 100, 1))
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* More Options Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-between h-10 border-red-200 hover:bg-red-50"
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                    >
                      <span className="text-sm font-medium text-red-700">
                        More Options
                      </span>
                      {showMoreOptions ? (
                        <ChevronUp className="h-4 w-4 text-red-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-red-600" />
                      )}
                    </Button>

                    {/* More Options Content */}
                    {showMoreOptions && (
                      <div className="space-y-4 pt-2 border-t border-red-100">
                        {/* From (India - fixed) */}
                        <div className="space-y-2">
                          <Label className="flex items-center text-sm font-medium whitespace-nowrap">
                            <MapPin className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                            {shipmentType === "export" ? "From" : "To"}
                          </Label>
                          <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground w-full">
                            <MapPin className="mr-2 h-4 w-4 text-red-600 flex-shrink-0" />
                            <span className="truncate">India</span>
                          </div>
                        </div>

                        {/* Display Currency */}
                        <div className="space-y-2">
                          <Label className="flex items-center text-sm font-medium whitespace-nowrap">
                            <CircleDollarSign className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                            Display Currency
                          </Label>
                          <div className="flex rounded-full bg-red-100 p-1 w-full">
                            {(["INR", "USD"] as const).map((currency) => (
                              <Button
                                key={currency}
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors flex-1 h-8",
                                  displayCurrency === currency
                                    ? "bg-red-600 text-white shadow-sm hover:bg-red-600"
                                    : "text-red-700 hover:bg-red-200"
                                )}
                                onClick={() => setDisplayCurrency(currency)}
                              >
                                {currency}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Volumetric Dimensions Section */}
                        <div className="pt-2 border-t border-red-100">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center space-x-3 rounded-lg border border-red-100 bg-red-50/60 p-3">
                              <Checkbox
                                id="use-dimensions-mobile"
                                checked={useDimensions}
                                onCheckedChange={(checked) =>
                                  setUseDimensions(checked === true)
                                }
                                className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:text-white"
                              />
                              <div>
                                <Label
                                  htmlFor="use-dimensions-mobile"
                                  className="font-medium text-red-900 cursor-pointer"
                                >
                                  Add Volumetric Dimensions (Optional)
                                </Label>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Include package dimensions to factor volumetric
                                  weight.
                                </p>
                              </div>
                            </div>
                            {useDimensions && (
                              <>
                                <div className="flex justify-center">
                                  <div className="inline-flex rounded-full bg-red-100 p-1">
                                    {(["cm", "in"] as const).map((unit) => (
                                      <Button
                                        key={unit}
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                                          dimensionUnit === unit
                                            ? "bg-red-600 text-white shadow-sm hover:bg-red-600"
                                            : "text-red-700 hover:bg-red-200"
                                        )}
                                        onClick={() =>
                                          handleDimensionUnitChange(unit)
                                        }
                                      >
                                        {unit}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                  {[
                                    {
                                      label: "Length",
                                      icon: (
                                        <Ruler className="mr-1 h-4 w-4 text-red-600" />
                                      ),
                                      value: length,
                                      setter: setLength,
                                    },
                                    {
                                      label: "Width",
                                      icon: (
                                        <Ruler className="mr-1 h-4 w-4 text-red-600 transform rotate-90" />
                                      ),
                                      value: width,
                                      setter: setWidth,
                                    },
                                    {
                                      label: "Height",
                                      icon: (
                                        <Box className="mr-1 h-4 w-4 text-red-600" />
                                      ),
                                      value: height,
                                      setter: setHeight,
                                    },
                                  ].map(({ label, icon, value, setter }) => (
                                    <div className="space-y-2" key={label}>
                                      <Label className="flex items-center text-sm font-medium">
                                        {icon}
                                        {label} ({dimensionUnit})
                                      </Label>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="h-10 w-10 rounded-full flex-shrink-0 p-0"
                                          onClick={() => {
                                            const current = Number.parseFloat(
                                              value || "0"
                                            );
                                            const newValue = Math.max(
                                              current - 0.5,
                                              0
                                            );
                                            setter(newValue.toFixed(1));
                                          }}
                                        >
                                          −
                                        </Button>
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          className="text-center h-10 flex-1 min-w-0"
                                          placeholder="0.0"
                                          value={value}
                                          onChange={(e) =>
                                            handleDimensionChange(
                                              e.target.value,
                                              setter
                                            )
                                          }
                                          onBlur={(e) =>
                                            handleDimensionBlur(
                                              e.target.value,
                                              setter
                                            )
                                          }
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="h-10 w-10 rounded-full flex-shrink-0 p-0"
                                          onClick={() => {
                                            const current = Number.parseFloat(
                                              value || "0"
                                            );
                                            const newValue = current + 0.5;
                                            setter(newValue.toFixed(1));
                                          }}
                                        >
                                          +
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop/Tablet View - All Fields */}
                  <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    {/* Import or Export */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="shipment-type"
                        className="flex items-center text-sm font-medium whitespace-nowrap"
                      >
                        <ArrowRight className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                        Import or Export
                      </Label>
                      <Select
                        value={shipmentType}
                        onValueChange={handleShipmentTypeChange}
                      >
                        <SelectTrigger id="shipment-type" className="h-10 w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="import">
                            <div className="flex items-center">
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              <span>Import</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="export">
                            <div className="flex items-center">
                              <ArrowRight className="mr-2 h-4 w-4" />
                              <span>Export</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* From (India - fixed) */}
                    <div className="space-y-2">
                      <Label className="flex items-center text-sm font-medium whitespace-nowrap">
                        <MapPin className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                        {shipmentType === "export" ? "From" : "To"}
                      </Label>
                      <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground w-full">
                        <MapPin className="mr-2 h-4 w-4 text-red-600 flex-shrink-0" />
                        <span className="truncate">India</span>
                      </div>
                    </div>

                    {/* To Country */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="country"
                        className="flex items-center text-sm font-medium whitespace-nowrap"
                      >
                        <Plane className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                        {shipmentType === "import"
                          ? "From Country"
                          : "To Country"}
                      </Label>
                      <div className="w-full overflow-hidden">
                        <SearchableSelect
                          options={countries.map((c) => ({
                            value: c.code,
                            label: c.name,
                          }))}
                          value={selectedCountry}
                          onValueChange={setSelectedCountry}
                          placeholder="Select country"
                          searchPlaceholder="Search countries..."
                          emptyMessage="No countries found"
                        />
                      </div>
                    </div>

                    {/* Package Weight */}
                    <div className="space-y-2 max-w-[12rem]">
                      <Label className="flex items-center text-sm font-medium whitespace-nowrap">
                        <Weight className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                        Package Weight (grams)
                      </Label>
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10 rounded-full flex-shrink-0 p-0"
                          onClick={() =>
                            setWeight(adjustNumericField(weight, -100, 1))
                          }
                        >
                          −
                        </Button>
                        <div className="relative flex-1 min-w-0">
                          <Input
                            id="weight"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            step="1"
                            className="text-center h-10 pr-8"
                            placeholder="0"
                            value={weight}
                            onChange={(e) =>
                              setWeight(normalizeNumericInput(e.target.value))
                            }
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                            g
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-10 rounded-full flex-shrink-0 p-0"
                          onClick={() =>
                            setWeight(adjustNumericField(weight, 100, 1))
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Display Currency */}
                    <div className="space-y-2">
                      <Label className="flex items-center text-sm font-medium whitespace-nowrap">
                        <CircleDollarSign className="mr-1 h-4 w-4 text-red-600 flex-shrink-0" />
                        Display Currency
                      </Label>
                      <div className="flex rounded-full bg-red-100 p-1 w-full">
                        {(["INR", "USD"] as const).map((currency) => (
                          <Button
                            key={currency}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors flex-1 h-8",
                              displayCurrency === currency
                                ? "bg-red-600 text-white shadow-sm hover:bg-red-600"
                                : "text-red-700 hover:bg-red-200"
                            )}
                            onClick={() => setDisplayCurrency(currency)}
                          >
                            {currency}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Volumetric Dimensions Section - Hidden on Mobile */}
                  <div className="hidden sm:block mt-4 pt-4 border-t border-red-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 rounded-lg border border-red-100 bg-red-50/60 p-3 flex-1">
                        <Checkbox
                          id="use-dimensions"
                          checked={useDimensions}
                          onCheckedChange={(checked) =>
                            setUseDimensions(checked === true)
                          }
                          className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:text-white"
                        />
                        <div>
                          <Label
                            htmlFor="use-dimensions"
                            className="font-medium text-red-900 cursor-pointer"
                          >
                            Add Volumetric Dimensions (Optional)
                          </Label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Include package dimensions to factor volumetric
                            weight.
                          </p>
                        </div>
                      </div>
                      {useDimensions && (
                        <div className="inline-flex rounded-full bg-red-100 p-1 flex-shrink-0">
                          {(["cm", "in"] as const).map((unit) => (
                            <Button
                              key={unit}
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                                dimensionUnit === unit
                                  ? "bg-red-600 text-white shadow-sm hover:bg-red-600"
                                  : "text-red-700 hover:bg-red-200"
                              )}
                              onClick={() => handleDimensionUnitChange(unit)}
                            >
                              {unit}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    {useDimensions && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          {
                            label: "Length",
                            icon: <Ruler className="mr-1 h-4 w-4 text-red-600" />,
                            value: length,
                            setter: setLength,
                          },
                          {
                            label: "Width",
                            icon: (
                              <Ruler className="mr-1 h-4 w-4 text-red-600 transform rotate-90" />
                            ),
                            value: width,
                            setter: setWidth,
                          },
                          {
                            label: "Height",
                            icon: <Box className="mr-1 h-4 w-4 text-red-600" />,
                            value: height,
                            setter: setHeight,
                          },
                        ].map(({ label, icon, value, setter }) => (
                          <div className="space-y-2" key={label}>
                            <Label className="flex items-center text-sm font-medium">
                              {icon}
                              {label} ({dimensionUnit})
                            </Label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 w-10 rounded-full flex-shrink-0 p-0"
                                onClick={() => {
                                  const current = Number.parseFloat(value || "0");
                                  const newValue = Math.max(current - 0.5, 0);
                                  setter(newValue.toFixed(1));
                                }}
                              >
                                −
                              </Button>
                              <Input
                                type="text"
                                inputMode="decimal"
                                className="text-center h-10 flex-1 min-w-0"
                                placeholder="0.0"
                                value={value}
                                onChange={(e) =>
                                  handleDimensionChange(e.target.value, setter)
                                }
                                onBlur={(e) =>
                                  handleDimensionBlur(e.target.value, setter)
                                }
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 w-10 rounded-full flex-shrink-0 p-0"
                                onClick={() => {
                                  const current = Number.parseFloat(value || "0");
                                  const newValue = current + 0.5;
                                  setter(newValue.toFixed(1));
                                }}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Price Display Section - Show First */}
          {calculationError && (
            <div className="mx-auto mt-8 max-w-7xl">
              <Card className="border-red-100 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-red-600 py-4 flex items-center justify-center">
                    <span className="mr-2">⚠️</span>
                    {calculationError}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading Skeleton */}
          {isCalculating && !priceCalculationResult && (
            <div className="mx-auto mt-8 max-w-7xl">
              <Card className="border-red-100 shadow-lg">
                <CardHeader className="bg-red-50 rounded-t-lg">
                  <div className="h-6 bg-red-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-red-100 rounded w-64 mt-2 animate-pulse"></div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="border-red-100">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="h-5 bg-red-100 rounded w-20 animate-pulse"></div>
                            <div className="flex items-center gap-3">
                              <div className="h-16 w-16 bg-red-100 rounded-lg animate-pulse"></div>
                              <div className="h-5 bg-red-100 rounded w-32 animate-pulse"></div>
                            </div>
                            <div className="h-4 bg-red-50 rounded w-full animate-pulse"></div>
                            <div className="h-4 bg-red-50 rounded w-24 animate-pulse"></div>
                            <div className="h-12 bg-red-100 rounded w-full animate-pulse"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {priceCalculationResult && (
            <div className="mx-auto mt-5 max-w-7xl">
              <Card className="border-red-100 shadow-lg">
                {/* <CardHeader className="bg-red-50 rounded-t-lg">
                <CardTitle className="text-red-900 text-base">
                  Shipping Price Estimate
                </CardTitle>
              </CardHeader> */}
                <CardContent className="pt-4">
                  {canDisplayPrices ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="inline-flex items-start gap-2 rounded-full bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          <div className="mt-0.5 h-4 w-4 rounded-full bg-amber-200 flex items-center justify-center text-[10px] leading-none text-amber-900">
                            i
                          </div>
                          <span className="text-center sm:text-left">
                            Estimates are calculated based on the higher of actual or volumetric weight. All prices are inclusive of GST and applicable charges. Final charges may vary after courier verification.
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sortedPrices.map((servicePrice, index) => {
                          const sourceCurrency =
                            servicePrice.currency &&
                              servicePrice.currency !== "Unknown"
                              ? servicePrice.currency
                              : "INR";

                          const finalPriceDisplay = formatCurrencyAmount(
                            servicePrice.finalPrice || 0,
                            sourceCurrency
                          );

                          // Calculate actual weight in kg (from grams input) for display
                          const actualWeightKg =
                            Number.parseFloat(weight || "0") / 1000;

                          // Get adjusted weight from calculation result (in grams) and convert to kg for display
                          const adjustedWeightKg =
                            (servicePrice.final_weight || 0) / 1000;

                          // Calculate volumetric weight in kg: (L × W × H) / 5000
                          let volumetricWeightKg = 0;
                          if (useDimensions && length && width && height) {
                            const l =
                              dimensionUnit === "cm"
                                ? Number.parseFloat(length || "0")
                                : Number.parseFloat(length || "0") * 2.54;
                            const w =
                              dimensionUnit === "cm"
                                ? Number.parseFloat(width || "0")
                                : Number.parseFloat(width || "0") * 2.54;
                            const h =
                              dimensionUnit === "cm"
                                ? Number.parseFloat(height || "0")
                                : Number.parseFloat(height || "0") * 2.54;
                            if (l > 0 && w > 0 && h > 0) {
                              volumetricWeightKg = (l * w * h) / 5000;
                            }
                          }

                          const isBestPrice = index === 0;

                          return (
                            <Card
                              key={servicePrice.courier_service_id}
                              className={cn(
                                "border-2 transition-all hover:shadow-lg flex flex-col",
                                isBestPrice
                                  ? "border-red-500 bg-red-50/30"
                                  : "border-red-100 bg-white"
                              )}
                            >
                              <CardContent className="p-4 flex flex-col flex-1">
                                <div className="flex flex-col gap-0.5 flex-1 relative">
                                  {/* Best Price Badge */}
                                  {isBestPrice && (
                                    <div className="absolute -top-3 -left-3 inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white w-fit z-10">
                                      Best Price
                                    </div>
                                  )}

                                  {/* Company Name - Small text at top */}
                                  <h3
                                    className={cn(
                                      "text-sm md:text-base font-semibold text-gray-800 text-center",
                                      isBestPrice && "pt-3"
                                    )}
                                  >
                                    {(() => {
                                      const name = servicePrice.name;
                                      // Check if it's Singapore Simple or Singapore Smart and contains "("
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

                                  {/* Logo - Large */}
                                  <div className="flex justify-center">
                                    {servicePrice.image_url ? (
                                      <div className="relative size-48">
                                        <Image
                                          src={servicePrice.image_url}
                                          alt={servicePrice.name}
                                          fill
                                          className="object-contain"
                                          onError={(e) => {
                                            // Hide image on error
                                            e.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-40 w-40 flex-shrink-0 flex items-center justify-center bg-red-100 rounded-lg">
                                        <Package className="h-16 w-16 text-red-600" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Price - In colored box */}
                                  <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900">
                                      {finalPriceDisplay}
                                    </p>
                                  </div>

                                  {/* Transit time and End to End tracking - Small text at bottom */}
                                  <div className="text-center">
                                    <p className="text-sm text-gray-700">
                                      {servicePrice.transhipment_time
                                        ? `Transit time: ${servicePrice.transhipment_time}`
                                        : "Transit time: N/A"}
                                      , End to End tracking
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1"></p>
                                  </div>

                                  {/* Select Button */}
                                  <Button
                                    onClick={() =>
                                      handleCourierSelect(
                                        servicePrice.courier_service_id
                                      )
                                    }
                                    className="w-full bg-red-600 hover:bg-red-700 text-white mt-auto text-sm py-2"
                                  >
                                    <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-center">
                                      Ship With {servicePrice.name}
                                    </span>
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-amber-600 py-6 text-center space-y-4">
                      <div>
                        <p className="font-semibold mb-2">
                          Sorry, we cannot calculate shipping for this route or
                          weight. Please check if:
                        </p>
                        <ul className="mt-2 list-disc list-inside text-left max-w-md mx-auto">
                          <li>The selected route is supported</li>
                          <li>The weight is within acceptable limits</li>
                          <li>
                            The dimensions are valid for the selected service
                          </li>
                        </ul>
                      </div>
                      <div className="pt-4 border-t border-amber-200">
                        <p className="font-semibold mb-3 text-amber-700">
                          Contact us for sending parcels to your destination
                          country, destination weight with best prices
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                          <a
                            href="tel:+919840635406"
                            className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            <span>+91 9840635406</span>
                          </a>
                          <a
                            href="mailto:info@universalmail.in"
                            className="flex items-center gap-2 text-amber-700 hover:text-amber-800 transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                            <span>info@universalmail.in</span>
                          </a>
                          <a
                            href={`https://wa.me/919840635406?text=${encodeURIComponent(
                              `Hi, I need help with shipping to ${selectedCountry || "my destination country"
                              } for ${weight
                                ? `${(Number.parseFloat(weight) / 1000).toFixed(
                                  2
                                )}kg`
                                : "my package weight"
                              }. Please provide best prices.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-12 w-12 rounded-full bg-[#25D366] text-white hover:bg-[#20BA5A] transition-colors shadow-lg hover:shadow-xl"
                            aria-label="Contact us on WhatsApp"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 32 32"
                              className="h-6 w-6 fill-current"
                              role="img"
                              aria-hidden="true"
                            >
                              <path d="M16 .5C7.44.5.5 7.44.5 16c0 2.78.73 5.49 2.12 7.88L.55 31.45l7.74-2.01A15.27 15.27 0 0 0 16 31.5C24.56 31.5 31.5 24.56 31.5 16S24.56.5 16 .5Zm0 28.06c-2.33 0-4.6-.62-6.58-1.79l-.47-.28-4.6 1.19 1.23-4.48-.31-.46A12.16 12.16 0 0 1 3.88 16c0-6.7 5.43-12.13 12.13-12.13S28.14 9.3 28.14 16 22.7 28.56 16 28.56Zm6.67-9.55c-.36-.18-2.16-1.07-2.5-1.19-.34-.13-.58-.18-.82.18s-.95 1.18-1.17 1.43c-.22.24-.43.27-.79.09-.36-.18-1.54-.57-2.93-1.82-1.08-.96-1.81-2.16-2.02-2.52-.22-.36-.02-.55.16-.73.17-.17.38-.43.56-.65.18-.22.24-.39.36-.65.12-.26.06-.48-.03-.66-.1-.18-.82-1.98-1.12-2.72-.29-.7-.59-.6-.82-.61h-.7c-.22 0-.58.08-.89.39-.31.3-1.17 1.14-1.17 2.79s1.2 3.24 1.36 3.46c.17.22 2.35 3.6 5.7 5.05.8.35 1.42.56 1.9.71.8.25 1.54.21 2.12.14.65-.1 2.16-.88 2.47-1.73.3-.85.3-1.58.22-1.73-.08-.16-.31-.25-.65-.43Z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Shipping Estimate Section */}
          {shippingEstimateOriginCountry && (
            <div className="mx-auto mt-8 max-w-7xl">
              <Card className="border-red-100 shadow-lg">
                <CardHeader className="bg-red-50 rounded-t-lg">
                  <CardTitle className="text-red-900">Shipping Estimate</CardTitle>
                  <CardDescription>
                    Get an estimate of shipping charges based on weight and dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Category Selector */}
                  <div className="space-y-2">
                    <Label>Product Category</Label>
                    <CategorySelector
                      value={category}
                      onValueChange={setCategory}
                    />
                    <p className="text-xs text-muted-foreground">
                      Category affects shipping rates
                    </p>
                  </div>

                  {/* Shipping Estimate Component */}
                  <ShippingEstimate
                    originCountry={shippingEstimateOriginCountry}
                    category={category}
                    exchangeRate={shippingEstimateExchangeRate}
                    originCurrency={shippingEstimateOriginCurrency}
                    destinationCurrency={shippingEstimateDestinationCurrency}
                    priceCalculatorTotalLKR={0} // No product price in shipping calculator
                    destinationCountryCode={shippingEstimateDestinationCountryCode}
                    shipmentType={shipmentType}
                    originCountryCode={shipmentType === "export" ? "IN" : selectedCountry}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Restrictions Section */}
          <div className="mx-auto mt-12 max-w-7xl">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                <span className="text-red-900">Category</span>{" "}
                <span className="text-red-800">Restrictions</span>
              </h2>
            </div>

            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-6 md:p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[
                  "Firearms, Ammunition, and Weapons",
                  "Perishable Food Items",
                  "Alcoholic beverages",
                  "Tobacco, Vapes, ENDS",
                  "Animal Products",
                  "Plants and Plant Material",
                  "Currency and Monetary Instruments",
                  "Hazardous Materials and Chemicals",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 py-1 text-gray-800"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 shadow-sm">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm md:text-base font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <a
                  href="/restricted-items"
                  className="text-sm md:text-base font-semibold text-red-700 hover:text-red-800 underline decoration-red-400 underline-offset-4"
                >
                  Guide to Restricted Item
                </a>
              </div>
            </div>
          </div>

          {/* General Terms and Conditions */}
          <div className="mx-auto mt-12 max-w-7xl">
            <Card className="border-red-100 shadow-lg">
              <CardHeader className="bg-red-50 rounded-t-lg">
                <CardTitle className="text-red-900">
                  General Terms and Conditions
                </CardTitle>
                <CardDescription>
                  Please read these conditions of carriage carefully before
                  booking your shipment with Universal Mail.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 text-sm md:text-base text-gray-700">
                <p>
                  These conditions of carriage{" "}
                  <span className="font-semibold">exclude liability</span> on the
                  part of Universal Mail and its employees or agents for loss,
                  damage and delay in certain circumstances,{" "}
                  <span className="font-semibold">limit liability</span> to stated
                  amounts where liability is accepted and{" "}
                  <span className="font-semibold">require notice of claims</span>{" "}
                  within strict time limits. Senders should note these conditions
                  carefully and, where necessary, obtain insurance cover in order
                  to protect their interests.
                </p>

                <p>
                  To continue providing uninterrupted services to our valued
                  customers with the best possible service during pandemic or
                  force-majeure situations, a temporary surcharge may be added on
                  international parcels, freight and shipments until further
                  notice.
                </p>

                <h3 className="font-semibold text-gray-900 mt-4">
                  Rates, Charges and Dimensional Weight
                </h3>
                <p>
                  Rates and service quotations by employees and agents of
                  Universal Mail are based upon information provided by the
                  sender, but final rates and service may vary based upon the
                  shipment actually tendered and the application of these
                  conditions. Universal Mail is not liable for, nor will any
                  adjustment, refund or credit of any kind be made, as a result of
                  any discrepancy between a prior quotation and the charges
                  ultimately invoiced.
                </p>
                <p>
                  Charges may be assessed based on{" "}
                  <span className="font-semibold">dimensional weight</span>.
                  Dimensional weight is determined by multiplying a package’s
                  length × height × width (all in centimetres) and dividing by
                  5000 or such other number as specified by Universal Mail from
                  time to time. If the result exceeds the actual weight,
                  additional charges may be assessed based on the dimensional
                  weight.
                </p>

                <h3 className="font-semibold text-gray-900 mt-4">
                  Shipment Limits and Packaging
                </h3>
                <p>
                  There is no limit on the aggregate weight of a multiple-piece
                  shipment provided each individual package within the shipment
                  does not exceed the per-package weight and size limits specified
                  for the destination. Large or bulk shipments may require advance
                  arrangement with Universal Mail.
                </p>
                <p>
                  Each package within a shipment must be legibly and durably
                  marked with the full name and complete postal address, including
                  PIN code and telephone number, of both the shipper and the
                  recipient. Universal Mail shall not be liable for non-delivery
                  on account of incomplete or erroneous address details furnished
                  by the shipper.
                </p>

                <h3 className="font-semibold text-gray-900 mt-4">
                  Prohibited and Restricted Items
                </h3>
                <p>
                  The following items are not acceptable for carriage to any
                  destination under any circumstances, unless otherwise agreed in
                  writing by Universal Mail and subject to applicable law:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Money (coins, cash, currency paper money and negotiable
                    instruments equivalent to cash such as endorsed stocks, bonds
                    and cash letters).
                  </li>
                  <li>
                    Explosives, fireworks and other items of an incendiary or
                    highly flammable nature.
                  </li>
                  <li>
                    Human corpses, organs or body parts, embryos, cremated or
                    disinterred human remains.
                  </li>
                  <li>Firearms, weaponry, ammunition and their parts.</li>
                  <li>
                    Foodstuffs, perishable food articles and beverages requiring
                    refrigeration or other environmental control.
                  </li>
                  <li>
                    Hazardous waste, including but not limited to used hypodermic
                    needles and/or syringes or medical waste.
                  </li>
                  <li>
                    Shipments requiring any special licence or permit for
                    transportation, importation or exportation where such licence
                    or permit has not been obtained.
                  </li>
                  <li>
                    Shipments the carriage, importation or exportation of which is
                    prohibited by any law, statute or regulation.
                  </li>
                  <li>Packages that are wet, leaking or emit an odour of any kind.</li>
                  <li>Packages that are inadequately packed or wrapped.</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mt-4">
                  Rates, Currency and Surcharges
                </h3>
                <p>
                  Rates may be updated from time to time based on foreign exchange
                  movements and operational costs. Unless otherwise stated, all
                  charges are payable in{" "}
                  <span className="font-semibold">Indian Rupees (INR)</span>.
                </p>

                <h3 className="font-semibold text-gray-900 mt-4">
                  Liability and Compensation
                </h3>
                <p>
                  Save as expressly set out herein, Universal Mail makes no
                  warranties, express or implied. Maximum liability for
                  loss/damage/shortage is{" "}
                  <span className="font-semibold">
                    the lower of the invoice value or USD equivalent of 100 dollars
                  </span>
                  , unless additional cover has been agreed in writing.
                </p>
                <p>
                  If a shipment handled via partner postal or courier networks
                  shows no progress in tracking within the specified time frame,
                  any compensation, where applicable, will be limited to the
                  shipping charge paid.
                </p>

                <h3 className="font-semibold text-gray-900 mt-4">
                  Customs, Duties and Local Charges
                </h3>
                <p>
                  Universal Mail is not liable for any shipment held at the
                  destination country due to customs inspections, clearance
                  procedures or regulatory checks. The charges shown in the
                  calculator are{" "}
                  <span className="font-semibold">shipping fees only</span> and do
                  not include customs duties, taxes or any other charges imposed
                  by the destination country. Such charges must be borne by the
                  receiver.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Optional: Additional info section can go here if needed */}
          <div className="mx-auto mt-8 max-w-7xl">
            <p className="text-center text-lg font-medium text-red-800 flex items-center justify-center">
              <Plane className="mr-2 h-5 w-5" />
              Fast, Reliable Air Freight Solutions for E-Commerce, SMEs,
              Enterprises & Individuals
            </p>
          </div>
        </div>
      </section>
      {/* <Footer /> */}
    </>
  );
}
