"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Users, DollarSign } from "lucide-react";

const warehouseCountries = [
  { flag: "🇮🇳", name: "India", code: "IN" },
  { flag: "🇱🇰", name: "Sri Lanka", code: "LK" },
  { flag: "🇦🇪", name: "Dubai", code: "AE" },
  { flag: "🇲🇾", name: "Malaysia", code: "MY" },
  { flag: "🇬🇧", name: "United Kingdom", code: "UK" },
];

const benefits = [
  {
    icon: MapPin,
    title: "Buy from sellers who don't ship internationally",
    description: "Shop from local marketplaces and sellers",
  },
  {
    icon: Package,
    title: "Receive multiple orders at one place",
    description: "Consolidate all your packages",
  },
  {
    icon: DollarSign,
    title: "Combine packages to save shipping cost",
    description: "Bundle shipments for maximum savings",
  },
  {
    icon: Package,
    title: "Ship internationally whenever you're ready",
    description: "Full control over your shipping schedule",
  },
];

export function WarehouseAddressSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-pink-50/50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-64 h-64 bg-pink-400 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-80 h-80 bg-pink-300 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 animate-slide-up-fade">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full mb-6">
            <MapPin className="w-4 h-4 text-pink-600" />
            <span className="text-sm font-medium text-pink-700">
              High Priority Feature
            </span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-balance">
            Get a Local{" "}
            <span className="bg-pink-gradient bg-clip-text text-transparent">
              Warehouse Address
            </span>
            <br />
            in 5 Countries
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            Shop like a local, even when you're abroad. With Buy2send, you get a
            personal warehouse address in multiple countries.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Countries Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-slide-up-fade">
            {warehouseCountries.map((country, index) => (
              <Card
                key={country.code}
                className="p-6 text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer bg-gradient-to-br from-white to-pink-50/50 border-2 border-pink-100 hover:border-pink-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="text-5xl mb-3 animate-bounce-subtle"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {country.flag}
                </div>
                <div className="font-bold text-lg mb-1">{country.name}</div>
                <div className="text-xs text-muted-foreground">Get Address</div>
              </Card>
            ))}
            <Card className="p-6 text-center bg-pink-gradient text-white hover:opacity-90 hover:scale-105 transition-all cursor-pointer col-span-2 sm:col-span-1 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold mb-1">5</div>
              <div className="text-sm">Countries</div>
            </Card>
          </div>

          {/* Benefits */}
          <div
            className="space-y-6 animate-slide-up-fade"
            style={{ animationDelay: "0.3s" }}
          >
            <h3 className="text-2xl font-bold mb-6">How It Helps You</h3>
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-pink-gradient group-hover:scale-110 transition-all">
                    <Icon className="w-6 h-6 text-pink-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1 group-hover:text-pink-600 transition-colors">
                      {benefit.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {benefit.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best For Section */}
        <Card className="p-8 bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-100 animate-slide-up-fade">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2">Perfect For</h3>
            <p className="text-muted-foreground">
              Who benefits the most from our warehouse address service?
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl hover:shadow-lg transition-all hover-scale">
              <Users className="w-8 h-8 text-pink-600 mx-auto mb-3" />
              <div className="font-semibold mb-1">Expats & NRIs</div>
              <div className="text-sm text-muted-foreground">
                Living abroad but shopping from home
              </div>
            </div>
            <div className="text-center p-6 bg-white rounded-xl hover:shadow-lg transition-all hover-scale">
              <Package className="w-8 h-8 text-pink-600 mx-auto mb-3" />
              <div className="font-semibold mb-1">International Shoppers</div>
              <div className="text-sm text-muted-foreground">
                Access to exclusive products
              </div>
            </div>
            <div className="text-center p-6 bg-white rounded-xl hover:shadow-lg transition-all hover-scale">
              <DollarSign className="w-8 h-8 text-pink-600 mx-auto mb-3" />
              <div className="font-semibold mb-1">Small Businesses</div>
              <div className="text-sm text-muted-foreground">
                Importing products efficiently
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button
              size="lg"
              className="bg-pink-gradient text-white hover:opacity-90 hover:scale-105 transition-all"
            >
              Get Your Warehouse Address
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
