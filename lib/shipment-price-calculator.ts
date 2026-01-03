// Shipment price calculator - calculates price breakdown without shipping rates
// Used in create shipment page to show: Item Price, Domestic Courier, Warehouse Handling, Total (before shipping)

import type { OriginCountry } from "./shipping-rates";
import {
  getExchangeRate,
  getDomesticCourier,
  calculateWarehouseHandling,
  getCurrencyCode,
  getOriginCountryFromCode,
} from "./shipping-rates";

export interface ShipmentItem {
  price: number; // in origin currency
  quantity: number;
  valueCurrency?: string; // currency of the price
}

export interface ShipmentPriceCalculationInput {
  items: ShipmentItem[];
  sourceCountryCode: string; // ISO country code (e.g., "IN", "MY", "AE")
  destinationCountryCode: string; // ISO country code (e.g., "LK", "IN", "MY", "AE")
}

export interface ShipmentPriceBreakdown {
  // Item details
  itemPriceOrigin: number; // Total item price in origin currency
  itemPriceDestination: number; // Total item price converted to destination currency

  // Charges (in origin currency)
  domesticCourier: number; // Domestic Courier Charge
  warehouseHandling: number; // Warehouse Handling = (Item Price + Domestic Courier) × percentage

  // Total (in origin currency)
  totalPriceOrigin: number; // Item Price + Domestic Courier + Warehouse Handling

  // Total (in destination currency)
  totalPriceDestination: number;

  // Exchange rate and currencies
  exchangeRate: number;
  originCurrency: string;
  destinationCurrency: string;
}

/**
 * Calculate price breakdown for shipment items (without shipping rates)
 * Formula:
 * 1. Item Price (Origin Currency) = Sum of (item.price × item.quantity) for all items
 * 2. Domestic Courier Charge (Origin Currency) = from database
 * 3. Warehouse Handling (Origin Currency) = (Item Price + Domestic Courier) × percentage
 * 4. Total Price (Origin Currency) = Item Price + Domestic Courier + Warehouse Handling
 * 5. Convert to destination currency using exchange rate
 */
export async function calculateShipmentPriceBreakdown(
  input: ShipmentPriceCalculationInput
): Promise<ShipmentPriceBreakdown | null> {
  const { items, sourceCountryCode, destinationCountryCode } = input;

  // Validate inputs
  if (!items || items.length === 0) {
    return null;
  }

  if (!sourceCountryCode || !destinationCountryCode) {
    return null;
  }

  // Get origin country from country code
  const originCountry = getOriginCountryFromCode(sourceCountryCode);
  if (!originCountry) {
    console.error(`Invalid source country code: ${sourceCountryCode}`);
    return null;
  }

  // Get exchange rate from database
  const exchangeRate = await getExchangeRate(originCountry, destinationCountryCode);
  const originCurrency = await getCurrencyCode(originCountry);

  // Get destination currency code
  const { productPriceCalculatorApi } = await import("./api/product-price-calculator");
  const destinationCurrencyCode =
    (await productPriceCalculatorApi.getCurrencyCode(destinationCountryCode)) || "LKR";
  const destinationCurrency = destinationCurrencyCode;

  // 1. Calculate total item price (in origin currency)
  // Note: Items may have different currencies, but we'll sum them as-is
  // In a real scenario, you might want to convert all to origin currency first
  const itemPriceOrigin = items.reduce((sum, item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    return sum + itemTotal;
  }, 0);

  // 2. Get domestic courier charge (in origin currency)
  const domesticCourier = await getDomesticCourier(originCountry);

  // 3. Calculate warehouse handling (in origin currency)
  const warehouseHandling = await calculateWarehouseHandling(
    originCountry,
    itemPriceOrigin + domesticCourier
  );

  // 4. Calculate total price (in origin currency)
  const totalPriceOrigin = itemPriceOrigin + domesticCourier + warehouseHandling;

  // 5. Convert to destination currency
  const itemPriceDestination = itemPriceOrigin * exchangeRate;
  const totalPriceDestination = totalPriceOrigin * exchangeRate;

  return {
    itemPriceOrigin,
    itemPriceDestination,
    domesticCourier,
    warehouseHandling,
    totalPriceOrigin,
    totalPriceDestination,
    exchangeRate,
    originCurrency,
    destinationCurrency,
  };
}

