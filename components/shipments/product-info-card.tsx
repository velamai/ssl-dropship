/**
 * ProductInfoCard component for displaying product information
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { DROP_AND_SHIP_ADD_ON_PRICE } from "./constants";
import { formatAddOnLabel, formatCurrency, formatDate } from "./utils";
import type { Shipment, ShipmentItem } from "./types";

interface ProductInfoCardProps {
  shipment: Shipment;
  items: ShipmentItem[];
}

export function ProductInfoCard({ shipment, items }: ProductInfoCardProps) {
  const addOnSelections = Array.isArray(shipment.drop_and_ship_add_ons)
    ? shipment.drop_and_ship_add_ons
    : [];
  const addOnsTotal = addOnSelections.length * DROP_AND_SHIP_ADD_ON_PRICE;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {items.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground">
                  Items
                </h3>
                <div className="flex items-center gap-1">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {items.length}
                  </span>
                  <span className="text-sm">items</span>
                </div>
              </div>
              {shipment.drop_and_ship_purchase_date && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Purchased Date
                  </h3>
                  <p className="text-sm">
                    {formatDate(shipment.drop_and_ship_purchase_date)}
                  </p>
                </div>
              )}
              {shipment.drop_and_ship_purchase_site && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Purchased Site
                  </h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm">
                          {shipment.drop_and_ship_purchase_site.slice(0, 15) +
                            "..."}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{shipment.drop_and_ship_purchase_site}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-medium text-muted-foreground py-2">
                      Name
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2">
                      Price
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2">
                      Quantity
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground py-2">
                      Total Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.shipment_item_id || index}
                      className="border-b last:border-b-0"
                    >
                      <td className="text-sm py-2">
                        {item.name && item.name.length > 25 ? (
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <Link
                                  href={item.drop_and_ship_product_url || ""}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {item.name.substring(0, 25)}...
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{item.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Link
                            href={item.drop_and_ship_product_url || ""}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.name}
                          </Link>
                        )}
                      </td>
                      <td className="text-sm text-right py-2">
                        ₹{item.declared_value || 0}
                      </td>
                      <td className="text-sm text-right py-2">
                        {item.quantity || 1}
                      </td>
                      <td className="text-sm font-medium text-right py-2">
                        ₹
                        {(
                          (Number(item.declared_value) || 0) *
                          (item.quantity || 1)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No items found for this shipment.
          </p>
        )}

        {addOnSelections.length > 0 && (
          <div className="space-y-3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Add-ons
              </h3>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(DROP_AND_SHIP_ADD_ON_PRICE)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {addOnSelections.map((addon) => (
                <Badge
                  key={addon}
                  variant="outline"
                  className="gap-2 rounded-full px-3 py-1 text-xs font-medium"
                >
                  <span>{formatAddOnLabel(addon)}</span>
                  <span className="text-muted-foreground">
                    +{formatCurrency(DROP_AND_SHIP_ADD_ON_PRICE)}
                  </span>
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total add-on charges</span>
              <span>{formatCurrency(addOnsTotal)}</span>
            </div>
          </div>
        )}

        {shipment.drop_and_ship_note && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Special Instructions
            </h3>
            <p className="text-sm">{shipment.drop_and_ship_note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
