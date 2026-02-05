"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Check, ChevronDown, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserAddress } from "@/lib/api/user-addresses";
import { useCountries } from "@/lib/hooks/useCountries";
import {
  useCreateAddress,
  useUpdateAddress,
} from "@/lib/hooks/useUserAddresses";
import { toast } from "@/components/ui/use-toast";

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  address?: UserAddress | null;
}

const defaultFormState = {
  code: "",
  address_line1: "",
  address_line2: "",
  address_line3: "",
  address_line4: "",
  pincode: "",
  country: "",
  is_primary: false,
};

export function AddressFormDialog({
  open,
  onOpenChange,
  mode,
  address,
}: AddressFormDialogProps) {
  const [formData, setFormData] = useState(defaultFormState);
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: countries = [] } = useCountries();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && address) {
        setFormData({
          code: address.code || "",
          address_line1: address.address_line1 || "",
          address_line2: address.address_line2 || "",
          address_line3: address.address_line3 || "",
          address_line4: address.address_line4 || "",
          pincode: address.pincode || "",
          country: address.country || "",
          is_primary: address.is_primary || false,
        });
      } else {
        setFormData(defaultFormState);
      }
      setError(null);
    }
  }, [open, mode, address]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormData(defaultFormState);
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.address_line1.trim()) {
      setError("Address line 1 is required");
      return;
    }

    if (!formData.country) {
      setError("Country is required");
      return;
    }

    if (!formData.code.trim()) {
      setError("Address label (e.g. Home, Office) is required");
      return;
    }

    try {
      if (mode === "add") {
        await createMutation.mutateAsync({
          address_line1: formData.address_line1.trim(),
          address_line2: formData.address_line2.trim() || null,
          address_line3: formData.address_line3.trim() || null,
          address_line4: formData.address_line4.trim() || null,
          pincode: formData.pincode.trim() || null,
          country: formData.country,
          code: formData.code.trim(),
          is_primary: formData.is_primary,
        });
        toast({
          title: "Address added",
          description: "Your address has been saved successfully.",
          variant: "default",
        });
      } else if (mode === "edit" && address) {
        await updateMutation.mutateAsync({
          addressId: address.user_address_id,
          payload: {
            address_line1: formData.address_line1.trim(),
            address_line2: formData.address_line2.trim() || null,
            address_line3: formData.address_line3.trim() || null,
            address_line4: formData.address_line4.trim() || null,
            pincode: formData.pincode.trim() || null,
            country: formData.country,
            code: formData.code.trim(),
            is_primary: formData.is_primary,
          },
        });
        toast({
          title: "Address updated",
          description: "Your address has been updated successfully.",
          variant: "default",
        });
      }
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save address. Please try again."
      );
      toast({
        title: mode === "add" ? "Failed to add address" : "Failed to update address",
        description:
          err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedCountry = countries.find((c) => c.code === formData.country);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Address" : "Edit Address"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new saved address for faster checkout."
              : "Update your address details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Address label</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g. Home, Office"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Address line 1 *</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address_line1: e.target.value,
                  }))
                }
                placeholder="Street address"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address_line2: e.target.value,
                  }))
                }
                placeholder="Apartment, suite, etc."
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_line3">City / Area</Label>
                <Input
                  id="address_line3"
                  value={formData.address_line3}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address_line3: e.target.value,
                    }))
                  }
                  placeholder="City or area"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Postal / Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pincode: e.target.value }))
                  }
                  placeholder="Postal code"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line4">Address line 4</Label>
              <Input
                id="address_line4"
                value={formData.address_line4}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address_line4: e.target.value,
                  }))
                }
                placeholder="Additional details"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Country *</Label>
              <Popover
                open={isCountrySelectOpen}
                onOpenChange={setIsCountrySelectOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCountrySelectOpen}
                    className="w-full justify-between h-[46px] bg-[#fcfcfc] text-left text-[14px]"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {selectedCountry ? (
                        <span>{selectedCountry.name}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          Select country
                        </span>
                      )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country.code}
                            value={`${country.code} ${country.name}`}
                            onSelect={() => {
                              setFormData((prev) => ({
                                ...prev,
                                country: country.code,
                              }));
                              setIsCountrySelectOpen(false);
                            }}
                          >
                            <span className="flex-1">{country.name}</span>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4",
                                formData.country === country.code
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_primary: e.target.checked,
                  }))
                }
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_primary" className="font-normal cursor-pointer">
                Set as default address
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {mode === "add" ? "Adding..." : "Saving..."}
                </>
              ) : mode === "add" ? (
                "Add Address"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
