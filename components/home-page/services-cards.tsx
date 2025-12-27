"use client";
import { ArrowRight, Package, Plane, Ship, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

const services = [
  {
    icon: Plane,
    title: "Express Air Freight",
    description:
      "Fastest delivery option for urgent shipments. Reach any country in 3-5 days with our premium air service.",
    features: ["3-5 day delivery", "Priority handling", "Premium tracking"],
  },
  {
    icon: Package,
    title: "Standard Courier",
    description:
      "Cost-effective solution for regular shipments. Perfect balance of speed and affordability.",
    features: ["7-10 day delivery", "Economical rates", "Reliable service"],
  },
  {
    icon: Ship,
    title: "Economy Sea Freight",
    description:
      "Budget-friendly option for large volume shipments. Best for non-urgent bulk orders.",
    features: ["20-30 day delivery", "Lowest rates", "Bulk shipments"],
  },
];

export function ServicesCards() {
  const [activeService, setActiveService] = useState<number | null>(null);

  return (
    <section className="py-20 bg-white -z-20" id="services">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 z-10 relative">
          <h2 className="text-3xl md:text-5xl font-bold mb-4  text-white">
            Our Services
          </h2>
          <p className="text-xl text-white max-w-2xl mx-auto">
            Choose the shipping method that best fits your needs
          </p>
        </div>

        {/* <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <Card
              key={index}
              className="p-8 border-0 shadow-lg hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:-translate-y-3 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <service.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-red-600 transition-colors">{service.title}</h3>
              <p className="text-muted-foreground mb-6">{service.description}</p>
              <ul className="space-y-2">
                {service.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm hover:translate-x-1 transition-transform duration-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div> */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16 max-w-5xl mx-auto mt-16">
          <a
            href="https://www.universalmail.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-gray-100 block"
            onMouseEnter={() => setActiveService(0)}
            onMouseLeave={() => setActiveService(null)}
          >
            <div className="p-8">
              <div className="w-20 h-20  bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <Plane className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Universal Mail
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Premium air cargo logistics connecting India with the world.
                Fast, reliable, and secure international shipping services.
              </p>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 transition-all">
                Calculate price
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </a>

          <a
            href="https://www.universaldukaan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-gray-100 block"
            onMouseEnter={() => setActiveService(1)}
            onMouseLeave={() => setActiveService(null)}
          >
            <div className="p-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Universal Dukkan
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your gateway to authentic Indian products delivered worldwide.
                Shop from a curated selection with seamless delivery.
              </p>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 transition-all">
                Shop Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </a>

          <a
            href="https://www.buy2send.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-gray-100 block"
            onMouseEnter={() => setActiveService(2)}
            onMouseLeave={() => setActiveService(null)}
          >
            <div className="p-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Buy2Send
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Global warehouses for your convenience. Shop from international
                sites and ship to any country.
              </p>
              <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 transition-all">
                Place Order
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
