"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ShipmentSummaryProps {
  index: number;
  title: string;
  countryName: string;
  // weight: string;
  courierName: string;
  price: string;
  isTransportable: boolean;
  onRemove: () => void;
  isDefault?: boolean;
  itemCount?: number;
}

export function ShipmentSummary({
  index,
  title,
  countryName,
  // weight,
  courierName,
  price,
  isTransportable,
  onRemove,
  isDefault = false,
  itemCount = 0,
}: ShipmentSummaryProps) {
  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {index + 1}
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium text-lg text-left">{title}</span>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center">
              <span className="font-medium mr-1">Country:</span>
              <span>{countryName || "Select Country"}</span>
            </div>
            {/* {weight && (
              <div className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center">
                <span className="font-medium mr-1">Weight:</span> {weight} g
              </div>
            )} */}
            <div className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center">
              <span className="font-medium mr-1">Courier:</span>
              <span>{courierName || "Select Courier"}</span>
            </div>
            <div className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center">
              <span className="font-medium mr-1">Items:</span>
              <span>{itemCount}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <span className="font-medium text-primary">₹{price}</span>
        {!isTransportable && (
          <div className="text-red-500 text-xs ml-2">
            Cannot ship with current parameters
          </div>
        )}
        {!isDefault && (
          <div
            role="button"
            className="h-8 w-8 p-0 mr-2 inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </div>
        )}
      </div>
    </div>
  );
}
