// Shipping rates and exchange rates configuration for product price calculator
// Now fetches data from database instead of hardcoded values

import { productPriceCalculatorApi } from "./api/product-price-calculator";

export type OriginCountry = "india" | "malaysia" | "dubai" | "us" | "srilanka" | "singapore";

export type ProductCategory = "clothes" | "laptop" | "watch" | "medicine" | "electronics" | "others";

// Map OriginCountry to country codes
const ORIGIN_COUNTRY_TO_CODE: Record<OriginCountry, string> = {
  india: "IN",
  malaysia: "MY",
  dubai: "AE",
  us: "US",
  srilanka: "LK",
  singapore: "SG",
};

// Map country codes to OriginCountry
const CODE_TO_ORIGIN_COUNTRY: Record<string, OriginCountry> = {
  IN: "india",
  MY: "malaysia",
  AE: "dubai",
  US: "us",
  LK: "srilanka",
  SG: "singapore",
};

// Get OriginCountry from country code
export function getOriginCountryFromCode(countryCode: string): OriginCountry | null {
  return CODE_TO_ORIGIN_COUNTRY[countryCode] || null;
}

// Legacy hardcoded values for fallback (will be removed after migration)
const EXCHANGE_RATES_FALLBACK: Record<OriginCountry, number> = {
  india: 3.65,
  malaysia: 80,
  dubai: 90,
  us: 302.0,
  srilanka: 1.0,
  singapore: 250.0,
};

const DOMESTIC_CHARGES_FALLBACK: Record<OriginCountry, { currency: string; courierPercent: number; handlingPercent: number }> = {
  india: { currency: "INR", courierPercent: 5, handlingPercent: 10 },
  malaysia: { currency: "MYR", courierPercent: 5, handlingPercent: 10 },
  dubai: { currency: "AED", courierPercent: 5, handlingPercent: 10 },
  us: { currency: "USD", courierPercent: 5, handlingPercent: 10 },
  srilanka: { currency: "LKR", courierPercent: 5, handlingPercent: 10 },
  singapore: { currency: "SGD", courierPercent: 5, handlingPercent: 10 },
};

const SHIPPING_RATES_FALLBACK: Record<OriginCountry, Record<ProductCategory | "default", number>> = {
  india: { clothes: 4000, others: 5500, medicine: 12000, laptop: 5500, watch: 5500, electronics: 5500, default: 5500 },
  malaysia: { default: 5900, clothes: 5900, laptop: 5900, watch: 5900, medicine: 5900, electronics: 5900, others: 5900 },
  dubai: { default: 4900, clothes: 4900, laptop: 4900, watch: 4900, medicine: 4900, electronics: 4900, others: 4900 },
  us: { clothes: 4000, others: 5500, medicine: 12000, laptop: 5500, watch: 5500, electronics: 5500, default: 5500 },
  srilanka: { default: 0, clothes: 0, laptop: 0, watch: 0, medicine: 0, electronics: 0, others: 0 },
  singapore: { default: 6000, clothes: 6000, laptop: 6000, watch: 6000, medicine: 6000, electronics: 6000, others: 6000 },
};

// Get country code from OriginCountry
export function getCountryCode(originCountry: OriginCountry): string {
  return ORIGIN_COUNTRY_TO_CODE[originCountry];
}

// Get exchange rate from database
export async function getExchangeRate(
  originCountry: OriginCountry,
  destinationCountryCode: string = "LK"
): Promise<number> {
  const originCountryCode = getCountryCode(originCountry);
  const originCurrency = await productPriceCalculatorApi.getCurrencyCode(originCountryCode);
  const destinationCurrency = await productPriceCalculatorApi.getCurrencyCode(destinationCountryCode);

  if (!originCurrency || !destinationCurrency) {
    console.warn(`Currency not found, using fallback for ${originCountry}`);
    return EXCHANGE_RATES_FALLBACK[originCountry];
  }

  const rate = await productPriceCalculatorApi.getExchangeRate(originCurrency, destinationCurrency);
  if (rate === null) {
    console.warn(`Exchange rate not found, using fallback for ${originCountry}`);
    return EXCHANGE_RATES_FALLBACK[originCountry];
  }

  return rate;
}

// Get domestic courier charge from database (now calculates as percentage of item price)
export async function getDomesticCourier(
  originCountry: OriginCountry,
  itemPrice: number
): Promise<number> {
  const originCountryCode = getCountryCode(originCountry);
  const charge = await productPriceCalculatorApi.calculateDomesticCourier(
    originCountryCode,
    itemPrice
  );
  
  if (charge === 0) {
    // Fallback: use percentage from fallback data
    console.warn(`Domestic courier charge not found, using fallback for ${originCountry}`);
    const fallbackPercent = DOMESTIC_CHARGES_FALLBACK[originCountry].courierPercent;
    return (itemPrice * fallbackPercent) / 100;
  }

  return charge;
}

// Get warehouse handling charge from database (now calculates as percentage of item price only)
export async function calculateWarehouseHandling(
  originCountry: OriginCountry,
  itemPrice: number
): Promise<number> {
  const originCountryCode = getCountryCode(originCountry);
  return await productPriceCalculatorApi.calculateWarehouseHandling(originCountryCode, itemPrice);
}

// Get shipping rate from database
export async function getShippingRate(
  originCountry: OriginCountry,
  category: ProductCategory,
  destinationCountryCode: string = "LK"
): Promise<number> {
  const originCountryCode = getCountryCode(originCountry);
  const rate = await productPriceCalculatorApi.getShippingRate(
    originCountryCode,
    destinationCountryCode,
    category
  );

  if (rate === null) {
    console.warn(`Shipping rate not found, using fallback for ${originCountry}, ${category}`);
    const fallbackRates = SHIPPING_RATES_FALLBACK[originCountry];
    return fallbackRates[category] || fallbackRates.default || fallbackRates.others;
  }

  return rate;
}

// Get service charge percentage from database
export async function getServiceChargePercentage(): Promise<number> {
  const percentage = await productPriceCalculatorApi.getServiceChargePercentage();
  return percentage ?? 15; // Default to 15% if not found
}

// Get currency code for origin country from database
export async function getCurrencyCode(originCountry: OriginCountry): Promise<string> {
  const originCountryCode = getCountryCode(originCountry);
  const currency = await productPriceCalculatorApi.getCurrencyCode(originCountryCode);
  
  if (!currency) {
    console.warn(`Currency code not found, using fallback for ${originCountry}`);
    return DOMESTIC_CHARGES_FALLBACK[originCountry].currency;
  }

  return currency;
}

// Get domestic shipping charge in destination country from database
export async function getDomesticShippingDestination(
  destinationCountryCode: string = "LK"
): Promise<number> {
  const charge = await productPriceCalculatorApi.getDomesticShippingDestinationCharge(destinationCountryCode);
  return charge ?? 500; // Default to 500 if not found
}

// Legacy synchronous functions for backward compatibility (deprecated)
// These will be removed after full migration
export const EXCHANGE_RATES = EXCHANGE_RATES_FALLBACK;
export const DOMESTIC_CHARGES = DOMESTIC_CHARGES_FALLBACK;
export const SHIPPING_RATES = SHIPPING_RATES_FALLBACK;
export const COLOMBO_SERVICE_CHARGE_PERCENT = 15;
export const DOMESTIC_SHIPPING_DESTINATION = 500;

