"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
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
import { MapPin, Loader2, Globe, Check, ChevronDown } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { ErrorMessage } from "@/components/ui/error-message";
import { useUserAddresses, useUserProfile } from "@/lib/hooks/useUserAddresses";
import { useCountries } from "@/lib/hooks/useCountries";
import { Country } from "react-phone-number-input";

interface ReceiverInfoTabProps {
  index: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  countries?: any[]; // Optional, will use hook if not provided
}

export function ReceiverInfoTab({
  index,
  control,
  register,
  errors,
  setValue,
  countries = [],
}: ReceiverInfoTabProps) {
  const { data: userAddresses, isLoading: addressesLoading } =
    useUserAddresses();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  
  // Fetch countries from Supabase (use hook if not provided as prop)
  const {
    data: fetchedCountries,
    isLoading: isLoadingCountries,
  } = useCountries();
  
  // Use provided countries or fall back to fetched countries
  const countriesList = countries && countries.length > 0 ? countries : (fetchedCountries || []);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [isCountrySelectOpen, setIsCountrySelectOpen] = useState(false);

  const shipmentCountry = useWatch({
    control,
    name: `shipments.${index}.country`,
  }) as string | undefined;

  const handleAddressSelect = (address: any) => {
    setSelectedAddressId(address.user_address_id);

    // Auto-fill from user profile
    if (userProfile) {
      setValue(
        `shipments.${index}.receiver.firstName`,
        userProfile.first_name,
        {
          shouldValidate: true,
        }
      );
      setValue(
        `shipments.${index}.receiver.lastName`,
        userProfile.last_name || "",
        { shouldValidate: true }
      );
      setValue(`shipments.${index}.receiver.email`, userProfile.email, {
        shouldValidate: true,
      });
      // Combine phone_country_code and phone_number
      // Strip "+" from phone_country_code if it exists to avoid double "+"
      const countryCode = userProfile.phone_country_code.replace(/^\+/, "");
      const fullPhone = `+${countryCode}${userProfile.phone_number}`;
      setValue(`shipments.${index}.receiver.phone`, fullPhone, {
        shouldValidate: true,
      });
    }

    // Auto-fill address from selected address
    setValue(
      `shipments.${index}.receiver.addressLine1`,
      address.address_line1,
      {
        shouldValidate: true,
      }
    );
    setValue(
      `shipments.${index}.receiver.addressLine2`,
      address.address_line2 || "",
      { shouldValidate: true }
    );
    setValue(
      `shipments.${index}.receiver.addressLine3`,
      address.address_line3 || "",
      { shouldValidate: true }
    );
    setValue(
      `shipments.${index}.receiver.addressLine4`,
      address.address_line4 || "",
      { shouldValidate: true }
    );
    setValue(`shipments.${index}.receiver.postalCode`, address.pincode || "", {
      shouldValidate: true,
    });
    // Auto-fill receiving country from address (code is ISO country code)
    const countryCode = address.code || address.country;
    if (countryCode) {
      setValue(
        `shipments.${index}.receiver.receivingCountry`,
        typeof countryCode === "string" ? countryCode.toUpperCase() : countryCode,
        { shouldValidate: true }
      );
      setValue(`shipments.${index}.country`, countryCode, {
        shouldValidate: true,
      });
    }
  };

  const isReadOnly = !!selectedAddressId;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          Receiver Information
        </CardTitle>
        <CardDescription>Enter the receiver's contact details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Saved Addresses Section */}
        {!addressesLoading && userAddresses && userAddresses.length > 0 && (
          <div className="space-y-3 border-b pb-6">
            <Label className="text-sm font-semibold">
              Your Saved Addresses
            </Label>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {userAddresses.map((address) => (
                <div
                  key={address.user_address_id}
                  onClick={() => handleAddressSelect(address)}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedAddressId === address.user_address_id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {/* Radio button indicator */}
                  <div className="absolute top-3 right-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedAddressId === address.user_address_id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedAddressId === address.user_address_id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pr-8">
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        {address.is_primary ? "Primary Address" : ""}
                      </p>
                      <h3 className="font-semibold text-sm mb-1">
                        {address.address_line1}
                      </h3>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      {address.address_line3 && <p>{address.address_line3}</p>}
                      {address.address_line4 && <p>{address.address_line4}</p>}
                      <p>
                        {address.country}
                        {address.pincode && ` - ${address.pincode}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {addressesLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              Loading saved addresses...
            </span>
          </div>
        )}

        {/* Form Fields - read-only when saved address is selected */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Receiving Country - read-only when address selected */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`shipments.${index}.receiver.receivingCountry`}>
              Receiving Country *
            </Label>
            {isReadOnly ? (
              <Controller
                name={`shipments.${index}.receiver.receivingCountry`}
                control={control}
                render={({ field }) => {
                  const selectedCountry = countriesList.find(
                    (country) => country.code === field.value
                  );
                  return (
                    <div className="flex h-[46px] items-center rounded-md border border-[#e2e2e2] bg-muted/50 px-3 text-sm">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedCountry?.name ?? field.value ?? "—"}
                    </div>
                  );
                }}
              />
            ) : (
              <Controller
                name={`shipments.${index}.receiver.receivingCountry`}
                control={control}
                render={({ field }) => {
                  const selectedCountry = countriesList.find(
                    (country) => country.code === field.value
                  );
                  return (
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
                          className={cn(
                            "w-full justify-between h-[46px] bg-[#fcfcfc] text-left text-[14px]",
                            errors.shipments?.[index]?.receiver?.receivingCountry
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "border-[#e2e2e2] focus:border-[#9c4cd2] focus:ring-[#9c4cd2]"
                          )}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            {selectedCountry ? (
                              <span>{selectedCountry.name}</span>
                            ) : (
                              <span className="text-muted-foreground">
                                Select receiving country
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
                              {countriesList.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={`${country.code} ${country.name}`}
                                  onSelect={() => {
                                    field.onChange(country.code);
                                    setIsCountrySelectOpen(false);
                                  }}
                                >
                                  <span className="flex-1">{country.name}</span>
                                  <Check
                                    className={cn(
                                      "ml-2 h-4 w-4",
                                      field.value === country.code
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
                  );
                }}
              />
            )}
            <ErrorMessage
              error={errors.shipments?.[index]?.receiver?.receivingCountry}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.firstName`}>
              First Name *
            </Label>
            <Input
              id={`shipments.${index}.receiver.firstName`}
              {...register(`shipments.${index}.receiver.firstName`)}
              placeholder="First name"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
            <ErrorMessage
              error={errors.shipments?.[index]?.receiver?.firstName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.lastName`}>
              Last Name *
            </Label>
            <Input
              id={`shipments.${index}.receiver.lastName`}
              {...register(`shipments.${index}.receiver.lastName`)}
              placeholder="Last name"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
            <ErrorMessage
              error={errors.shipments?.[index]?.receiver?.lastName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.company`}>
              Company
            </Label>
            <Input
              id={`shipments.${index}.receiver.company`}
              {...register(`shipments.${index}.receiver.company`)}
              placeholder="Company name"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.vatTax`}>
              VAT/TAX
            </Label>
            <Input
              id={`shipments.${index}.receiver.vatTax`}
              {...register(`shipments.${index}.receiver.vatTax`)}
              placeholder="VAT or TAX number"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.phone`}>
              Phone Number *
            </Label>
            <Controller
              name={`shipments.${index}.receiver.phone`}
              control={control}
              render={({ field: { onChange, value } }) => (
                <PhoneInput
                  id={`shipments.${index}.receiver.phone`}
                  placeholder="Enter phone number"
                  value={value || ""}
                  onChange={onChange}
                  defaultCountry={shipmentCountry as Country}
                  international
                  countryCallingCodeEditable={false}
                  disabled={isReadOnly}
                  className={`${
                    errors.shipments?.[index]?.receiver?.phone
                      ? "[&_input]:border-red-500 [&_input]:focus:border-red-500 [&_input]:focus:ring-red-500 [&_button]:border-red-500"
                      : "[&_input]:border-[#e2e2e2] [&_input]:focus:border-[#9c4cd2] [&_input]:focus:ring-[#9c4cd2] [&_button]:border-[#e2e2e2] [&_button]:focus:border-[#9c4cd2]"
                  } [&_input]:h-[46px] [&_input]:bg-[#fcfcfc] [&_input]:text-[14px] [&_button]:h-[46px] [&_button]:bg-[#fcfcfc] ${isReadOnly ? "[&_input]:bg-muted/50 [&_button]:bg-muted/50" : ""}`}
                />
              )}
            />
            <ErrorMessage error={errors.shipments?.[index]?.receiver?.phone} />
            {!errors.shipments?.[index]?.receiver?.phone && (
              <p className="text-[12px] text-[#a2a2a2] mt-1">
                International phone numbers supported
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.email`}>Email *</Label>
            <Input
              id={`shipments.${index}.receiver.email`}
              {...register(`shipments.${index}.receiver.email`)}
              type="email"
              placeholder="Email address"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
            <ErrorMessage error={errors.shipments?.[index]?.receiver?.email} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`shipments.${index}.receiver.addressLine1`}>
              Address Line 1 *
            </Label>
            <Input
              id={`shipments.${index}.receiver.addressLine1`}
              {...register(`shipments.${index}.receiver.addressLine1`)}
              placeholder="Address line 1"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
            <ErrorMessage
              error={errors.shipments?.[index]?.receiver?.addressLine1}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`shipments.${index}.receiver.addressLine2`}>
              Address Line 2 *
            </Label>
            <Input
              id={`shipments.${index}.receiver.addressLine2`}
              {...register(`shipments.${index}.receiver.addressLine2`)}
              placeholder="Address line 2"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
            <ErrorMessage
              error={errors.shipments?.[index]?.receiver?.addressLine2}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`shipments.${index}.receiver.addressLine3`}>
              Address Line 3
            </Label>
            <Input
              id={`shipments.${index}.receiver.addressLine3`}
              {...register(`shipments.${index}.receiver.addressLine3`)}
              placeholder="Address line 3"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`shipments.${index}.receiver.addressLine4`}>
              Address Line 4
            </Label>
            <Input
              id={`shipments.${index}.receiver.addressLine4`}
              {...register(`shipments.${index}.receiver.addressLine4`)}
              placeholder="Address line 4"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.postalCode`}>
              Postal/ZIP Code
            </Label>
            <Input
              id={`shipments.${index}.receiver.postalCode`}
              {...register(`shipments.${index}.receiver.postalCode`)}
              placeholder="Postal/ZIP code"
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted/50" : ""}
            />
            <ErrorMessage
              error={errors.shipments?.[index]?.receiver?.postalCode}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
