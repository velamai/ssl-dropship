"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Package,
  Plane,
  AlertCircle,
  MessageCircle,
  Mail,
} from "lucide-react";
import { CountrySelector } from "@/components/product-price-calculator/country-selector";
import { CategorySelector } from "@/components/product-price-calculator/category-selector";
import { PriceBreakdown } from "@/components/product-price-calculator/price-breakdown";
import {
  fetchProductData,
  validateProductUrl,
  type ProductData,
} from "@/lib/product-scraper";
import {
  calculateProductPrice,
  type PriceCalculationInput,
} from "@/lib/product-price-calculator";
import type { ProductCategory } from "@/lib/shipping-rates";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/footer";

export default function ProductPriceCalculatorPage() {
  // Form state
  const [productUrl, setProductUrl] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("LK"); // Sri Lanka only
  const [category, setCategory] = useState<ProductCategory | undefined>(
    undefined
  );
  const [quantity, setQuantity] = useState(1);

  // Product data state
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Price calculation state
  const [priceBreakdown, setPriceBreakdown] = useState<ReturnType<
    typeof calculateProductPrice
  > | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Handle product URL input and fetch
  const handleUrlChange = async (url: string) => {
    setProductUrl(url);
    setProductError(null);
    setProductData(null);
    setPriceBreakdown(null);

    if (!url.trim()) {
      return;
    }

    // Validate URL
    const validation = validateProductUrl(url);
    if (!validation.valid) {
      setProductError(validation.error || "Invalid URL");
      return;
    }

    // Fetch product data
    setIsLoadingProduct(true);
    setProductError(null);

    try {
      const data = await fetchProductData(url);
      setProductData(data);
    } catch (error) {
      setProductError(
        error instanceof Error
          ? error.message
          : "Failed to fetch product details"
      );
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Handle price calculation
  const handleCalculatePrice = () => {
    if (!productData || !category) {
      setCalculationError(
        "Please ensure product URL and category are selected"
      );
      return;
    }

    // Weight is no longer required - calculation works without it
    setIsCalculating(true);
    setCalculationError(null);

    try {
      const input: PriceCalculationInput = {
        originCountry: productData.originCountry,
        category,
        productPrice: productData.price,
        quantity,
        deliveryOption: "delivery", // Default to delivery in main calculation
      };

      const breakdown = calculateProductPrice(input);
      setPriceBreakdown(breakdown);
    } catch (error) {
      setCalculationError(
        error instanceof Error ? error.message : "Failed to calculate price"
      );
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-purple flex items-center justify-center">
                <span className="text-white font-bold text-lg">B2S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                buy2send
              </span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-full text-purple-700 font-semibold hover:bg-purple-50 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Product Price Calculator</h1>
          <p className="text-muted-foreground">
            Enter a product URL from Amazon or eBay to calculate total shipping
            costs
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
                    placeholder="https://www.amazon.in/... or https://www.ebay.com/..."
                    value={productUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    disabled={isLoadingProduct}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported: Amazon (.com, .in, .ae, .com.my) and eBay (.com,
                    .in)
                  </p>
                </div>

                {/* Loading State */}
                {isLoadingProduct && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Fetching product details...</span>
                  </div>
                )}

                {/* Error State */}
                {productError && (
                  <Alert variant="destructive">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <AlertDescription className="mb-3">
                            {productError}
                          </AlertDescription>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Need help?
                            </span>
                            <button
                              onClick={() =>
                                window.open(
                                  "https://wa.me/918220586721?text=Hi, I need help with the product price calculator",
                                  "_blank"
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
                {productData && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex gap-4">
                      {productData.image && (
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={productData.image}
                            alt={productData.title}
                            fill
                            className="object-contain rounded"
                          />
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
                )}

                {/* Destination Country */}
                <div className="space-y-2">
                  <Label>Receiving Country</Label>
                  <CountrySelector
                    value={destinationCountry}
                    onValueChange={setDestinationCountry}
                  />
                  <p className="text-xs text-muted-foreground">
                    Currently only Sri Lanka is supported
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
                    !productData ||
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
                                  "https://wa.me/918220586721?text=Hi, I need help with the product price calculator",
                                  "_blank"
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
          <div>
            {priceBreakdown && productData && category ? (
              <PriceBreakdown
                breakdown={priceBreakdown}
                productName={productData.title}
                quantity={quantity}
                originCountry={productData.originCountry}
                category={category}
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

      <Footer />
    </main>
  );
}
