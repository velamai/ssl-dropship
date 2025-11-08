// Shipping rates and exchange rates configuration for product price calculator
// All rates are specific to Sri Lanka (LKR) as destination

export type OriginCountry = "india" | "malaysia" | "dubai" | "us";

export type ProductCategory = "clothes" | "laptop" | "watch" | "medicine" | "electronics" | "others";

// Exchange rates: 1 origin currency = X LKR
export const EXCHANGE_RATES: Record<OriginCountry, number> = {
  india: 3.65, // 1 INR = 3.65 LKR
  malaysia: 80, // 1 MYR = 80 LKR
  dubai: 90, // 1 AED = 90 LKR
  us: 302.0, // 1 USD = 302.0 LKR (example rate, adjust as needed)
};

// Fixed domestic charges (courier + warehouse handling)
export const DOMESTIC_CHARGES: Record<OriginCountry, { currency: string; courier: number; handlingPercent: number }> = {
  india: {
    currency: "INR",
    courier: 40,
    handlingPercent: 10, // 10% of courier charge
  },
  malaysia: {
    currency: "MYR",
    courier: 15,
    handlingPercent: 10,
  },
  dubai: {
    currency: "AED",
    courier: 15,
    handlingPercent: 10,
  },
  us: {
    currency: "USD",
    courier: 40, // Same as India rates
    handlingPercent: 10,
  },
};

// Get domestic courier charge
export function getDomesticCourier(originCountry: OriginCountry): number {
  return DOMESTIC_CHARGES[originCountry].courier;
}

// Get domestic handling charge
export function getDomesticHandling(originCountry: OriginCountry): number {
  const charges = DOMESTIC_CHARGES[originCountry];
  return (charges.courier * charges.handlingPercent) / 100;
}

// Calculate total fixed domestic charges
export function getFixedDomesticCharges(originCountry: OriginCountry): number {
  return getDomesticCourier(originCountry) + getDomesticHandling(originCountry);
}

// International shipping rates per kg (in LKR)
// India rates vary by category
export const SHIPPING_RATES: Record<OriginCountry, Record<ProductCategory | "default", number>> = {
  india: {
    clothes: 4000, // LKR per kg for Clothes (Above 5 Kg)
    others: 5500, // LKR per kg for Others
    medicine: 12000, // LKR per kg for Medicine
    laptop: 5500, // Default to Others rate
    watch: 5500, // Default to Others rate
    electronics: 5500, // Default to Others rate
    default: 5500, // Default rate for Others category
  },
  malaysia: {
    default: 5900, // LKR per kg
    clothes: 5900,
    laptop: 5900,
    watch: 5900,
    medicine: 5900,
    electronics: 5900,
    others: 5900,
  },
  dubai: {
    default: 4900, // LKR per kg
    clothes: 4900,
    laptop: 4900,
    watch: 4900,
    medicine: 4900,
    electronics: 4900,
    others: 4900,
  },
  us: {
    clothes: 4000, // Same as India rates - LKR per kg for Clothes (Above 5 Kg)
    others: 5500, // Same as India rates - LKR per kg for Others
    medicine: 12000, // Same as India rates - LKR per kg for Medicine
    laptop: 5500, // Default to Others rate
    watch: 5500, // Default to Others rate
    electronics: 5500, // Default to Others rate
    default: 5500, // Default rate for Others category
  },
};

// Get shipping rate for a specific origin country and category
export function getShippingRate(originCountry: OriginCountry, category: ProductCategory): number {
  const rates = SHIPPING_RATES[originCountry];
  return rates[category] || rates.default || rates.others;
}

// Colombo Mail Service Charge percentage (15% of converted fixed domestic charges)
export const COLOMBO_SERVICE_CHARGE_PERCENT = 15;

// Get currency code for origin country
export function getCurrencyCode(originCountry: OriginCountry): string {
  return DOMESTIC_CHARGES[originCountry].currency;
}

// Domestic shipping in destination country (Sri Lanka) - Fixed charge
// TODO: Replace with actual rate when available
export const DOMESTIC_SHIPPING_DESTINATION = 500; // LKR

// Get domestic shipping charge in destination country
export function getDomesticShippingDestination(): number {
  return DOMESTIC_SHIPPING_DESTINATION;
}

