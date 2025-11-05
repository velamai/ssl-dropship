// Product price calculator - calculates total costs including shipping, duties, and handling

import type { OriginCountry, ProductCategory } from "./shipping-rates";
import {
  EXCHANGE_RATES,
  getFixedDomesticCharges,
  getDomesticCourier,
  getDomesticHandling,
  getShippingRate,
  COLOMBO_SERVICE_CHARGE_PERCENT,
  getCurrencyCode,
} from "./shipping-rates";

export interface PriceCalculationInput {
  originCountry: OriginCountry;
  category: ProductCategory;
  productPrice: number; // in origin currency
  weight: number; // in kg
  quantity: number; // default 1
}

export interface PriceBreakdown {
  // Product details
  productPriceOrigin: number; // Product price in origin currency
  productPriceLKR: number; // Product price converted to LKR

  // Fixed domestic charges (in origin currency)
  domesticCourier: number;
  domesticHandling: number;
  totalDomesticChargesOrigin: number;

  // Fixed domestic charges converted to LKR
  totalDomesticChargesLKR: number;

  // International shipping (in LKR)
  shippingRatePerKg: number; // LKR per kg
  shippingLKR: number; // Total shipping cost in LKR

  // Colombo Mail Service Charge (15% of converted fixed domestic charges)
  serviceChargeLKR: number;

  // Totals
  shippingAndHandlingLKR: number; // Shipping + Service Charge
  totalPriceLKR: number; // Product Price + Shipping + Service Charge
  totalPriceOrigin: number; // Total in origin currency

  // Exchange rate
  exchangeRate: number;
  originCurrency: string;
  destinationCurrency: string;
}

/**
 * Calculate complete price breakdown for a product
 */
export function calculateProductPrice(input: PriceCalculationInput): PriceBreakdown {
  const { originCountry, category, productPrice, weight, quantity } = input;

  // Get exchange rate
  const exchangeRate = EXCHANGE_RATES[originCountry];
  const originCurrency = getCurrencyCode(originCountry);
  const destinationCurrency = "LKR";

  // 1. Convert product price to LKR
  const productPriceLKR = productPrice * exchangeRate * quantity;

  // 2. Get fixed domestic charges (in origin currency)
  const domesticCourier = getDomesticCourier(originCountry);
  const domesticHandling = getDomesticHandling(originCountry);
  const totalDomesticChargesOrigin = getFixedDomesticCharges(originCountry);

  // Convert fixed domestic charges to LKR
  const totalDomesticChargesLKR = totalDomesticChargesOrigin * exchangeRate;

  // 3. Calculate international shipping (in LKR)
  const shippingRatePerKg = getShippingRate(originCountry, category);
  const shippingLKR = weight * shippingRatePerKg;

  // 4. Calculate Colombo Mail Service Charge (15% of converted fixed domestic charges)
  // Note: This is 15% of the converted fixed charges, NOT the product price
  const serviceChargeLKR = (totalDomesticChargesLKR * COLOMBO_SERVICE_CHARGE_PERCENT) / 100;

  // 5. Calculate shipping + handling (service charge)
  const shippingAndHandlingLKR = shippingLKR + serviceChargeLKR;

  // 6. Calculate total price in LKR
  // Total = Product Price (LKR) + Shipping (LKR) + Service Charge (LKR)
  const totalPriceLKR = productPriceLKR + shippingAndHandlingLKR;

  // 7. Convert total back to origin currency for reference
  const totalPriceOrigin = totalPriceLKR / exchangeRate;

  return {
    productPriceOrigin: productPrice * quantity,
    productPriceLKR,
    domesticCourier,
    domesticHandling,
    totalDomesticChargesOrigin,
    totalDomesticChargesLKR,
    shippingRatePerKg,
    shippingLKR,
    serviceChargeLKR,
    shippingAndHandlingLKR,
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

