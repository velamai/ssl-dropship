"use client";

import Footer from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { CategorySelector } from "@/components/product-price-calculator/category-selector";
import { CountrySelector } from "@/components/product-price-calculator/country-selector";
import { PriceBreakdown } from "@/components/product-price-calculator/price-breakdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { warehouseApi } from "@/lib/api/warehouses";
import { useCountries } from "@/lib/hooks/useCountries";
import { useProductData } from "@/lib/hooks/useProductData";
import { useSourceCountries } from "@/lib/hooks/useSourceCountries";
import {
  calculateProductPrice,
  type PriceCalculationInput,
} from "@/lib/product-price-calculator";
import { validateProductUrl } from "@/lib/product-scraper";
import type { OriginCountry, ProductCategory } from "@/lib/shipping-rates";
import {
  getCountryCode,
  getCurrencyCode,
  getExchangeRate,
  getOriginCountryFromCode,
} from "@/lib/shipping-rates";
import type { Warehouse } from "@/lib/types/warehouse";
import {
  AlertCircle,
  ImageIcon,
  Info,
  Loader2,
  Mail,
  MessageCircle,
  Package,
  Plane,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function ProductPriceCalculatorPage() {
  // Form state
  const [productUrl, setProductUrl] = useState("");
  const [sourceCountryCode, setSourceCountryCode] = useState<string>("");
  const [destinationCountry, setDestinationCountry] = useState("LK"); // Default to Sri Lanka
  const [category, setCategory] = useState<ProductCategory | undefined>(
    undefined,
  );
  const [quantity, setQuantity] = useState(1);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);

  const { user } = useAuth();

  // Use React Query for product data fetching
  const {
    data: productData,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProductData(productUrl);

  // Fetch source countries from Supabase
  const { data: sourceCountries, isLoading: isLoadingSourceCountries } =
    useSourceCountries();

  // Fetch destination countries from Supabase
  const {
    data: destinationCountries,
    isLoading: isLoadingDestinationCountries,
  } = useCountries();

  // Auto-set source country from product data
  useEffect(() => {
    if (productData && !sourceCountryCode) {
      // Map OriginCountry to country code
      const countryCodeMap: Record<OriginCountry, string> = {
        india: "IN",
        malaysia: "MY",
        dubai: "AE",
        us: "US",
        srilanka: "LK",
        singapore: "SG",
      };
      const code = countryCodeMap[productData.originCountry];
      if (code) {
        setSourceCountryCode(code);
      }
    }
  }, [productData, sourceCountryCode]);

  // Price calculation state
  const [priceBreakdown, setPriceBreakdown] = useState<Awaited<
    ReturnType<typeof calculateProductPrice>
  > | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Shipping Estimate state
  const [shippingEstimateExchangeRate, setShippingEstimateExchangeRate] =
    useState<number>(1);
  const [shippingEstimateOriginCurrency, setShippingEstimateOriginCurrency] =
    useState<string>("INR");
  const [shippingEstimateDestinationCurrency] = useState<string>("INR");

  // Handle product URL input
  const handleUrlChange = (url: string) => {
    setProductUrl(url);
    setCalculationError(null);
    setPriceBreakdown(null);
  };

  // Get error message from React Query error
  const productErrorMessage = useMemo(() => {
    if (!productError) return null;

    if (productError instanceof Error) {
      return productError.message;
    }

    return "Failed to fetch product details";
  }, [productError]);

  // Validate URL and show error if invalid
  const urlValidation = useMemo(() => {
    if (!productUrl.trim()) return null;
    return validateProductUrl(productUrl);
  }, [productUrl]);

  // Handle price calculation
  const handleCalculatePrice = async () => {
    // Determine origin country
    // Default to India unless receiving country is IN, MY, LK, AE, GB (UK)
    const useActualSourceCountries = ["IN", "MY", "LK", "AE", "GB"];
    let originCountry: OriginCountry;

    // If receiving country is in the exception list, use actual source country
    if (useActualSourceCountries.includes(destinationCountry)) {
      if (sourceCountryCode) {
        const country = getOriginCountryFromCode(sourceCountryCode);
        if (!country) {
          setCalculationError("Invalid source country selected");
          return;
        }
        originCountry = country;
      } else if (productData) {
        originCountry = productData.originCountry;
      } else {
        setCalculationError(
          "Please select a source country or enter a product URL",
        );
        return;
      }
    } else {
      // For all other receiving countries, force India as source
      originCountry = "india";
    }

    if (!category) {
      setCalculationError("Please select a product category");
      return;
    }

    // Get product price - use product data if available, otherwise require manual input
    const productPrice = productData?.price;
    if (!productPrice) {
      setCalculationError(
        "Please enter a product URL or provide product price",
      );
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const input: PriceCalculationInput = {
        originCountry,
        destinationCountryCode: destinationCountry,
        category,
        productPrice,
        quantity,
        deliveryOption: "delivery", // Default to delivery in main calculation
      };

      const breakdown = await calculateProductPrice(input);
      setPriceBreakdown(breakdown);
    } catch (error) {
      setCalculationError(
        error instanceof Error ? error.message : "Failed to calculate price",
      );
    } finally {
      setIsCalculating(false);
    }
  };

  // Fetch warehouses when source country changes
  useEffect(() => {
    if (sourceCountryCode) {
      setIsLoadingWarehouses(true);
      warehouseApi
        .getWarehousesByCountry(sourceCountryCode)
        .then((data) => {
          setWarehouses(data);
        })
        .catch((error) => {
          console.error("Error fetching warehouses:", error);
          setWarehouses([]);
        })
        .finally(() => {
          setIsLoadingWarehouses(false);
        });
    } else {
      setWarehouses([]);
    }
  }, [sourceCountryCode]);

  // Calculate origin country for shipping estimate
  // Default to India unless receiving country is IN, MY, LK, AE, GB (UK)
  const shippingEstimateOriginCountry = useMemo<OriginCountry | null>(() => {
    // Countries where we use actual source country
    const useActualSourceCountries = ["IN", "MY", "LK", "AE", "GB"];

    // If receiving country is in the exception list, use actual source country
    if (useActualSourceCountries.includes(destinationCountry)) {
      if (sourceCountryCode) {
        return getOriginCountryFromCode(sourceCountryCode);
      } else if (productData) {
        return productData.originCountry;
      }
    }

    // For all other receiving countries, force India as source
    return "india";
  }, [sourceCountryCode, productData, destinationCountry]);

  // Calculate origin country code for shipping estimate
  const shippingEstimateOriginCountryCode = useMemo<string>(() => {
    if (!shippingEstimateOriginCountry) return "IN";
    return getCountryCode(shippingEstimateOriginCountry);
  }, [shippingEstimateOriginCountry]);

  // Load exchange rate and currency for shipping estimate
  useEffect(() => {
    async function loadShippingEstimateData() {
      if (!shippingEstimateOriginCountry) return;

      try {
        const [exchangeRate, originCurrency] = await Promise.all([
          getExchangeRate(shippingEstimateOriginCountry, destinationCountry),
          getCurrencyCode(shippingEstimateOriginCountry),
        ]);
        setShippingEstimateExchangeRate(exchangeRate);
        setShippingEstimateOriginCurrency(originCurrency);
      } catch (error) {
        console.error("Error loading shipping estimate data:", error);
      }
    }

    loadShippingEstimateData();
  }, [shippingEstimateOriginCountry, destinationCountry]);

  // Auto-recalculate when quantity, category, source country, or destination changes after first calculation
  useEffect(() => {
    // Only recalculate if:
    // 1. Price breakdown already exists (first calculation was done)
    // 2. Category is selected
    // 3. Either product data exists or source country is selected
    // 4. Not currently calculating (prevent infinite loops)
    if (
      priceBreakdown &&
      category &&
      (productData || sourceCountryCode) &&
      !isCalculating
    ) {
      handleCalculatePrice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, category, sourceCountryCode, destinationCountry]);

  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      {user?.id ? <Navbar /> : (<div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="logo.png" width={75} height={75} alt="logo" />
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-full text-purple-700 font-semibold hover:bg-purple-50 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>)}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Product Price Calculator</h1>
          <p className="text-muted-foreground">
            Enter a product URL from e-commerce sites in India, Sri Lanka, UAE,
            Malaysia, Singapore, or USA to calculate total shipping costs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product URL */}
                <div className="space-y-2">
                  <Label htmlFor="product-url">Product URL</Label>
                  <Input
                    id="product-url"
                    type="url"
                    placeholder="Enter any e-commerce product URL..."
                    value={productUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    disabled={isLoadingProduct}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported: E-commerce sites from India, Sri Lanka, UAE,
                    and Malaysia
                  </p>
                </div>

                {/* URL Validation Error */}
                {urlValidation && !urlValidation.valid && (
                  <Alert variant="destructive">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <AlertDescription className="mb-3">
                            {urlValidation.error || "Invalid URL"}
                          </AlertDescription>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Need help?
                            </span>
                            <button
                              onClick={() =>
                                window.open(
                                  "https://wa.me/919840635406?text=Hi, I need help with the product price calculator",
                                  "_blank",
                                )
                              }
                              className="flex items-center gap-1 px-3 py-1 rounded-md bg-green-200 hover:bg-green-300/70 text-green-600 text-xs font-medium transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5 " />
                              WhatsApp
                            </button>
                            <button
                              onClick={() =>
                              (window.location.href =
                                "mailto:test@gmail.com?subject=Help needed with Product Price Calculator")
                              }
                              className="flex items-center gap-1 px-3 py-1 rounded-md bg-green-200 hover:bg-green-300/70 text-green-600 text-xs font-medium transition-colors"
                              title="Send email"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Loading State */}
                {isLoadingProduct && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Fetching product details...</span>
                  </div>
                )}

                {/* Error State */}
                {productErrorMessage && (
                  <Alert variant="destructive">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <AlertDescription className="mb-3">
                            {productErrorMessage}
                          </AlertDescription>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Need help?
                            </span>
                            <button
                              onClick={() =>
                                window.open(
                                  "https://wa.me/919840635406?text=Hi, I need help with the product price calculator",
                                  "_blank",
                                )
                              }
                              className="flex items-center gap-1 px-3 py-1 rounded-md bg-green-200 hover:bg-green-300/70 text-green-600 text-xs font-medium transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5 " />
                              WhatsApp
                            </button>
                            <button
                              onClick={() =>
                              (window.location.href =
                                "mailto:test@gmail.com?subject=Help needed with Product Price Calculator")
                              }
                              className="flex items-center gap-1 px-3 py-1 rounded-md bg-green-200 hover:bg-green-300/70 text-green-600 text-xs font-medium transition-colors"
                              title="Send email"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Product Preview */}
                {/* {productData && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex gap-4">
                      {productData.image ? (
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={productData.image}
                            alt={productData.title}
                            fill
                            className="object-contain rounded"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {productData.title}
                        </h3>
                        <p className="text-lg font-bold text-purple-600 mt-1">
                          {productData.currency}{" "}
                          {productData.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Source Country */}
                <div className="space-y-2">
                  <Label>Source Country (Warehouse Location)</Label>
                  <CountrySelector
                    type="source"
                    value={sourceCountryCode}
                    onValueChange={(value) => {
                      setSourceCountryCode(value);
                      // Auto-set from product data if available
                      if (productData && !sourceCountryCode) {
                        const countryCode = getOriginCountryFromCode(value);
                        if (countryCode) {
                          // Source country is set via the selector
                        }
                      }
                    }}
                    sourceCountries={sourceCountries}
                    disabled={isLoadingSourceCountries}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select the country where the warehouse is located
                  </p>

                  {/* Warehouses Display */}
                  {sourceCountryCode && (
                    <div className="mt-2">
                      {isLoadingWarehouses ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading warehouses...</span>
                        </div>
                      ) : warehouses.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Available Warehouses:
                          </p>
                          <div className="space-y-1">
                            {warehouses.map((warehouse) => (
                              <div
                                key={warehouse.warehouse_id}
                                className="text-xs p-2 bg-gray-50 rounded border"
                              >
                                <p className="font-medium">
                                  {warehouse.name || "Warehouse"}
                                </p>
                                <p className="text-muted-foreground">
                                  {warehouse.address_line1}
                                  {warehouse.address_line2 &&
                                    `, ${warehouse.address_line2}`}
                                  {warehouse.postal_code &&
                                    `, ${warehouse.postal_code}`}
                                </p>
                                <p className="text-muted-foreground">
                                  {warehouse.country}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No warehouses found for this country
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Destination Country */}
                <div className="space-y-2">
                  <Label>Receiving Country</Label>
                  <CountrySelector
                    type="destination"
                    value={destinationCountry}
                    onValueChange={setDestinationCountry}
                    destinationCountries={destinationCountries}
                    disabled={isLoadingDestinationCountries}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select the country where the product will be delivered
                  </p>
                </div>

                {/* Product Category */}
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

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Item Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>

                {/* Shipping Method Info */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Plane className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Shipping Method</p>
                      <p className="text-sm text-muted-foreground">
                        Air Freight, 7-10 working days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Calculate Button */}
                <Button
                  onClick={handleCalculatePrice}
                  disabled={
                    (!productData && !sourceCountryCode) ||
                    !category ||
                    isCalculating
                  }
                  className="w-full"
                  size="lg"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Check Price
                    </>
                  )}
                </Button>

                {/* Calculation Error */}
                {calculationError && (
                  <Alert variant="destructive">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <AlertDescription className="mb-3">
                            {calculationError}
                          </AlertDescription>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Need help?
                            </span>
                            <button
                              onClick={() =>
                                window.open(
                                  "https://wa.me/919840635406?text=Hi, I need help with the product price calculator",
                                  "_blank",
                                )
                              }
                              className="flex items-center gap-1 px-3 py-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </button>
                            <button
                              onClick={() =>
                              (window.location.href =
                                "mailto:test@gmail.com?subject=Help needed with Product Price Calculator")
                              }
                              className="flex items-center gap-1 px-3 py-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-colors"
                              title="Send email"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>



          {/* Right Column - Price Breakdown */}
          <div className="space-y-2.5">

            {/* Product Preview */}
            {productData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Product Preview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Images are automatically scraped from product links
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-4">
                          <div className="flex-1 min-w-0">

                            {productData.image ? (
                              <>
                                <div className="relative h-56 flex-shrink-0 rounded-lg overflow-hidden border bg-muted">
                                  <Image
                                    src={productData.image}
                                    alt={productData.title}
                                    fill
                                    // className="object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src =
                                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Crect width='128' height='128' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                                    }}
                                    loading="lazy"
                                  />
                                </div>

                                <p className="font-semibold text-base mb-1 line-clamp-2">
                                  {productData.title}
                                </p>

                                <p className="text-lg font-bold text-purple-600 mb-2">
                                  {/* {productData.currency}{" "} */}
                                  Price:{" "}
                                  {productData.price.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </p>

                              </>
                            ) : (
                              <>
                                <div className="h-56  flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center border">
                                  Image couldn't be fetched automatically
                                </div>
                                <Alert className="border-yellow-200 bg-yellow-50 mt-3">
                                  <Info className="h-4 w-4 text-yellow-600" />
                                  <AlertDescription className="text-yellow-600 font-semibold">
                                    The product image couldn't be fetched automatically. Please continue entering the product information and proceed to place the order.                                  </AlertDescription>
                                </Alert>
                              </>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {priceBreakdown && category ? (
              <PriceBreakdown
                breakdown={priceBreakdown}
                productPrice={productData?.price || 0}
                productName={productData?.title || "Product"}
                productUrl={productUrl}
                productCurrency={productData?.currency || breakdown.originCurrency}
                quantity={quantity}
                originCountry={shippingEstimateOriginCountry || "india"}
                category={category}
                destinationCountryCode={destinationCountry}
                sourceCountryCode={sourceCountryCode}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Enter a product URL and click "Check Price" to see the
                    breakdown
                  </p>
                </CardContent>
              </Card>
            )}



          </div>
        </div>
      </div>

      {/* <PriceCalculator /> */}

      <Footer />
    </main>
  );
}
