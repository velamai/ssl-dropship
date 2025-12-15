"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/ui/error-message";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { getCountryCode } from "@/lib/utils";
import {
  Warehouse,
  MapPin,
  Mail,
  Globe,
  User2,
  Loader2,
} from "lucide-react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { CountryFlag } from "@/components/country-flag";

interface WarehouseSelectionStepProps {
  index: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
}

export function WarehouseSelectionStep({
  index,
  control,
  register,
  errors,
  watch,
  setValue,
}: WarehouseSelectionStepProps) {
  // Fetch warehouses for selection
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();

  const watchedWarehouseId = watch(`shipments.${index}.warehouseId`);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Warehouse className="h-4 w-4 mr-2 text-primary" />
          Warehouse Selection
        </CardTitle>
        <CardDescription>
          Select the warehouse where your products will be received
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {warehousesLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <div className="text-sm text-muted-foreground">
              Loading warehouses...
            </div>
          </div>
        ) : warehouses && warehouses.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {warehouses.data.map((warehouse: any) => (
              <div
                key={warehouse.warehouse_id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                  watchedWarehouseId === warehouse.warehouse_id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => {
                  setValue(
                    `shipments.${index}.warehouseId`,
                    warehouse.warehouse_id,
                    {
                      shouldValidate: true,
                    }
                  );
                }}
              >
                {/* Radio button indicator */}
                <div className="absolute top-3 right-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      watchedWarehouseId === warehouse.warehouse_id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {watchedWarehouseId === warehouse.warehouse_id && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                </div>

                {/* Header with warehouse name and country */}
                <div className="pb-3 border-b border-border mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <CountryFlag
                      countryCode={getCountryCode(warehouse.country)}
                      size="md"
                    />
                    <div className="flex-1 pr-6">
                      <h3 className="font-semibold text-sm">
                        {warehouse.name || "Unnamed Warehouse"}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Information rows with icons */}
                <div className="space-y-2 text-xs">
                  {/* User Name */}
                  <div className="flex items-start gap-2">
                    <User2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Name:</p>
                      <p className="text-xs font-medium text-foreground break-words">
                        {warehouses?.userFirstName}{" "}
                        {warehouses?.userLastName}{" "}
                        {`${warehouse.country_code}${warehouses.userWarehouseId}`}
                      </p>
                    </div>
                  </div>

                  {/* Address Line 1 */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Address:
                      </p>
                      <p className="text-xs font-medium text-foreground break-words">
                        {warehouse.address_line1}
                      </p>
                    </div>
                  </div>

                  {/* Address Line 2 */}
                  {warehouse.address_line2 && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground break-words">
                          {warehouse.address_line2}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* City */}
                  {warehouse.address_line3 && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          City:
                        </p>
                        <p className="text-xs font-medium text-foreground">
                          {warehouse.address_line3}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Zip Code */}
                  <div className="flex items-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Zip Code:
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {warehouse.postal_code}
                      </p>
                    </div>
                  </div>

                  {/* Country */}
                  <div className="flex items-start gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        Country:
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {warehouse.country}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">
              No warehouses available
            </div>
          </div>
        )}
        <ErrorMessage error={errors.shipments?.[index]?.warehouseId} />
      </CardContent>
    </Card>
  );
}

