"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, ShoppingBag } from "lucide-react";
import { ShipmentItem } from "./shipment-item";
import { useFieldArray } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { ErrorMessage } from "@/components/ui/error-message";
import { v4 as uuidv4 } from "uuid";

interface ItemsManagementTabProps {
  index: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  expandedItems: { [key: string]: string | null };
  toggleItemExpansion: (itemUuid: string) => void;
  onPriceChange?: () => void;
}

export function ItemsManagementTab({
  index,
  control,
  register,
  errors,
  watch,
  setValue,
  expandedItems,
  toggleItemExpansion,
  onPriceChange,
}: ItemsManagementTabProps) {
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `shipments.${index}.items`,
    keyName: "fieldId",
  });

  const handleAddItem = () => {
    const newUuid = uuidv4();
    appendItem({
      uuid: newUuid,
      productUrl: "",
      productName: "",
      productNote: "",
      price: undefined,
      valueCurrency: "INR",
      quantity: undefined,
    });
    // Items are expanded by default, so no need to call toggleItemExpansion
    // Trigger price calculation after adding item
    if (onPriceChange) {
      setTimeout(onPriceChange, 0);
    }
  };

  const handleRemoveItem = (itemIndex: number) => {
    if (itemFields.length > 1) {
      removeItem(itemIndex);
      // Trigger price calculation after removing item
      if (onPriceChange) {
        setTimeout(onPriceChange, 0);
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center">
            <ShoppingBag className="h-4 w-4 mr-2 text-primary" />
            Product Information
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={handleAddItem}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Product
          </Button>
        </div>
        <CardDescription>
          Add or remove products for this shipment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {itemFields.length > 0 ? (
            itemFields.map((itemField, itemIndex) => {
              const itemUuid = watch(
                `shipments.${index}.items.${itemIndex}.uuid`
              );

              const isExpanded = itemUuid
                ? expandedItems[itemUuid] === undefined
                  ? true
                  : expandedItems[itemUuid] === itemUuid
                : false;

              return (
                <ShipmentItem
                  key={itemField.fieldId}
                  shipmentIndex={index}
                  itemIndex={itemIndex}
                  control={control}
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  isExpanded={isExpanded}
                  onToggleExpand={() =>
                    itemUuid && toggleItemExpansion(itemUuid)
                  }
                  onDelete={() => handleRemoveItem(itemIndex)}
                  showDeleteButton={itemFields.length > 1}
                />
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No items added. Click "Add Item" to add your first item.
            </div>
          )}

          <ErrorMessage error={errors.shipments?.[index]?.items} />
        </div>
      </CardContent>
    </Card>
  );
}
