"use client";

import { motion } from "motion/react";
import Image from "next/image";

const partners = [
  {
    name: "Amazon",
    color: "from-orange-500 to-yellow-400",
    description: "World's largest online marketplace with millions of products",
    logo: "company/amazon.svg",
  },
  {
    name: "Etsy",
    color: "from-green-600 to-teal-500",
    description: "Global marketplace for unique and handmade products",
    logo: "company/etsy.svg",
  },
  {
    name: "eBay",
    color: "from-blue-600 to-red-500",
    description: "Online auction and shopping platform for new and used items",
    logo: "company/ebay.svg",
  },
  {
    name: "Flipkart",
    color: "from-blue-500 to-yellow-400",
    description: "India's leading e-commerce platform for all categories",
    logo: "company/flipkart.svg",
  },
  {
    name: "Shopify",
    color: "from-green-500 to-teal-600",
    description: "Complete e-commerce platform for online stores",
    logo: "company/shopify.svg",
  },
  {
    name: "Daraz",
    color: "from-red-500 to-orange-500",
    description: "Leading online marketplace in South Asia",
    logo: "company/daraz-seeklogo.svg",
  },
  {
    name: "Lazada",
    color: "from-blue-500 to-orange-400",
    description: "Southeast Asia's leading e-commerce platform",
    logo: "company/1024px-Lazada_(2019).svg.png",
  },
  {
    name: "Meesho",
    color: "from-pink-500 to-purple-500",
    description: "Social commerce platform empowering resellers in India",
    logo: "company/meesho.svg",
  },
  {
    name: "Walmart",
    color: "from-blue-600 to-blue-400",
    description: "American multinational retail corporation",
    logo: "company/walmart.svg",
  },
];

const marqueePartners = [...partners, ...partners];

export function PartnersRow() {
  return (
    <section className="py-20 bg-gradient-to-br from-red-50 to-red-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Trusted Global Shopping Destinations
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We help you purchase and ship products from top marketplaces to your
            doorstep.
          </p>
        </div>

        <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div
            animate={{ x: "-50%" }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
              repeatType: "loop",
            }}
            className="flex w-max gap-6 will-change-transform"
          >
            {marqueePartners.map(
              ({ name, description, color, logo }, index) => (
                <div
                  key={`${name}-${index}`}
                  className="group relative w-[250px] shrink-0 rounded-3xl border border-gray-200/50 bg-white/90 p-6 shadow-xl transition-all duration-300 hover:shadow-2xl"
                  style={{ boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.2)" }}
                >
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
                  />

                  <div className="relative mb-4 flex h-14 items-center justify-center">
                    <Image
                      src={logo}
                      alt={`${name} logo`}
                      width={120}
                      height={56}
                      className="object-contain"
                    />
                  </div>

                  <h3 className="mb-2 text-center text-lg font-bold text-foreground">
                    {name}
                  </h3>
                  <p className="text-center text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              ),
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
