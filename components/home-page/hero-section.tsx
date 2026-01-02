"use client";

import Image from "next/image";

export function HeroSection() {
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
          </div>

          {/* Right Visual - Hero Image */}
          <div
            className="relative animate-slide-up-fade"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative w-full h-full">
              <Image
                src="/home-page/heroSectionImg.png"
                alt="Buy from 5 countries, we ship it worldwide"
                width={800}
                height={600}
                className="w-full h-auto object-contain rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
