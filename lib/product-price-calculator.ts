// Product price calculator - calculates total costs including shipping, duties, and handling

import type { OriginCountry, ProductCategory } from "./shipping-rates";
import {
  getExchangeRate,
  getDomesticCourier,
  getShippingRate,
  getServiceChargePercentage,
  getCurrencyCode,
  getDomesticShippingDestination,
  calculateWarehouseHandling,
} from "./shipping-rates";

export interface PriceCalculationInput {
  originCountry: OriginCountry;
  destinationCountryCode?: string; // ISO country code (e.g., "LK"), defaults to "LK"
  category: ProductCategory;
  productPrice: number; // in origin currency
  weight?: number; // in kg - optional, only used for shipping estimate
  quantity: number; // default 1
  deliveryOption?: "delivery" | "pickup"; // delivery or pickup from office
}

export interface PriceBreakdown {
  // Product details
  productPriceOrigin: number; // Product price in origin currency (Item Cost)
  productPriceLKR: number; // Product price converted to LKR

  // Price Calculator Total components (in origin currency)
  domesticCourier: number; // Domestic Courier Charge
  warehouseHandling: number; // Warehouse Handling = (Item Cost + Domestic Courier) × 10%
  priceCalculatorTotalOrigin: number; // Item Cost + Domestic Courier + Warehouse Handling

  // Price Calculator Total in LKR
  priceCalculatorTotalLKR: number;

  // Shipping Rate components (in LKR)
  internationalShippingLKR?: number; // Weight × Shipping Rate per kg (if weight provided)
  domesticShippingDestinationLKR: number; // Fixed domestic shipping in destination country
  shippingRateLKR?: number; // International Shipping + Domestic Shipping (if weight provided)

  // Colombo Mail Service Charge (15% of Shipping Rate + Price Calculator Total in LKR)
  colomboServiceChargeLKR?: number;

  // Shipping Total (Shipping Rate + Colombo Service Charge)
  shippingTotalLKR?: number;

  // Warehouse Handling Charges (for display - this is the price calculator total)
  warehouseHandlingChargesLKR: number; // Same as priceCalculatorTotalLKR

  // Grand Total (Price Calculator Total + Shipping Total)
  totalPriceLKR: number;
  totalPriceOrigin: number; // Total in origin currency

  // Exchange rate
  exchangeRate: number;
  originCurrency: string;
  destinationCurrency: string;
}

/**
 * Calculate complete price breakdown for a product
 * New Formula:
 * 1. Price Calculator Total (Origin Currency) = Item Cost + Domestic Courier + Warehouse Handling
 *    Warehouse Handling = (Item Cost + Domestic Courier) × 10%
 * 2. Shipping Rate (LKR) = International Shipping + Domestic Shipping (if delivery)
 * 3. Colombo Service Charge (LKR) = (Shipping Rate + Price Calculator Total in LKR) × 15%
 * 4. Shipping Total (LKR) = Shipping Rate + Colombo Service Charge
 */
export async function calculateProductPrice(input: PriceCalculationInput): Promise<PriceBreakdown> {
  const { 
    originCountry, 
    destinationCountryCode = "LK",
    category, 
    productPrice, 
    weight, 
    quantity, 
    deliveryOption = "delivery" 
  } = input;

  // Get exchange rate from database
  const exchangeRate = await getExchangeRate(originCountry, destinationCountryCode);
  const originCurrency = await getCurrencyCode(originCountry);
  
  // Get destination currency code
  const { productPriceCalculatorApi } = await import("./api/product-price-calculator");
  const destinationCurrencyCode = await productPriceCalculatorApi.getCurrencyCode(destinationCountryCode) || "LKR";
  const destinationCurrency = destinationCurrencyCode;

  // 1. Price Calculator Total (in Origin Currency)
  // Item Cost (Origin Currency)
  const itemCostOrigin = productPrice * quantity;
  
  // Domestic Courier Charge (Origin Currency)
  const domesticCourier = await getDomesticCourier(originCountry);
  
  // Warehouse Handling (Origin Currency) = calculated from database
  const warehouseHandling = await calculateWarehouseHandling(originCountry, itemCostOrigin + domesticCourier);
  
  // Price Calculator Total (Origin Currency) = Item Cost + Domestic Courier + Warehouse Handling
  const priceCalculatorTotalOrigin = itemCostOrigin + domesticCourier + warehouseHandling;

  // Convert Price Calculator Total to destination currency
  const priceCalculatorTotalDestination = priceCalculatorTotalOrigin * exchangeRate;

  // 2. Shipping Rate (in destination currency)
  let internationalShippingDestination: number | undefined;
  let shippingRateDestination: number | undefined;
  const domesticShippingDestination = deliveryOption === "delivery" 
    ? await getDomesticShippingDestination(destinationCountryCode)
    : 0; // No domestic shipping charge if pickup

  if (weight && weight > 0) {
    // International Shipping Charge = Weight × Shipping Rate per kg
    const shippingRatePerKg = await getShippingRate(originCountry, category, destinationCountryCode);
    internationalShippingDestination = weight * shippingRatePerKg;
    
    // Shipping Rate = International Shipping + Domestic Shipping
    shippingRateDestination = internationalShippingDestination + domesticShippingDestination;
  }

  // 3. Colombo Mail Service Charge = (Shipping Rate + Price Calculator Total) × percentage
  let colomboServiceChargeDestination: number | undefined;
  let shippingTotalDestination: number | undefined;

  if (shippingRateDestination !== undefined) {
    const serviceChargePercent = await getServiceChargePercentage();
    colomboServiceChargeDestination = (shippingRateDestination + priceCalculatorTotalDestination) * (serviceChargePercent / 100);
    
    // 4. Shipping Total = Shipping Rate + Colombo Service Charge
    shippingTotalDestination = shippingRateDestination + colomboServiceChargeDestination;
  }

  // Warehouse Handling Charges (for display) = Price Calculator Total
  const warehouseHandlingChargesDestination = priceCalculatorTotalDestination;

  // Grand Total = Price Calculator Total + Shipping Total (if calculated)
  const totalPriceDestination = priceCalculatorTotalDestination + (shippingTotalDestination || 0);

  // Convert total back to origin currency for reference
  const totalPriceOrigin = totalPriceDestination / exchangeRate;

  return {
    productPriceOrigin: itemCostOrigin,
    productPriceLKR: itemCostOrigin * exchangeRate,
    domesticCourier,
    warehouseHandling,
    priceCalculatorTotalOrigin,
    priceCalculatorTotalLKR: priceCalculatorTotalDestination,
    internationalShippingLKR: internationalShippingDestination,
    domesticShippingDestinationLKR: domesticShippingDestination,
    shippingRateLKR: shippingRateDestination,
    colomboServiceChargeLKR: colomboServiceChargeDestination,
    shippingTotalLKR: shippingTotalDestination,
    warehouseHandlingChargesLKR: warehouseHandlingChargesDestination,
    totalPriceLKR: totalPriceDestination,
    totalPriceOrigin,
    exchangeRate,
    originCurrency,
    destinationCurrency,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

