"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

const countryData = [
  {
    country: "India",
    flag: "/flags/in.png",
    tagline:
      "Shop Indian brands, local marketplaces, ethnic wear, electronics, and wellness products",
    benefits: [
      "Traditional handicrafts",
      "Affordable tech",
      "Ayurvedic products",
      "Fashion & textiles",
      "Spices & specialty items",
      "Local artisan stores",
    ],
    image: "/home-page/indian-marketplace-with-colorful-textiles-spices-a.jpg",
  },
  {
    country: "Sri Lanka",
    flag: "/flags/sl.png",
    tagline: "Buy Sri Lankan specialty items, handicrafts, and local products",
    benefits: [
      "Premium Ceylon Tea",
      "Herbal Products",
      "Handcrafted Items",
      "Organic Products",
      "Traditional Crafts",
      "Authentic Spices",
    ],
    image: "/home-page/sri-lankan-tea-plantation-and-gemstones-display.jpg",
  },
  {
    country: "Dubai (UAE)",
    flag: "/flags/uae.png",
    tagline:
      "Access premium products, electronics, and global brands at competitive prices",
    benefits: [
      "Luxury brands",
      "Latest electronics",
      "Perfumes",
      "Tax-free shopping",
      "Designer fashion",
      "Chocolates, dates and more",
    ],
    image: "/home-page/dubai-luxury-mall-with-gold-jewelry-and-electronic.jpg",
  },
  {
    country: "Malaysia",
    flag: "/flags/ml.png",
    tagline: "Shop lifestyle products, gadgets, and regional brands",
    benefits: [
      "Tech & gadgets",
      "Skincare products",
      "Branded items",
      "Local brands",
      "Affordable prices",
      "Quality electronics",
    ],
    image: "/home-page/malaysian-shopping-district-with-technology-and-be.jpg",
  },
  {
    country: "United Kingdom",
    flag: "/flags/uk.png",
    tagline: "Buy UK-exclusive brands, fashion, supplements, and more",
    benefits: [
      "Fashion brands",
      "Books & media",
      "Specialty foods",
      "Premium quality",
      "British craftsmanship",
      "Iconic products",
    ],
    image: "/home-page/british-shopping-street-with-fashion-and-specialty.jpg",
  },
];

export function CountriesSection() {
  return (
    <section
      id="countries"
      className="py-20 bg-gradient-to-b from-accent/20 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-slide-up-fade">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Buy from These Countries
            <br />
            <span className="text-primary animate-gradient">with Ease</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
            Each country offers unique products and experiences. Where will you
            shop today?
          </p>
        </div>

        <div className="space-y-8">
          {countryData.map((item, index) => (
            <Card
              key={item.country}
              className="overflow-hidden hover:shadow-2xl transition-all border-2 border-accent/30 hover:border-primary/30 animate-slide-up-fade"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`grid lg:grid-cols-2 gap-0 ${
                  index % 2 === 0 ? "" : "lg:grid-cols-[1fr_1fr]"
                }`}
              >
                {/* Image - Order changes based on index */}
                <div
                  className={`relative aspect-video lg:aspect-auto bg-gradient-to-br from-accent/40 to-accent/30 ${
                    index % 2 === 0 ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <Image
                    src={item.image || "/home-page/placeholder.svg"}
                    alt={`Shopping in ${item.country}`}
                    width={600}
                    height={400}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div
                  className={`p-6 lg:p-8 flex flex-col justify-center ${
                    index % 2 === 0 ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Image
                      src={item.flag}
                      alt={`${item.country} flag`}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain animate-bounce-subtle"
                    />
                    <h3 className="text-2xl font-bold">{item.country}</h3>
                  </div>

                  <p className="text-muted-foreground mb-4 leading-relaxed text-base">
                    {item.tagline}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {item.benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 group-hover:scale-150 transition-transform" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/warehouses">
                    <Button className="bg-pink-gradient text-white hover:opacity-90 w-fit hover:scale-105 transition-all">
                      Start Shopping from {item.country}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
