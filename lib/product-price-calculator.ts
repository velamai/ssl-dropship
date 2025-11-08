// Product price calculator - calculates total costs including shipping, duties, and handling

import type { OriginCountry, ProductCategory } from "./shipping-rates";
import {
  EXCHANGE_RATES,
  getDomesticCourier,
  getShippingRate,
  COLOMBO_SERVICE_CHARGE_PERCENT,
  getCurrencyCode,
  getDomesticShippingDestination,
} from "./shipping-rates";

export interface PriceCalculationInput {
  originCountry: OriginCountry;
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
export function calculateProductPrice(input: PriceCalculationInput): PriceBreakdown {
  const { originCountry, category, productPrice, weight, quantity, deliveryOption = "delivery" } = input;

  // Get exchange rate
  const exchangeRate = EXCHANGE_RATES[originCountry];
  const originCurrency = getCurrencyCode(originCountry);
  const destinationCurrency = "LKR";

  // 1. Price Calculator Total (in Origin Currency)
  // Item Cost (Origin Currency)
  const itemCostOrigin = productPrice * quantity;
  
  // Domestic Courier Charge (Origin Currency)
  const domesticCourier = getDomesticCourier(originCountry);
  
  // Warehouse Handling (Origin Currency) = (Item Cost + Domestic Courier) × 10%
  const warehouseHandling = (itemCostOrigin + domesticCourier) * 0.1;
  
  // Price Calculator Total (Origin Currency) = Item Cost + Domestic Courier + Warehouse Handling
  const priceCalculatorTotalOrigin = itemCostOrigin + domesticCourier + warehouseHandling;

  // Convert Price Calculator Total to LKR
  const priceCalculatorTotalLKR = priceCalculatorTotalOrigin * exchangeRate;

  // 2. Shipping Rate (in LKR)
  let internationalShippingLKR: number | undefined;
  let shippingRateLKR: number | undefined;
  const domesticShippingDestinationLKR = deliveryOption === "delivery" 
    ? getDomesticShippingDestination() 
    : 0; // No domestic shipping charge if pickup

  if (weight && weight > 0) {
    // International Shipping Charge (LKR) = Weight × Shipping Rate per kg
    const shippingRatePerKg = getShippingRate(originCountry, category);
    internationalShippingLKR = weight * shippingRatePerKg;
    
    // Shipping Rate (LKR) = International Shipping + Domestic Shipping
    shippingRateLKR = internationalShippingLKR + domesticShippingDestinationLKR;
  }

  // 3. Colombo Mail Service Charge (LKR) = (Shipping Rate + Price Calculator Total in LKR) × 15%
  let colomboServiceChargeLKR: number | undefined;
  let shippingTotalLKR: number | undefined;

  if (shippingRateLKR !== undefined) {
    colomboServiceChargeLKR = (shippingRateLKR + priceCalculatorTotalLKR) * (COLOMBO_SERVICE_CHARGE_PERCENT / 100);
    
    // 4. Shipping Total (LKR) = Shipping Rate + Colombo Service Charge
    shippingTotalLKR = shippingRateLKR + colomboServiceChargeLKR;
  }

  // Warehouse Handling Charges (for display) = Price Calculator Total
  const warehouseHandlingChargesLKR = priceCalculatorTotalLKR;

  // Grand Total (LKR) = Price Calculator Total + Shipping Total (if calculated)
  const totalPriceLKR = priceCalculatorTotalLKR + (shippingTotalLKR || 0);

  // Convert total back to origin currency for reference
  const totalPriceOrigin = totalPriceLKR / exchangeRate;

  return {
    productPriceOrigin: itemCostOrigin,
    productPriceLKR: itemCostOrigin * exchangeRate,
    domesticCourier,
    warehouseHandling,
    priceCalculatorTotalOrigin,
    priceCalculatorTotalLKR,
    internationalShippingLKR,
    domesticShippingDestinationLKR,
    shippingRateLKR,
    colomboServiceChargeLKR,
    shippingTotalLKR,
    warehouseHandlingChargesLKR,
    totalPriceLKR,
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

