/**
 * TrackingHistoryCard component for displaying shipment tracking history
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { getStatusColor } from "./utils";
import type { Shipment, TrackingEvent } from "./types";

interface TrackingHistoryCardProps {
  shipment: Shipment;
}

export function TrackingHistoryCard({ shipment }: TrackingHistoryCardProps) {
  // Parse tracking history if available
  const trackingHistory = shipment.status_timeline
    ? typeof shipment.status_timeline === "string"
      ? JSON.parse(shipment.status_timeline)
      : shipment.status_timeline
    : [];

  return (
    <Card className="transition-all hover:shadow-md h-full">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-primary" />
          Tracking History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {trackingHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mb-3 text-gray-400" />
            <p className="font-medium mb-1">No Tracking History Yet</p>
            <p className="text-sm">
              {shipment.current_status === "Payment Requested"
                ? "Awaiting payment confirmation."
                : shipment.current_status === "Pick Up"
                ? "Waiting for pickup."
                : shipment.current_status === "Pending"
                ? "Shipment is being processed."
                : "Check back later for updates."}
            </p>
          </div>
        ) : (
          <div className="relative space-y-6 pl-6 border-l border-border">
            {trackingHistory.map((history: TrackingEvent, index: number) => (
              <div key={index} className="relative">
                <div className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: getStatusColor(history.status),
                    }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <StatusBadge status={history.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(history.updated_at).toLocaleDateString()} at{" "}
                    {new Date(history.updated_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {history.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

