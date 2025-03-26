import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get country code from country name
export const getCountryCode = (countryName: string): string => {
  const countryMap: Record<string, string> = {
    "United States": "US",
    Canada: "CA",
    "United Kingdom": "GB",
    Australia: "AU",
    "Sri Lanka": "LK",
    India: "IN",
    Singapore: "SG",
    Malaysia: "MY",
    China: "CN",
    Japan: "JP",
    // Add more countries as needed
  }

  return countryMap[countryName] || "LK" // Default to Sri Lanka if not found
}

