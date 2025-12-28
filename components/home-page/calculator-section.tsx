"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Package, Plane, Building2, Sparkles } from "lucide-react";

const countries = [
  { value: "india", label: "India", flag: "🇮🇳" },
  { value: "srilanka", label: "Sri Lanka", flag: "🇱🇰" },
  { value: "dubai", label: "Dubai (UAE)", flag: "🇦🇪" },
  { value: "malaysia", label: "Malaysia", flag: "🇲🇾" },
  { value: "uk", label: "United Kingdom", flag: "🇬🇧" },
];

export function CalculatorSection() {
  const [productLink, setProductLink] = useState("");
  const [destination, setDestination] = useState("");
  const [showEstimate, setShowEstimate] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    if (productLink && destination) {
      setIsCalculating(true);
      setTimeout(() => {
        setIsCalculating(false);
        setShowEstimate(true);
      }, 1500);
    }
  };

  return (
    <section
      id="calculator"
      className="py-20 bg-gradient-to-b from-white to-accent/30 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-40 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 animate-slide-up-fade">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 hover:bg-primary/20 transition-all hover:scale-105 animate-pulse-glow">
            <Calculator className="w-4 h-4 text-primary animate-bounce-subtle" />
            <span className="text-sm font-medium text-primary">
              Instant Cost Estimate
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Calculate Your{" "}
            <span className="bg-pink-gradient text-white px-4 py-1 rounded-lg">
              Total Cost
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Get an instant estimate for product cost, shipping, and warehouse
            handling
          </p>
        </div>

        <Card
          className="p-8 lg:p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 hover:border-primary/30 relative overflow-hidden group animate-slide-up-fade"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="product-link"
                className="text-base font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Product Link
              </Label>
              <Input
                id="product-link"
                placeholder="Paste product URL from any supported marketplace"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                className="h-12 focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50"
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Supports Amazon, eBay, Alibaba, and most local marketplaces
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="destination"
                className="text-base font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Destination Country
              </Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger
                  id="destination"
                  className="h-12 focus:ring-2 focus:ring-primary/50 transition-all hover:border-primary/50"
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
              className="w-full bg-pink-gradient text-white hover:opacity-90 h-14 text-base hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
              onClick={handleCalculate}
              disabled={isCalculating || !productLink || !destination}
            >
              {isCalculating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Calculating...
                </>
              ) : (
                <>
                  Calculate Shipping Cost
                  <Calculator className="w-5 h-5 ml-2 group-hover/btn:rotate-12 transition-transform" />
                </>
              )}
            </Button>

            {showEstimate && (
              <div className="mt-8 p-6 bg-gradient-to-br from-accent/30 to-accent/20 rounded-2xl border-2 border-primary/20 animate-in fade-in slide-in-from-bottom-4 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-bounce-subtle" />
                    Estimated Breakdown
                  </h3>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Rates
                  </div>
                </div>

                <div className="space-y-3">
                  <div
                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-white/80 transition-all hover:translate-x-1 group/item animate-in fade-in slide-in-from-left"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-gradient rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium">Product Cost</span>
                    </div>
                    <span className="font-bold text-lg">$45.00</span>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-white/80 transition-all hover:translate-x-1 group/item animate-in fade-in slide-in-from-left"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-gradient rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform">
                        <Plane className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium">
                        International Shipping
                      </span>
                    </div>
                    <span className="font-bold text-lg">$12.50</span>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-white/80 transition-all hover:translate-x-1 group/item animate-in fade-in slide-in-from-left"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-gradient rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium">
                        Warehouse Handling
                      </span>
                    </div>
                    <span className="font-bold text-lg">$3.00</span>
                  </div>

                  <div
                    className="pt-4 border-t-2 border-primary/20 animate-in fade-in slide-in-from-bottom"
                    style={{ animationDelay: "0.4s" }}
                  >
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all">
                      <span className="font-bold text-lg">Total Estimate</span>
                      <span className="font-bold text-2xl text-primary bg-pink-gradient bg-clip-text text-transparent animate-pulse">
                        $60.50
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Final price confirmed after product verification. Customs
                      duties may apply.
                    </p>
                  </div>
                </div>

                <Button className="w-full mt-4 bg-pink-gradient text-white hover:opacity-90 hover:shadow-lg transition-all group/proceed">
                  Proceed with Order
                  <Sparkles className="w-4 h-4 ml-2 group-hover/proceed:rotate-12 transition-transform" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
