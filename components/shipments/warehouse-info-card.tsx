/**
 * WarehouseInfoCard component for displaying warehouse information
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Truck } from "lucide-react";
import type { Shipment } from "./types";

interface WarehouseInfoCardProps {
  shipment: Shipment;
}

export function WarehouseInfoCard({ shipment }: WarehouseInfoCardProps) {
  if (!shipment.drop_and_ship_warehouse_address) {
    return null;
  }

  const warehouse = shipment.drop_and_ship_warehouse_address;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-5 w-5 text-primary" />
          Warehouse Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground">
            Warehouse Name
          </h3>
          <p className="text-sm font-medium">{warehouse.name || "N/A"}</p>
        </div>
        <div>
          <h3 className="text-xs font-medium text-muted-foreground">
            Address
          </h3>
          <div className="space-y-1 mt-1">
            <p className="text-sm">{warehouse.address_line1} ,</p>
            {warehouse.address_line2 && (
              <p className="text-sm">{warehouse.address_line2}</p>
            )}
            <p className="text-sm">
              {warehouse.address_line3 && (
                <>{warehouse.address_line3}</>
              )}
              {warehouse.address_line4 && (
                <> , {warehouse.address_line4}</>
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Country
            </h3>
            <p className="text-sm font-medium">{warehouse.country || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Postal Code
            </h3>
            <p className="text-sm font-medium">
              {warehouse.postal_code || "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

