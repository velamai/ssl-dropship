/**
 * StatusBadge component for displaying shipment status
 */

import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  // Map status values to appropriate badge variants
  const getStatusConfig = (status: string) => {
    const statusMap = {
      Pending: { label: "Pending", variant: "outline" },
      Received: { label: "Received", variant: "default" },
      "Picked Up": { label: "Picked Up", variant: "default" },
      Accepted: { label: "Accepted", variant: "default" },
      "Invoice Ready": { label: "Invoice Ready", variant: "default" },
      "Payment Requested": { label: "Payment Requested", variant: "outline" },
      Paid: { label: "Paid", variant: "success" },
      Ready: { label: "Ready", variant: "default" },
      Departure: { label: "Departure", variant: "default" },
      Canceled: { label: "Canceled", variant: "destructive" },
      Rejected: { label: "Rejected", variant: "destructive" },
    };

    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        variant: "outline",
      }
    );
  };

  const { label, variant } = getStatusConfig(status);

  if (variant === "success") {
    return (
      <Badge className="bg-success hover:bg-success/90 text-white">
        {label}
      </Badge>
    );
  }

  return (
    <Badge
      variant={variant as "default" | "secondary" | "destructive" | "outline"}
    >
      {label}
    </Badge>
  );
}

