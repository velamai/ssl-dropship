"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Package, Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { convertCurrencyByCountryCode, countryCodeToCurrencies } from "@/lib/api/product-price-calculator";

const ADD_ON_PRICE = 100;

const ADD_ON_OPTIONS = [
  {
    id: "gift-wrapper",
    label: "Gift Wrapper",
    description: "Beautifully wrap your parcel before it leaves the warehouse.",
  },
  {
    id: "gift-message",
    label: "Gift Message",
    description:
      "Add a personalised note printed and placed inside the parcel.",
  },
  {
    id: "extra-packing",
    label: "Add Extra Packing Material",
    description:
      "Reinforce the item with bubble wrap and protective cushioning.",
  },
] as const;

type AddOnId = (typeof ADD_ON_OPTIONS)[number]["id"];

interface AddOnsStepProps {
  baseAmount: number;
  selectedAddOns: AddOnId[];
  onAddOnsChange: (selectedAddOns: AddOnId[], addOnTotal: number) => void;
  onNext: () => void;
  onBack: () => void;
  sourceCountryCode: string;
  destinationCountryCode: string | null;
}

type ExchangeRate = {
  sourceCountryExchangeRate: number;
  destinationCountryExchangeRate: number;
}

export function AddOnsStep({
  baseAmount,
  selectedAddOns,
  onAddOnsChange,
  onNext,
  onBack,
  sourceCountryCode,
  destinationCountryCode,
}: AddOnsStepProps) {

  console.log({ sourceCountryCode, destinationCountryCode });

  const sourceCountryCurrency = useMemo(() => {
    return countryCodeToCurrencies(sourceCountryCode) || "INR";
  }, [sourceCountryCode]);

  const destinationCountryCurrency = useMemo(() => {
    return countryCodeToCurrencies(destinationCountryCode || "") || "USD";
  }, [destinationCountryCode]);

  const { data: exchangeRateData, isLoading: isLoadingExchangeRateData } = useQuery({
    queryKey: ["exchangeRate", sourceCountryCode, destinationCountryCode],
    queryFn: async () => {
      const [sourceCountryExchangeRate, destinationCountryExchangeRate] = await Promise.all([
        convertCurrencyByCountryCode({
          sourceCountryCode: "IN",
          destinationCountryCode: sourceCountryCode,
          amount: null,
        }),
        convertCurrencyByCountryCode({
          sourceCountryCode: "IN",
          destinationCountryCode: destinationCountryCode || "",
          amount: null,
        }),
      ])
      return {
        sourceCountryExchangeRate: sourceCountryExchangeRate || 1,
        destinationCountryExchangeRate: destinationCountryExchangeRate || 1,
      }
    },
    enabled: !!sourceCountryCode && !!destinationCountryCode,
  });

  const formatCurrency = (value: number) =>
    `${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const addOnTotal = selectedAddOns.length * ADD_ON_PRICE;
  const grandTotal = baseAmount + addOnTotal;

  const handleToggleAddOn = (id: AddOnId) => {
    const next = selectedAddOns.includes(id)
      ? selectedAddOns.filter((item) => item !== id)
      : [...selectedAddOns, id];
    onAddOnsChange(next, next.length * ADD_ON_PRICE);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="w-5 h-5" />
            Choose Add-ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {isLoadingExchangeRateData ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading exchange rates...</span>
              </div>
            ) : (
              <>
                Each add-on adds{" "}
                <span className="font-medium text-foreground">
                  {sourceCountryCurrency} {formatCurrency(ADD_ON_PRICE * (exchangeRateData?.sourceCountryExchangeRate || 1))}
                  {destinationCountryCode && (
                    <> ({destinationCountryCurrency} {formatCurrency(ADD_ON_PRICE * (exchangeRateData?.destinationCountryExchangeRate || 1))})</>
                  )}
                </span>{" "}
                to your base amount of{" "}
                <span className="font-medium text-foreground">
                  {sourceCountryCurrency} {formatCurrency(baseAmount * (exchangeRateData?.sourceCountryExchangeRate || 1))}
                  {destinationCountryCode && (
                    <> ({destinationCountryCurrency} {formatCurrency(baseAmount * (exchangeRateData?.destinationCountryExchangeRate || 1))})</>
                  )}
                </span>
                .
              </>
            )}
          </div>

          <div className="space-y-3">
            {ADD_ON_OPTIONS.map((option) => {
              const isSelected = selectedAddOns.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleToggleAddOn(option.id)}
                  className={cn(
                    "w-full rounded-md border p-4 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-[2px] h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background flex items-center justify-center text-primary-foreground transition-colors",
                        isSelected ? "bg-primary" : "bg-background"
                      )}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-base font-semibold leading-none">
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      )}
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {isLoadingExchangeRateData ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading price...
                          </span>
                        ) : (
                          <>
                            + {sourceCountryCurrency} {formatCurrency(ADD_ON_PRICE * (exchangeRateData?.sourceCountryExchangeRate || 1))}
                            {destinationCountryCode && (
                              <> ({destinationCountryCurrency} {formatCurrency(ADD_ON_PRICE * (exchangeRateData?.destinationCountryExchangeRate || 1))})</>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">
              Estimated total
            </span>
            {isLoadingExchangeRateData ? (
              <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              <span className="text-lg font-semibold text-foreground">
                {sourceCountryCurrency} {formatCurrency(grandTotal * (exchangeRateData?.sourceCountryExchangeRate || 1))}
                {destinationCountryCode && (
                  <> ({destinationCountryCurrency} {formatCurrency(grandTotal * (exchangeRateData?.destinationCountryExchangeRate || 1))})</>
                )}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Continue to Review
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
