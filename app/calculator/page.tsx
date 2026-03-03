"use client";

import { Navbar } from "@/components/home-page/navbar";
import ShippingCalculator from "@/components/price-calculator/shipping-calculator";
import { Suspense } from "react";

function CalculatorContent() {
  return <ShippingCalculator />;
}

export default function Calculator() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            Loading calculator...
          </div>
        }
      >
        <CalculatorContent />
      </Suspense>
    </>
  );
}
