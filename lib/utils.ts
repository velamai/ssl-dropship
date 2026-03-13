import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get country code from country name (ISO 3166-1 alpha-2)
export const getCountryCode = (countryName: string): string => {
  if (!countryName) return "";

  // If already a 2-letter code, return it uppercase
  if (countryName.length === 2) {
    return countryName.toUpperCase();
  }

  const countryMap: Record<string, string> = {
    "United States": "US",
    USA: "US",
    Canada: "CA",
    "United Kingdom - UK": "GB",
    "United Kingdom": "GB",
    UK: "GB",
    Australia: "AU",
    "Sri Lanka": "LK",
    India: "IN",
    IN: "IN",
    Singapore: "SG",
    SG: "SG",
    Malaysia: "MY",
    MY: "MY",
    China: "CN",
    CN: "CN",
    Japan: "JP",
    JP: "JP",
    "United Arab Emirates - UAE": "AE",
    "United Arab Emirates": "AE",
    UAE: "AE",
    AE: "AE",
    Dubai: "AE",
  };

  return countryMap[countryName] || countryName.toUpperCase();
};
