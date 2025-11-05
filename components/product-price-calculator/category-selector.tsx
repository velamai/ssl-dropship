"use client";

import { useState } from "react";
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
import type { ProductCategory } from "@/lib/shipping-rates";

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "clothes", label: "Clothes" },
  { value: "laptop", label: "Laptop" },
  { value: "watch", label: "Watch" },
  { value: "medicine", label: "Medicine" },
  { value: "electronics", label: "Electronics" },
  { value: "others", label: "Others" },
];

interface CategorySelectorProps {
  value?: ProductCategory;
  onValueChange: (value: ProductCategory) => void;
  disabled?: boolean;
}

export function CategorySelector({ value, onValueChange, disabled }: CategorySelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedCategory = PRODUCT_CATEGORIES.find((category) => category.value === value);

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
          {selectedCategory ? selectedCategory.label : "Select product category..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {PRODUCT_CATEGORIES.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.value}
                  onSelect={() => {
                    onValueChange(category.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

