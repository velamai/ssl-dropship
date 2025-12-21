/**
 * StatusOverviewCard component for displaying current shipment status
 */

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Package } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { formatDate, getStatusColor } from "./utils";
import type { Shipment } from "./types";

interface StatusOverviewCardProps {
  shipment: Shipment;
}

export function StatusOverviewCard({ shipment }: StatusOverviewCardProps) {
  return (
    <Card
      className="border-l-4 mb-6"
      style={{
        borderLeftColor: getStatusColor(shipment.current_status),
      }}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Current Status
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status={shipment.current_status} />
                <span className="text-sm text-muted-foreground">
                  Updated:{" "}
                  {formatDate(
                    shipment.current_status_updated_at || shipment.created_at
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

