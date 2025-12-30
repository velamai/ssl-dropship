"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, CableIcon as CalcIcon, Warehouse } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const steps = [
  {
    icon: ShoppingBag,
    number: "01",
    title: "Find Your Product",
    description:
      "Shop from any online store or local seller in our supported countries.",
    image: "/steps/step1.png",
  },
  {
    icon: CalcIcon,
    number: "02",
    title: "Paste the Product Link",
    description: "Enter the product URL in our pricing calculator.",
    image: "/steps/step2.png",
  },
  {
    icon: CalcIcon,
    number: "03",
    title: "See the Total Cost",
    description:
      "Instantly view the product cost, shipping, and handling — no hidden charges.",
    image: "/steps/step3.png",
  },
  {
    icon: Warehouse,
    number: "04",
    title: "We Receive & Ship",
    description:
      "Your product is delivered to our warehouse and shipped safely to you.",
    image: "/steps/step4.png",
  },
];

export function HowItWorksSection() {
  const router = useRouter();

  return (
    <section
      id="how-it-works"
      className="py-20 bg-gradient-to-b from-white to-accent/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-slide-up-fade">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
            <span className="text-primary">Simple. Transparent.</span>{" "}
            Borderless.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Four easy steps from browsing to delivery — we handle the complexity
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.number}
                className="p-6 hover:shadow-2xl transition-all relative overflow-hidden group bg-white border-0 shadow-lg hover:border-primary/30 animate-slide-up-fade"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Background Number */}
                <div className="absolute -top-6 -right-6 text-9xl font-bold text-accent/30 group-hover:text-primary/20 transition-colors">
                  {step.number}
                </div>

                {/* Content */}
                <div className="relative">
                  {/* Step Image */}
                  <div className="relative w-full h-56 mb-6 rounded-lg overflow-hidden bg-transparent group-hover:scale-105 transition-transform duration-300">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      priority={index < 2}
                    />
                  </div>

                  {/* Icon (smaller, secondary) */}
                  <div className="w-12 h-12 bg-pink-gradient rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>

                {/* Connection Arrow (except last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-primary/40 to-transparent z-20" />
                )}
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-pink-gradient text-white hover:opacity-90 hover:scale-105 transition-all"
            onClick={() => {
              router.push("/product-price-calculator");
            }}
          >
            Try the Calculator Now
          </Button>
        </div>
      </div>
    </section>
  );
}
