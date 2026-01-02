-- Multi-Country Destination Support - Shipping Rates and Exchange Rates
-- Adds support for India, Malaysia, Dubai, and Sri Lanka as destinations

-- 1. Add exchange rates for all currency pairs (INR, MYR, AED, LKR)
-- Using exchange_currencies table: INR=1.00, MYR=20.24, AED≈22.5 (estimated), LKR=3.65 (from INR)

-- INR to MYR: MYR value is 20.24 relative to INR 1.00, so INR to MYR = 1/20.24 = 0.0494
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'INR', 'MYR', 0.0494, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'INR' AND to_currency = 'MYR' AND effective_date = CURRENT_DATE
);

-- MYR to INR: Inverse of above = 20.24
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'MYR', 'INR', 20.24, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'MYR' AND to_currency = 'INR' AND effective_date = CURRENT_DATE
);

-- INR to AED: AED is approximately 22.5 relative to INR 1.00 (estimated), so INR to AED = 1/22.5 = 0.0444
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'INR', 'AED', 0.0444, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'INR' AND to_currency = 'AED' AND effective_date = CURRENT_DATE
);

-- AED to INR: Inverse = 22.5
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'AED', 'INR', 22.5, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'AED' AND to_currency = 'INR' AND effective_date = CURRENT_DATE
);

-- MYR to AED: MYR=20.24, AED≈22.5, so MYR to AED = 22.5/20.24 = 1.1116
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'MYR', 'AED', 1.1116, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'MYR' AND to_currency = 'AED' AND effective_date = CURRENT_DATE
);

-- AED to MYR: Inverse = 0.8996
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'AED', 'MYR', 0.8996, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'AED' AND to_currency = 'MYR' AND effective_date = CURRENT_DATE
);

-- INR to INR (1:1)
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'INR', 'INR', 1.00, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'INR' AND to_currency = 'INR' AND effective_date = CURRENT_DATE
);

-- MYR to MYR (1:1)
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'MYR', 'MYR', 1.00, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'MYR' AND to_currency = 'MYR' AND effective_date = CURRENT_DATE
);

-- AED to AED (1:1)
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'AED', 'AED', 1.00, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'AED' AND to_currency = 'AED' AND effective_date = CURRENT_DATE
);

-- 2. Update shipping rates with user-provided rates
-- Note: Rates are provided in INR, but stored in destination currency
-- We need to convert to destination currency using exchange rates

-- India → Malaysia: 2200 INR per kg (all categories)
-- Convert to MYR: 2200 * (1/20.24) = 2200 * 0.0494 = 108.68 MYR per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'MY', category_id, 108.68, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- India → Dubai: 1860 INR per kg (all categories)
-- Convert to AED: 1860 * (1/22.5) = 1860 * 0.0444 = 82.58 AED per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'AE', category_id, 82.58, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- India → Sri Lanka: Category-specific rates in INR, convert to LKR
-- Clothes: 720 INR per kg = 720 * 3.65 = 2628 LKR per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 2628.00, true
FROM product_categories WHERE category_code = 'clothes'
ON CONFLICT DO NOTHING;

-- Medicine/Food: 3430 INR per kg = 3430 * 3.65 = 12519.5 LKR per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 12519.50, true
FROM product_categories WHERE category_code = 'medicine'
ON CONFLICT DO NOTHING;

-- Others: 1580 INR per kg = 1580 * 3.65 = 5767 LKR per kg
-- Apply to: others, laptop, watch, electronics
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 5767.00, true
FROM product_categories WHERE category_code IN ('others', 'laptop', 'watch', 'electronics')
ON CONFLICT DO NOTHING;

-- Malaysia → India: 1570 INR per kg (all categories)
-- Already in INR (destination currency), so 1570 INR per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'MY', 'IN', category_id, 1570.00, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- Malaysia → Dubai: 1300 INR per kg (all categories)
-- Convert to AED: 1300 * (1/22.5) = 1300 * 0.0444 = 57.72 AED per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'MY', 'AE', category_id, 57.72, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- Malaysia → Sri Lanka: 1690 INR per kg (all categories)
-- Convert to LKR: 1690 * 3.65 = 6168.5 LKR per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'MY', 'LK', category_id, 6168.50, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- Dubai → India: 1750 INR per kg (all categories)
-- Already in INR (destination currency), so 1750 INR per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'AE', 'IN', category_id, 1750.00, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- Dubai → Malaysia: 1300 INR per kg (all categories)
-- Convert to MYR: 1300 * (1/20.24) = 1300 * 0.0494 = 64.22 MYR per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'AE', 'MY', category_id, 64.22, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- Dubai → Sri Lanka: 1400 INR per kg (all categories)
-- Convert to LKR: 1400 * 3.65 = 5110 LKR per kg
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'AE', 'LK', category_id, 5110.00, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- 3. Add domestic shipping destination charges for all destination countries
-- India: Default ~250 INR
INSERT INTO domestic_shipping_destination_charges (destination_country_code, charge_amount, is_active)
SELECT 'IN', 250.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_shipping_destination_charges WHERE destination_country_code = 'IN' AND is_active = true);

-- Malaysia: Default ~25 MYR
INSERT INTO domestic_shipping_destination_charges (destination_country_code, charge_amount, is_active)
SELECT 'MY', 25.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_shipping_destination_charges WHERE destination_country_code = 'MY' AND is_active = true);

-- Dubai/UAE: Default ~35 AED
INSERT INTO domestic_shipping_destination_charges (destination_country_code, charge_amount, is_active)
SELECT 'AE', 35.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_shipping_destination_charges WHERE destination_country_code = 'AE' AND is_active = true);

-- Sri Lanka: 500 LKR (already exists, but ensure it's there)
INSERT INTO domestic_shipping_destination_charges (destination_country_code, charge_amount, is_active)
SELECT 'LK', 500.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_shipping_destination_charges WHERE destination_country_code = 'LK' AND is_active = true);

