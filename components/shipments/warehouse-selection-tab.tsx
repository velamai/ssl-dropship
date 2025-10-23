"use client";

import { CountryFlag } from "@/components/country-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import { getCountryCode } from "@/lib/utils";
import { Warehouse } from "lucide-react";
import type {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";

interface WarehouseSelectionTabProps {
  index: number;
  control: Control<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  getValues: UseFormGetValues<OrderFormData>;
}

export function WarehouseSelectionTab({
  index,
  control,
  errors,
  watch,
  setValue,
  getValues,
}: WarehouseSelectionTabProps) {
  const watchedWarehouseId = watch(`shipments.${index}.warehouseId`);

  // Fetch warehouses for selection
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Warehouse className="h-4 w-4 mr-2 text-primary" />
          Warehouse Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {warehousesLoading ? (
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading warehouses...
            </div>
          </div>
        ) : warehouses && warehouses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.warehouse_id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
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

                <div className="flex items-start gap-3 pr-6">
                  <CountryFlag
                    countryCode={getCountryCode(warehouse.country)}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">
                      {warehouse.name || "Unnamed Warehouse"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {warehouse.country}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-foreground">
                        {warehouse.address_line1}
                      </p>
                      {warehouse.address_line2 && (
                        <p className="text-xs text-muted-foreground">
                          {warehouse.address_line2}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {warehouse.postal_code}
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
