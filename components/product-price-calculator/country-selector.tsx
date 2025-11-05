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

// Currently only Sri Lanka is supported as destination
const DESTINATION_COUNTRIES = [
  {
    code: "LK",
    name: "Sri Lanka",
  },
];

interface CountrySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CountrySelector({ value, onValueChange, disabled }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = DESTINATION_COUNTRIES.find((country) => country.code === value);

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
            "Select destination country..."
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
              {DESTINATION_COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.code}
                  onSelect={() => {
                    onValueChange(country.code);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <CountryFlag countryCode={country.code} size="sm" />
                    <span>{country.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

