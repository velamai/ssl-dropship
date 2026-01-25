"use client";

import { CountryFlag } from "@/components/country-flag";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Country } from "@/lib/api/countries";
import type { SourceCountry } from "@/lib/api/source-countries";
import type { OriginCountry } from "@/lib/shipping-rates";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

// Source countries (warehouse locations) - fallback
const SOURCE_COUNTRIES: Array<{
  originCountry: OriginCountry;
  code: string;
  name: string;
}> = [
  { originCountry: "india", code: "IN", name: "India" },
  { originCountry: "malaysia", code: "MY", name: "Malaysia" },
  { originCountry: "dubai", code: "AE", name: "United Arab Emirates" },
  { originCountry: "us", code: "US", name: "United States" },
  { originCountry: "srilanka", code: "LK", name: "Sri Lanka" },
  { originCountry: "singapore", code: "SG", name: "Singapore" },
];

// Supported destination countries
const DESTINATION_COUNTRIES = [
  {
    code: "IN",
    name: "India",
  },
  {
    code: "MY",
    name: "Malaysia",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
  },
  {
    code: "LK",
    name: "Sri Lanka",
  },
];

interface CountrySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  type?: "source" | "destination";
  sourceCountries?: SourceCountry[]; // Optional prop for fetched source countries
  destinationCountries?: Country[]; // Optional prop for fetched destination countries
}

export function CountrySelector({
  value,
  onValueChange,
  disabled,
  type = "destination",
  sourceCountries,
  destinationCountries,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);

  // Use fetched source countries if provided, otherwise fall back to hardcoded list
  const sourceCountriesList =
    type === "source"
      ? sourceCountries && sourceCountries.length > 0
        ? sourceCountries.map((c) => ({ code: c.code, name: c.name }))
        : SOURCE_COUNTRIES.map((c) => ({ code: c.code, name: c.name }))
      : null;

  // Use fetched destination countries if provided, otherwise fall back to hardcoded list
  // Merge fetched countries with fallback to ensure all countries are included
  const destinationCountriesList =
    type === "destination"
      ? (() => {
          const fetchedCountries =
            destinationCountries && destinationCountries.length > 0
              ? destinationCountries.map((c) => ({
                  code: c.code,
                  name: c.name,
                }))
              : [];

          // Create a map of fetched countries by code for quick lookup
          const fetchedMap = new Map(fetchedCountries.map((c) => [c.code, c]));

          // Merge: use fetched countries, but add fallback countries that aren't in fetched list
          const mergedCountries = [...fetchedCountries];
          DESTINATION_COUNTRIES.forEach((fallbackCountry) => {
            if (!fetchedMap.has(fallbackCountry.code)) {
              mergedCountries.push(fallbackCountry);
            }
          });

          // If no fetched countries, use fallback
          return mergedCountries.length > 0
            ? mergedCountries
            : DESTINATION_COUNTRIES;
        })()
      : null;

  const countries =
    type === "source" ? sourceCountriesList : destinationCountriesList;
  const selectedCountry = countries?.find((country) => country.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <CountryFlag countryCode={selectedCountry.code} size="sm" />
              <span>{selectedCountry.name}</span>
            </div>
          ) : (
            `Select ${type === "source" ? "source" : "destination"} country...`
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries?.map((country) => {
                const countryCode = country.code;
                const countryName = country.name;
                return (
                  <CommandItem
                    key={countryCode}
                    value={`${countryCode} ${countryName}`}
                    onSelect={() => {
                      onValueChange(countryCode);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <CountryFlag countryCode={countryCode} size="sm" />
                      <span>{countryName}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        value === countryCode ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
