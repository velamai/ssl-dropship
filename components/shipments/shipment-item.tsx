"use client";

import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { ChevronDown, Trash2 } from "lucide-react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

interface ShipmentItemProps {
  shipmentIndex: number;
  itemIndex: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  showDeleteButton?: boolean;
}

export function ShipmentItem({
  shipmentIndex,
  itemIndex,
  control,
  register,
  errors,
  watch,
  setValue,
  isExpanded,
  onToggleExpand,
  onDelete,
  showDeleteButton = true,
}: ShipmentItemProps) {
  const itemProductUrl = watch(
    `shipments.${shipmentIndex}.items.${itemIndex}.productUrl`
  );
  const itemProductName = watch(
    `shipments.${shipmentIndex}.items.${itemIndex}.productName`
  );

  return (
    <div className="rounded border overflow-hidden">
      <div
        className="flex justify-between items-center p-3 cursor-pointer bg-muted/20 hover:bg-muted/30"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Product #{itemIndex + 1}</span>
          {!isExpanded && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {itemProductName || itemProductUrl || "No product name"}
            </span>
          )}
        </div>
        <div className="flex items-center">
          {showDeleteButton && (
            <div
              role="button"
              className="h-6 w-6 p-0 mr-1 inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <div
            className="h-4 w-4 transition-transform duration-200"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.productName`}
              >
                Product Name *
              </Label>
              <Input
                id={`shipments.${shipmentIndex}.items.${itemIndex}.productName`}
                {...register(
                  `shipments.${shipmentIndex}.items.${itemIndex}.productName`
                )}
                placeholder="Enter product name"
              />
              <ErrorMessage
                error={
                  errors.shipments?.[shipmentIndex]?.items?.[itemIndex]
                    ?.productName
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.productUrl`}
              >
                Product URL *
              </Label>
              <Input
                id={`shipments.${shipmentIndex}.items.${itemIndex}.productUrl`}
                {...register(
                  `shipments.${shipmentIndex}.items.${itemIndex}.productUrl`
                )}
                type="url"
                placeholder="https://example.com/product"
              />
              <ErrorMessage
                error={
                  errors.shipments?.[shipmentIndex]?.items?.[itemIndex]
                    ?.productUrl
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.price`}
              >
                Price *
              </Label>
              <Input
                id={`shipments.${shipmentIndex}.items.${itemIndex}.price`}
                {...register(
                  `shipments.${shipmentIndex}.items.${itemIndex}.price`
                )}
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <ErrorMessage
                error={
                  errors.shipments?.[shipmentIndex]?.items?.[itemIndex]?.price
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.quantity`}
              >
                Quantity *
              </Label>
              <Input
                id={`shipments.${shipmentIndex}.items.${itemIndex}.quantity`}
                {...register(
                  `shipments.${shipmentIndex}.items.${itemIndex}.quantity`
                )}
                type="number"
                placeholder="1"
                min="1"
                step="1"
              />
              <ErrorMessage
                error={
                  errors.shipments?.[shipmentIndex]?.items?.[itemIndex]
                    ?.quantity
                }
              />
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <Label
              htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.productNote`}
            >
              Product Note
            </Label>
            <Textarea
              id={`shipments.${shipmentIndex}.items.${itemIndex}.productNote`}
              {...register(
                `shipments.${shipmentIndex}.items.${itemIndex}.productNote`
              )}
              placeholder="Enter any additional notes about this product"
              rows={3}
            />
            <ErrorMessage
              error={
                errors.shipments?.[shipmentIndex]?.items?.[itemIndex]
                  ?.productNote
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
