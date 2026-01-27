/**
 * Type for shipment with currency fields
 * This is a minimal type that only requires the currency-related fields
 */
export type ShipmentWithCurrency = {
  source_currency_code?: string | null;
  exchange_rate_source_to_inr?: number | null;
};

/**
 * Convert INR price to source currency
 * Formula: source_currency_price = inr_price * exchange_rate_source_to_inr
 * 
 * @param inrPrice - Price in INR (can be string or number)
 * @param shipment - Shipment object containing currency fields
 * @returns Object with converted price and currency code
 */
export function convertToSourceCurrency(
  inrPrice: number | string,
  shipment: ShipmentWithCurrency
): { price: number; currency: string } {
  const priceInInr = typeof inrPrice === "string" ? Number(inrPrice) : inrPrice;
  const exchangeRate = shipment.exchange_rate_source_to_inr ?? 1;
  const currencyCode = shipment.source_currency_code ?? "INR";
  
  // Convert: source_currency_price = inr_price * exchange_rate_source_to_inr
  const priceInSourceCurrency = priceInInr * exchangeRate;
  
  return {
    price: priceInSourceCurrency,
    currency: currencyCode,
  };
}

/**
 * Format price with currency symbol
 * 
 * @param inrPrice - Price in INR (can be string or number)
 * @param shipment - Shipment object containing currency fields
 * @returns Formatted string like "USD 100.00" or "INR 100.00"
 */
export function formatPrice(
  inrPrice: number | string,
  shipment: ShipmentWithCurrency
): string {
  const { price, currency } = convertToSourceCurrency(inrPrice, shipment);
  return `${currency} ${price.toFixed(2)}`;
}

/**
 * Get only the converted price number (without currency code)
 * 
 * @param inrPrice - Price in INR (can be string or number)
 * @param shipment - Shipment object containing currency fields
 * @returns Converted price as number
 */
export function getConvertedPrice(
  inrPrice: number | string,
  shipment: ShipmentWithCurrency
): number {
  const { price } = convertToSourceCurrency(inrPrice, shipment);
  return price;
}

/**
 * Get currency code for a shipment
 * 
 * @param shipment - Shipment object containing currency fields
 * @returns Currency code (defaults to "INR")
 */
export function getCurrencyCode(shipment: ShipmentWithCurrency): string {
  return shipment.source_currency_code ?? "INR";
}
