"use client";

import { useAuth } from "@/contexts/auth-context";
import { Suspense } from "react";
import ShippingCalculator from "./shipping-calculator";

function CalculatorContent() {
    return <ShippingCalculator />;
}

export default function PriceCalculator() {
    const { user } = useAuth();

    return (
        <>
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
