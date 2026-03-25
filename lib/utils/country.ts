import type { Country } from "@/lib/api/countries";

/**
 * Utility functions for country code/name conversion
 */

/**
 * Check if a string is a country code (2-letter ISO code)
 */
export function isCountryCode(value: string): boolean {
  if (!value) return false;
  return value.length === 2 && /^[A-Z]{2}$/i.test(value);
}

/**
 * Get country code from name or return code if already a code
 * @param value - Country name or code
 * @param countries - List of countries from the database
 * @returns Country code (uppercase) or empty string if not found
 */
export function getCountryCode(
  value: string,
  countries: Country[]
): string {
  if (!value) return "";

  // If it's already a 2-letter code, return uppercase
  if (isCountryCode(value)) {
    return value.toUpperCase();
  }

  // Search by name (case-insensitive)
  const country = countries.find(
    (c) => c.name.toLowerCase() === value.toLowerCase()
  );

  return country ? country.code.toUpperCase() : "";
}

/**
 * Get country name from code or return name if already a name
 * @param value - Country code or name
 * @param countries - List of countries from the database
 * @returns Country name or original value if not found
 */
export function getCountryName(
  value: string,
  countries: Country[]
): string {
  if (!value) return "";

  // If it's a 2-letter code, search by code
  if (isCountryCode(value)) {
    const country = countries.find(
      (c) => c.code.toUpperCase() === value.toUpperCase()
    );
    return country ? country.name : value;
  }

  // If it's already a name, return it
  const country = countries.find(
    (c) => c.name.toLowerCase() === value.toLowerCase()
  );

  return country ? country.name : value;
}

/**
 * Normalize country value to code (for storage)
 * @param value - Country name or code
 * @param countries - List of countries from the database
 * @returns Normalized country code (uppercase)
 */
export function normalizeCountryToCode(
  value: string,
  countries: Country[]
): string {
  return getCountryCode(value, countries);
}

/**
 * Normalize country value to name (for display)
 * @param value - Country name or code
 * @param countries - List of countries from the database
 * @returns Normalized country name
 */
export function normalizeCountryToName(
  value: string,
  countries: Country[]
): string {
  return getCountryName(value, countries);
}
