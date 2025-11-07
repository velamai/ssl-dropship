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
import { MapPin } from "lucide-react";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { ErrorMessage } from "@/components/ui/error-message";

interface ReceiverInfoTabProps {
  index: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
}

export function ReceiverInfoTab({
  index,
  control,
  register,
  errors,
}: ReceiverInfoTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          Receiver Information
        </CardTitle>
        <CardDescription>Enter the receiver's contact details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.firstName`}>
              First Name *
            </Label>
            <Input
              id={`shipments.${index}.receiver.firstName`}
              {...register(`shipments.${index}.receiver.firstName`)}
              placeholder="First name"
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
                  defaultCountry="IN"
                  international
                  countryCallingCodeEditable={false}
                  className={`${
                    errors.shipments?.[index]?.receiver?.phone
                      ? "[&_input]:border-red-500 [&_input]:focus:border-red-500 [&_input]:focus:ring-red-500 [&_button]:border-red-500"
                      : "[&_input]:border-[#e2e2e2] [&_input]:focus:border-[#9c4cd2] [&_input]:focus:ring-[#9c4cd2] [&_button]:border-[#e2e2e2] [&_button]:focus:border-[#9c4cd2]"
                  } [&_input]:h-[46px] [&_input]:bg-[#fcfcfc] [&_input]:text-[14px] [&_button]:h-[46px] [&_button]:bg-[#fcfcfc]`}
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`shipments.${index}.receiver.postalCode`}>
              Postal/ZIP Code (Optional)
            </Label>
            <Input
              id={`shipments.${index}.receiver.postalCode`}
              {...register(`shipments.${index}.receiver.postalCode`)}
              placeholder="Postal/ZIP code"
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
