/**
 * Utility functions for shipment-related components
 */

import { sortedCountries } from "@/lib/countries";
import { DROP_AND_SHIP_ADD_ON_LABELS } from "./constants";
import type { Shipment, TrackingEvent } from "./types";

/**
 * Statuses omitted from customer-facing tracking UI (timeline rows and headline
 * status). Data and APIs are unchanged; this is display-only.
 */
const HIDDEN_TRACKING_STATUS_SET = new Set<string>([
  "Accepted",
  "Price Ready",
  "Product Price Ready",
  "Invoice Generated",
  "Product Invoice Generated",
  "Ready to Ship",
]);

export function isHiddenTrackingStatus(status: string): boolean {
  return HIDDEN_TRACKING_STATUS_SET.has(status);
}

export function filterVisibleTrackingEvents<T extends { status: string }>(
  events: T[],
): T[] {
  return events.filter((e) => !isHiddenTrackingStatus(e.status));
}

type ShipmentDisplayStatusInput = Pick<
  Shipment,
  | "current_status"
  | "current_status_updated_at"
  | "created_at"
  | "status_timeline"
>;

/**
 * Timeline entries newest-first (same sort as existing tracking UIs).
 */
export function getSortedShipmentTimelineDesc(
  status_timeline: Shipment["status_timeline"] | null | undefined,
): TrackingEvent[] {
  if (!status_timeline) return [];
  const raw =
    typeof status_timeline === "string"
      ? JSON.parse(status_timeline)
      : status_timeline;
  if (!Array.isArray(raw)) return [];
  return [...raw].sort(
    (a: TrackingEvent, b: TrackingEvent) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

/**
 * When the real current status is hidden in the UI, show the latest visible
 * status from the timeline; otherwise show the real current status.
 */
export function getDisplayShipmentStatus(
  shipment: ShipmentDisplayStatusInput,
): { status: string; updatedAt: string | undefined } {
  const timeline = getSortedShipmentTimelineDesc(shipment.status_timeline);

  if (!isHiddenTrackingStatus(shipment.current_status)) {
    return {
      status: shipment.current_status,
      updatedAt: shipment.current_status_updated_at || shipment.created_at,
    };
  }

  for (const event of timeline) {
    if (!isHiddenTrackingStatus(event.status)) {
      return { status: event.status, updatedAt: event.updated_at };
    }
  }

  return {
    status: "Pending",
    updatedAt: shipment.created_at,
  };
}

/**
 * Formats an address for label printing
 */
export const formatAddressForLabel = (s: Shipment): string[] => {
  const parts = [];
  if (s.receiver_address_line1) parts.push(s.receiver_address_line1);
  if (s.receiver_address_line2) parts.push(s.receiver_address_line2);
  if (s.receiver_address_line3) parts.push(s.receiver_address_line3);
  if (s.receiver_address_line4) parts.push(s.receiver_address_line4);

  sortedCountries.filter((country) => {
    if (country.code.toUpperCase() === s.shipment_country_code?.toUpperCase()) {
      parts.push(country.name);
    }
  });

  return parts.length > 0 ? parts : ["Unknown location"];
};

/**
 * Formats a date string to a readable format
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

/**
 * Formats a currency value to Indian Rupee format
 */
export const formatCurrency = (value: number | null | undefined): string => {
  const numericValue = Number(value) || 0;
  return `₹${numericValue.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Gets the color code for a shipment status (matches StatusBadge colors)
 */
export const getStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    // Initial & Processing States
    Pending: "#fbbf24", // amber-500
    Assigned: "#3b82f6", // blue-500
    Received: "#06b6d4", // cyan-500
    "Pick Up": "#8b5cf6", // violet-500
    // Acceptance & Pricing States
    Accepted: "#10b981", // emerald-500
    "Pricing Pending": "#14b8a6", // teal-500
    "Price Ready": "#6366f1", // indigo-500
    "Product Price Ready": "#78716c", // stone-500
    // Payment States
    "Invoice Generated": "#a855f7", // purple-500
    "Product Invoice Generated": "#d946ef", // fuchsia-500
    "Payment Requested": "#f97316", // orange-500
    "Product Payment Requested": "#f43f5e", // rose-500
    Paid: "#22c55e", // green-500
    "Product Paid": "#84cc16", // lime-500
    // Product & Warehouse States
    Purchased: "#ec4899", // pink-500
    "Received at Warehouse": "#06b6d4", // cyan-500
    "Processing to Dispatch": "#fbbf24", // amber-500
    // Shipping States
    "Ready to Ship": "#0ea5e9", // sky-500
    Departure: "#3b82f6", // blue-500
    Departed: "#475569", // slate-600
    "In Transit": "#eab308", // yellow-500
    Delivered: "#22c55e", // green-500
    // Negative States
    Cancelled: "#ef4444", // red-500
    Canceled: "#ef4444", // red-500
    Rejected: "#ef4444", // red-500
    Failed: "#ef4444", // red-500
    // UPS Tracking States
    "Out for Delivery": "#eab308", // yellow-500
    "On the Way": "#3b82f6", // blue-500
    "We Have Your Package": "#06b6d4", // cyan-500
    "Label Created": "#6b7280", // gray-500
    // Additional statuses
    "Picked Up": "#8b5cf6", // violet-500
    "Invoice Ready": "#a855f7", // purple-500
    Ready: "#0ea5e9", // sky-500
  };

  return (
    statusColorMap[status] || "#9ca3af" // gray-400 (default)
  );
};

/**
 * Formats add-on label from ID
 */
export const formatAddOnLabel = (id: string): string => {
  if (DROP_AND_SHIP_ADD_ON_LABELS[id]) {
    return DROP_AND_SHIP_ADD_ON_LABELS[id];
  }

  return id
    .split("-")
    .map((segment) =>
      segment.length > 0
        ? segment[0].toUpperCase() + segment.slice(1).toLowerCase()
        : segment
    )
    .join(" ");
};
