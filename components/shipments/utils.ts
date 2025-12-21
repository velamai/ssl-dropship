/**
 * Utility functions for shipment-related components
 */

import { sortedCountries } from "@/lib/countries";
import { DROP_AND_SHIP_ADD_ON_LABELS } from "./constants";
import type { Shipment } from "./types";

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
 * Gets the color code for a shipment status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Paid":
      return "#10b981"; // green
    case "Pick Up":
    case "Pending":
      return "#3b82f6"; // blue
    case "Delivered":
      return "#10b981"; // green
    case "In Transit":
      return "#f59e0b"; // yellow
    case "Failed":
      return "#ef4444"; // red
    default:
      return "#e5e7eb"; // gray
  }
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
