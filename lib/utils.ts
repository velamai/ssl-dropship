import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get country code from country name
export const getCountryCode = (countryName: string): string => {

  console.log({countryName});
  const countryMap: Record<string, string> = {
    "United States": "US",
    Canada: "CA",
    "United Kingdom - UK": "UK",
    Australia: "AU",
    "Sri Lanka": "SL",
    India: "IN",
    Singapore: "SG",
    Malaysia: "ML",
    China: "CN",
    Japan: "JP",
    "United Arab Emirates - UAE": "UAE",
  }

  return countryMap[countryName] || "LK" // Default to Sri Lanka if not found
}

