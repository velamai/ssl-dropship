-- Product Price Calculator Seed Data
-- This migration seeds initial data from hardcoded values in lib/shipping-rates.ts

-- 1. Update countries with currency codes (mapping origin country names to country codes)
-- India -> IN, Malaysia -> MY, Dubai/UAE -> AE, US -> US, Sri Lanka -> LK, Singapore -> SG
UPDATE countries SET currency_code = 'INR', is_active = true WHERE country_code = 'IN';
UPDATE countries SET currency_code = 'MYR', is_active = true WHERE country_code = 'MY';
UPDATE countries SET currency_code = 'AED', is_active = true WHERE country_code = 'AE';
UPDATE countries SET currency_code = 'USD', is_active = true WHERE country_code = 'US';
UPDATE countries SET currency_code = 'LKR', is_active = true WHERE country_code = 'LK';
UPDATE countries SET currency_code = 'SGD', is_active = true WHERE country_code = 'SG';

-- 2. Insert product categories
INSERT INTO product_categories (category_code, category_name, is_active) VALUES
  ('clothes', 'Clothes', true),
  ('laptop', 'Laptop', true),
  ('watch', 'Watch', true),
  ('medicine', 'Medicine', true),
  ('electronics', 'Electronics', true),
  ('others', 'Others', true)
ON CONFLICT (category_code) DO NOTHING;

-- 3. Insert domestic courier charges
-- India: 40 INR
INSERT INTO domestic_courier_charges (origin_country_code, charge_amount, is_active)
SELECT 'IN', 40.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_courier_charges WHERE origin_country_code = 'IN' AND is_active = true);

-- Malaysia: 15 MYR
INSERT INTO domestic_courier_charges (origin_country_code, charge_amount, is_active)
SELECT 'MY', 15.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_courier_charges WHERE origin_country_code = 'MY' AND is_active = true);

-- Dubai/UAE: 15 AED
INSERT INTO domestic_courier_charges (origin_country_code, charge_amount, is_active)
SELECT 'AE', 15.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_courier_charges WHERE origin_country_code = 'AE' AND is_active = true);

-- US: 40 USD
INSERT INTO domestic_courier_charges (origin_country_code, charge_amount, is_active)
SELECT 'US', 40.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_courier_charges WHERE origin_country_code = 'US' AND is_active = true);

-- Sri Lanka: 500 LKR
INSERT INTO domestic_courier_charges (origin_country_code, charge_amount, is_active)
SELECT 'LK', 500.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_courier_charges WHERE origin_country_code = 'LK' AND is_active = true);

-- Singapore: 15 SGD
INSERT INTO domestic_courier_charges (origin_country_code, charge_amount, is_active)
SELECT 'SG', 15.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_courier_charges WHERE origin_country_code = 'SG' AND is_active = true);

-- 4. Insert warehouse handling charges (10% for all countries)
INSERT INTO warehouse_handling_charges (origin_country_code, charge_type, charge_value, is_active)
SELECT 'IN', 'percentage', 10.0, true
WHERE NOT EXISTS (SELECT 1 FROM warehouse_handling_charges WHERE origin_country_code = 'IN' AND is_active = true);

INSERT INTO warehouse_handling_charges (origin_country_code, charge_type, charge_value, is_active)
SELECT 'MY', 'percentage', 10.0, true
WHERE NOT EXISTS (SELECT 1 FROM warehouse_handling_charges WHERE origin_country_code = 'MY' AND is_active = true);

INSERT INTO warehouse_handling_charges (origin_country_code, charge_type, charge_value, is_active)
SELECT 'AE', 'percentage', 10.0, true
WHERE NOT EXISTS (SELECT 1 FROM warehouse_handling_charges WHERE origin_country_code = 'AE' AND is_active = true);

INSERT INTO warehouse_handling_charges (origin_country_code, charge_type, charge_value, is_active)
SELECT 'US', 'percentage', 10.0, true
WHERE NOT EXISTS (SELECT 1 FROM warehouse_handling_charges WHERE origin_country_code = 'US' AND is_active = true);

INSERT INTO warehouse_handling_charges (origin_country_code, charge_type, charge_value, is_active)
SELECT 'LK', 'percentage', 10.0, true
WHERE NOT EXISTS (SELECT 1 FROM warehouse_handling_charges WHERE origin_country_code = 'LK' AND is_active = true);

INSERT INTO warehouse_handling_charges (origin_country_code, charge_type, charge_value, is_active)
SELECT 'SG', 'percentage', 10.0, true
WHERE NOT EXISTS (SELECT 1 FROM warehouse_handling_charges WHERE origin_country_code = 'SG' AND is_active = true);

-- 5. Insert shipping rates (destination: Sri Lanka - LK)
-- Note: We need to get category_id from product_categories table
-- India rates
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 4000.00, true
FROM product_categories WHERE category_code = 'clothes'
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 4000.00;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 5500.00, true
FROM product_categories WHERE category_code = 'others'
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 5500.00;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 12000.00, true
FROM product_categories WHERE category_code = 'medicine'
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 12000.00;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 5500.00, true
FROM product_categories WHERE category_code IN ('laptop', 'watch', 'electronics')
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 5500.00;

-- Malaysia rates (all categories: 5900)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'MY', 'LK', category_id, 5900.00, true
FROM product_categories
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 5900.00;

-- Dubai/UAE rates (all categories: 4900)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'AE', 'LK', category_id, 4900.00, true
FROM product_categories
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 4900.00;

-- US rates (same as India)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'US', 'LK', category_id, 4000.00, true
FROM product_categories WHERE category_code = 'clothes'
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 4000.00;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'US', 'LK', category_id, 5500.00, true
FROM product_categories WHERE category_code = 'others'
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 5500.00;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'US', 'LK', category_id, 12000.00, true
FROM product_categories WHERE category_code = 'medicine'
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 12000.00;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'US', 'LK', category_id, 5500.00, true
FROM product_categories WHERE category_code IN ('laptop', 'watch', 'electronics')
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 5500.00;

-- Sri Lanka rates (all categories: 0 - no international shipping)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'LK', 'LK', category_id, 0.00, true
FROM product_categories
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 0.00;

-- Singapore rates (all categories: 6000)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'SG', 'LK', category_id, 6000.00, true
FROM product_categories
ON CONFLICT (origin_country_code, destination_country_code, category_id) DO UPDATE SET rate_per_kg = 6000.00;

-- 6. Insert domestic shipping destination charge (Sri Lanka: 500 LKR)
INSERT INTO domestic_shipping_destination_charges (destination_country_code, charge_amount, is_active)
SELECT 'LK', 500.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_shipping_destination_charges WHERE destination_country_code = 'LK' AND is_active = true);

-- 7. Insert service charge config (Colombo Mail Service: 15%)
INSERT INTO service_charge_config (service_name, charge_percentage, is_active)
SELECT 'colombo_mail_service', 15.00, true
WHERE NOT EXISTS (SELECT 1 FROM service_charge_config WHERE service_name = 'colombo_mail_service' AND is_active = true);

