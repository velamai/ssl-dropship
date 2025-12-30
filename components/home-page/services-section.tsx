"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ServicesSection() {
  return (
    <section id="services" className="pt-10 pb-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Two Ways to Ship Internationally
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the service that fits your needs
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Product Link Service */}
          <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="relative h-64 overflow-hidden">
              <img
                src="/home-page/linktoshipservice.jpeg"
                alt="Product Link Service"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <Package className="w-10 h-10 text-white mb-3" />
                <h3 className="text-2xl font-bold text-white">
                  Product Link → Ship
                </h3>
              </div>
            </div>
            <CardContent className="p-8">
              <p className="text-muted-foreground mb-6">
                Don't have a local address? Just paste the product link — we'll
                receive, store, and ship it internationally.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">
                    Perfect for one-time purchases
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">No warehouse address needed</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">Instant price calculation</span>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3">Ideal for:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                    One-time buyers
                  </span>
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                    International customers
                  </span>
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                    Gift purchases
                  </span>
                </div>
              </div>
              <Link href="/product-price-calculator">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Ship Using Product Link <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Virtual Warehouse Service */}
          <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 border-primary/20">
            <div className="relative h-64 overflow-hidden">
              <img
                src="/home-page/virtualwarehouse.jpeg"
                alt="Virtual Warehouse Service"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <MapPin className="w-10 h-10 text-white mb-3" />
                <h3 className="text-2xl font-bold text-white">
                  Virtual Warehouse
                </h3>
              </div>
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                MOST POPULAR
              </div>
            </div>
            <CardContent className="p-8">
              <p className="text-muted-foreground mb-6">
                Get your personal warehouse address. Shop from multiple sellers,
                store packages, and consolidate shipments to save costs.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">Best for frequent shoppers</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">Combine multiple orders</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">Save on shipping costs</span>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3">Ideal for:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                    Frequent shoppers
                  </span>
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                    Bulk buyers
                  </span>
                  <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                    Small businesses
                  </span>
                </div>
              </div>
              <Link href="/warehouses">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Get Virtual Warehouse <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
