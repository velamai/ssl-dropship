"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Calculator,
  Package,
  Plane,
  Building2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { fetchCountries } from "@/lib/api-client";

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Helper function to convert country name to value format
const countryNameToValue = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, "");
};

export function HeroSection() {
  const router = useRouter();
  const [productLink, setProductLink] = useState("");
  const [sourceCountry, setSourceCountry] = useState("");
  const [destination, setDestination] = useState("");
  const [showEstimate, setShowEstimate] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [countries, setCountries] = useState<
    Array<{ value: string; label: string; flag: string }>
  >([]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await fetchCountries();
        const formattedCountries = countriesData.map((country) => ({
          value: countryNameToValue(country.name),
          label: country.name,
          flag: getFlagEmoji(country.code),
        }));
        setCountries(formattedCountries);
      } catch (error) {
        console.error("Error loading countries:", error);
        // Fallback to default countries
        setCountries([
          { value: "india", label: "India", flag: "🇮🇳" },
          { value: "srilanka", label: "Sri Lanka", flag: "🇱🇰" },
          { value: "dubai", label: "Dubai (UAE)", flag: "🇦🇪" },
          { value: "malaysia", label: "Malaysia", flag: "🇲🇾" },
          { value: "uk", label: "United Kingdom", flag: "🇬🇧" },
        ]);
      }
    };
    loadCountries();
  }, []);

  const handleCalculate = () => {
    router.push("/product-price-calculator");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/30 via-white to-accent/20 py-20 ">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up-fade">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/50 border border-primary/20 rounded-full hover:bg-accent/70 transition-all hover:scale-105">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">
                Warehouses in 5 Countries • Transparent Pricing • Safe Delivery
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-balance leading-tight">
              Buy from 5 Countries,
              <br />
              <span className="text-primary animate-gradient">
                We Ship It Worldwide
              </span>
            </h1>

            <p className="text-xl text-muted-foreground text-pretty max-w-xl leading-relaxed">
              Paste any product link, calculate the total cost instantly, and
              get it delivered to your doorstep — even if the seller doesn't
              ship internationally.
            </p>

            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover-scale">
                <div className="text-3xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover-scale">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Transparent</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover-scale">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/product-price-calculator">
                <Button
                  size="lg"
                  className="bg-pink-gradient text-white hover:opacity-90 text-lg h-14 px-8 hover:shadow-2xl hover:scale-105 transition-all group w-full sm:w-auto"
                >
                  Calculate Product Price
                  <Calculator className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                </Button>
              </Link>
              <Link href="/warehouses">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg h-14 px-8 bg-white hover:bg-accent/50 hover:border-primary hover:scale-105 transition-all w-full sm:w-auto"
                >
                  Get your Own Virtual Warehouse
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual - Calculator */}
          <div
            className="relative animate-slide-up-fade"
            style={{ animationDelay: "0.2s" }}
          >
            <Card
              id="hero-calculator"
              className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-accent/30 to-accent/20 p-6 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-primary/10 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="product-link-hero"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    Product Link
                  </Label>
                  <Input
                    id="product-link-hero"
                    placeholder="Paste product URL"
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                    className="h-11 focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Supports Amazon, eBay, Ebay, Flipkart, Shopify, Daraz, noon, lazada, Meesho and more
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="source-country-hero"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    Source Country (From)
                  </Label>
                  <Select
                    value={sourceCountry}
                    onValueChange={setSourceCountry}
                  >
                    <SelectTrigger
                      id="source-country-hero"
                      className="h-11 focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50"
                    >
                      <SelectValue placeholder="Select source country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem
                          key={country.value}
                          value={country.value}
                          className="hover:bg-primary/10"
                        >
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="destination-hero"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    Destination Country (To)
                  </Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger
                      id="destination-hero"
                      className="h-11 focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50"
                    >
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem
                          key={country.value}
                          value={country.value}
                          className="hover:bg-primary/10"
                        >
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-pink-gradient text-white hover:opacity-90 h-12 text-sm hover:shadow-xl hover:scale-105 transition-all group/btn"
                  onClick={handleCalculate}
                >
                  Calculate Cost
                  <Calculator className="w-4 h-4 ml-2 group-hover/btn:rotate-12 transition-transform" />
                </Button>

                {showEstimate && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-accent/30 to-accent/20 rounded-xl border-2 border-primary/20 animate-in fade-in slide-in-from-bottom-4 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Estimate
                      </h3>
                      <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Live
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg text-xs">
                        <span className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />
                          <span>Product</span>
                        </span>
                        <span className="font-bold">$45.00</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg text-xs">
                        <span className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-primary" />
                          <span>Shipping</span>
                        </span>
                        <span className="font-bold">$12.50</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg text-xs">
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span>Handling</span>
                        </span>
                        <span className="font-bold">$3.00</span>
                      </div>
                      <div className="pt-2 border-t border-primary/20">
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="font-bold text-sm">Total</span>
                          <span className="font-bold text-lg text-primary">
                            $60.50
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full mt-3 bg-pink-gradient text-white hover:opacity-90 hover:shadow-lg transition-all text-xs h-9">
                      Proceed with Order
                      <Sparkles className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 animate-float hover:shadow-2xl transition-shadow hover-scale cursor-pointer border-2 border-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="https://flagcdn.com/w40/in.png"
                    alt="India flag"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold">IN</div>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl p-4 animate-float hover:shadow-2xl transition-shadow hover-scale cursor-pointer border-2 border-primary/10"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="https://flagcdn.com/w40/gb.png"
                    alt="UK flag"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold">GB</div>
                </div>
              </div>
            </div>

            <div
              className="absolute top-1/2 -left-10 bg-white rounded-2xl shadow-xl p-3 animate-float hover:shadow-2xl transition-shadow hover-scale cursor-pointer border-2 border-primary/10"
              style={{ animationDelay: "2s" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="https://flagcdn.com/w40/lk.png"
                    alt="Sri Lanka flag"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold">LK</div>
                </div>
              </div>
            </div>

            <div
              className="absolute top-1/3 -right-6 bg-white rounded-2xl shadow-xl p-3 animate-float hover:shadow-2xl transition-shadow hover-scale cursor-pointer border-2 border-primary/10"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="https://flagcdn.com/w40/my.png"
                    alt="Malaysia flag"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold">MY</div>
                </div>
              </div>
            </div>

            <div
              className="absolute bottom-1/3 -right-8 bg-white rounded-2xl shadow-xl p-3 animate-float hover:shadow-2xl transition-shadow hover-scale cursor-pointer border-2 border-primary/10"
              style={{ animationDelay: "2.5s" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="https://flagcdn.com/w40/ae.png"
                    alt="UAE flag"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold">Dubai</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
