/**
 * OrderDetailsCard component for displaying shipment order details
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";
import { formatDate } from "./utils";
import type { Shipment } from "./types";

interface OrderDetailsCardProps {
  shipment: Shipment;
}

export function OrderDetailsCard({ shipment }: OrderDetailsCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          Order Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Tracking #
            </h3>
            <p className="font-medium text-sm">{shipment.system_tracking_id}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Created Date
            </h3>
            <p className="text-sm">{formatDate(shipment.created_at)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Service Type
            </h3>
            <p className="text-sm capitalize">
              {shipment.shipment_type || "Standard"}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Expected Receiving Date
            </h3>
            <p className="text-sm">
              {formatDate(shipment.drop_and_ship_expected_receiving_date)}
            </p>
          </div>
        </div>

        <Separator className="my-2" />

        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Receiving Address
          </h3>
          <div className="space-y-1 text-sm">
            <p>{shipment.receiver_address_line1 || "No address specified"}</p>
            {shipment.receiver_address_line2 && (
              <p>{shipment.receiver_address_line2}</p>
            )}
            {shipment.receiver_address_line3 && (
              <p>{shipment.receiver_address_line3}</p>
            )}
            {shipment.receiver_address_line4 && (
              <p>{shipment.receiver_address_line4}</p>
            )}
            <p>
              {shipment.receiver_postal_code},{" "}
              {shipment.shipment_country_code?.toUpperCase()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
