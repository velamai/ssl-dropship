/**
 * ReceiverInfoCard component for displaying receiver information
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";
import type { Shipment } from "./types";

interface ReceiverInfoCardProps {
  shipment: Shipment;
}

export function ReceiverInfoCard({ shipment }: ReceiverInfoCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-5 w-5 text-primary" />
          Receiver Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              First Name
            </h3>
            <p className="text-sm">
              {shipment.receiver_first_name || "N/A"}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Last Name
            </h3>
            <p className="text-sm">{shipment.receiver_last_name || "N/A"}</p>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium text-muted-foreground">
            Phone Number
          </h3>
          <p className="text-sm">
            +{shipment.receiver_phone_code || ""} {shipment.receiver_phone}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-medium text-muted-foreground">Email</h3>
          <p className="text-sm">{shipment.receiver_email || "N/A"}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              Company
            </h3>
            <p className="text-sm">{shipment.receiver_company || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">
              VAT/TAX
            </h3>
            <p className="text-sm">{shipment.receiver_tax || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

