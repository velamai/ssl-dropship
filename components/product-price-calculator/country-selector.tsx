"use client";

import { useState } from "react";
import { CountryFlag } from "@/components/country-flag";
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
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortedCountries } from "@/lib/countries";
import type { OriginCountry } from "@/lib/shipping-rates";

// Source countries (warehouse locations)
const SOURCE_COUNTRIES: Array<{ originCountry: OriginCountry; code: string; name: string }> = [
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
}

export function CountrySelector({ 
  value, 
  onValueChange, 
  disabled,
  type = "destination" 
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);

  const countries = type === "source" ? SOURCE_COUNTRIES : DESTINATION_COUNTRIES;
  const selectedCountry = countries.find((country) => 
    type === "source" ? (country as typeof SOURCE_COUNTRIES[0]).code === value : country.code === value
  );

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
              <CountryFlag 
                countryCode={type === "source" ? (selectedCountry as typeof SOURCE_COUNTRIES[0]).code : selectedCountry.code} 
                size="sm" 
              />
              <span>{type === "source" ? (selectedCountry as typeof SOURCE_COUNTRIES[0]).name : selectedCountry.name}</span>
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
              {countries.map((country) => {
                const countryCode = type === "source" ? (country as typeof SOURCE_COUNTRIES[0]).code : country.code;
                const countryName = type === "source" ? (country as typeof SOURCE_COUNTRIES[0]).name : country.name;
                return (
                  <CommandItem
                    key={countryCode}
                    value={countryCode}
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
                        value === countryCode ? "opacity-100" : "opacity-0"
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

