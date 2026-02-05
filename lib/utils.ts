import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get country code from country name (ISO 3166-1 alpha-2)
export const getCountryCode = (countryName: string): string => {
  const countryMap: Record<string, string> = {
    "United States": "US",
    Canada: "CA",
    "United Kingdom - UK": "GB",
    "United Kingdom": "GB",
    Australia: "AU",
    "Sri Lanka": "LK",
    India: "IN",
    Singapore: "SG",
    Malaysia: "MY",
    China: "CN",
    Japan: "JP",
    "United Arab Emirates - UAE": "AE",
    "United Arab Emirates": "AE",
    UAE: "AE",
    Dubai: "AE",
  }

  return countryMap[countryName] || (countryName?.length === 2 ? countryName.toUpperCase() : "")
}

