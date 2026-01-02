-- Product Price Calculator Seed Data
-- Populates all tables with initial data based on hardcoded values

-- 1. Insert country-currency mappings
-- India -> INR
INSERT INTO country_currencies (country_code, currency_code, is_active)
SELECT 'IN', 'INR', true
WHERE NOT EXISTS (SELECT 1 FROM country_currencies WHERE country_code = 'IN');

-- Malaysia -> MYR
INSERT INTO country_currencies (country_code, currency_code, is_active)
SELECT 'MY', 'MYR', true
WHERE NOT EXISTS (SELECT 1 FROM country_currencies WHERE country_code = 'MY');

-- UAE/Dubai -> AED
INSERT INTO country_currencies (country_code, currency_code, is_active)
SELECT 'AE', 'AED', true
WHERE NOT EXISTS (SELECT 1 FROM country_currencies WHERE country_code = 'AE');

-- US -> USD
INSERT INTO country_currencies (country_code, currency_code, is_active)
SELECT 'US', 'USD', true
WHERE NOT EXISTS (SELECT 1 FROM country_currencies WHERE country_code = 'US');

-- Sri Lanka -> LKR
INSERT INTO country_currencies (country_code, currency_code, is_active)
SELECT 'LK', 'LKR', true
WHERE NOT EXISTS (SELECT 1 FROM country_currencies WHERE country_code = 'LK');

-- Singapore -> SGD
INSERT INTO country_currencies (country_code, currency_code, is_active)
SELECT 'SG', 'SGD', true
WHERE NOT EXISTS (SELECT 1 FROM country_currencies WHERE country_code = 'SG');

-- 2. Insert exchange rates
-- Calculate rates from exchange_currencies table values
-- INR to LKR: Based on example "INR1 = LKR 3.65"
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'INR', 'LKR', 3.65, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'INR' AND to_currency = 'LKR' AND effective_date = CURRENT_DATE
);

-- MYR to LKR: MYR value is 20.24 (relative to INR 1.00), so MYR to LKR = 20.24 * 3.65 = 73.876
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'MYR', 'LKR', 73.876, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'MYR' AND to_currency = 'LKR' AND effective_date = CURRENT_DATE
);

-- AED to LKR: Need to calculate based on exchange_currencies (if AED exists, otherwise use approximate)
-- For now, using approximate: AED to LKR ≈ 25 (based on typical rates)
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'AED', 'LKR', 25.00, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'AED' AND to_currency = 'LKR' AND effective_date = CURRENT_DATE
);

-- USD to LKR: USD value is 88.00 (relative to INR 1.00), so USD to LKR = 88.00 * 3.65 = 321.2
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'USD', 'LKR', 321.2, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'USD' AND to_currency = 'LKR' AND effective_date = CURRENT_DATE
);

-- SGD to LKR: SGD value is 63.74 (relative to INR 1.00), so SGD to LKR = 63.74 * 3.65 = 232.651
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'SGD', 'LKR', 232.651, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'SGD' AND to_currency = 'LKR' AND effective_date = CURRENT_DATE
);

-- LKR to LKR (1:1)
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date, is_active)
SELECT 'LKR', 'LKR', 1.00, CURRENT_DATE, true
WHERE NOT EXISTS (
  SELECT 1 FROM exchange_rates 
  WHERE from_currency = 'LKR' AND to_currency = 'LKR' AND effective_date = CURRENT_DATE
);

-- 3. Insert product categories
INSERT INTO product_categories (category_code, category_name, is_active) VALUES
  ('clothes', 'Clothes', true),
  ('laptop', 'Laptop', true),
  ('watch', 'Watch', true),
  ('medicine', 'Medicine', true),
  ('electronics', 'Electronics', true),
  ('others', 'Others', true)
ON CONFLICT (category_code) DO NOTHING;

-- 4. Insert domestic courier charges
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

-- 5. Insert warehouse handling charges (10% for all countries)
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

-- 6. Insert shipping rates (destination: Sri Lanka - LK)
-- India rates
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 4000.00, true
FROM product_categories WHERE category_code = 'clothes'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 5500.00, true
FROM product_categories WHERE category_code = 'others'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 12000.00, true
FROM product_categories WHERE category_code = 'medicine'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'IN', 'LK', category_id, 5500.00, true
FROM product_categories WHERE category_code IN ('laptop', 'watch', 'electronics')
ON CONFLICT DO NOTHING;

-- Malaysia rates (all categories: 5900)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'MY', 'LK', category_id, 5900.00, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- Dubai/UAE rates (all categories: 4900)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'AE', 'LK', category_id, 4900.00, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- US rates (same as India)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'US', 'LK', category_id, 4000.00, true
FROM product_categories WHERE category_code = 'clothes'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'US', 'LK', category_id, 5500.00, true
FROM product_categories WHERE category_code = 'others'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'US', 'LK', category_id, 12000.00, true
FROM product_categories WHERE category_code = 'medicine'
ON CONFLICT DO NOTHING;

INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'US', 'LK', category_id, 5500.00, true
FROM product_categories WHERE category_code IN ('laptop', 'watch', 'electronics')
ON CONFLICT DO NOTHING;

-- Sri Lanka rates (all categories: 0 - no international shipping)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'LK', 'LK', category_id, 0.00, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- Singapore rates (all categories: 6000)
INSERT INTO shipping_rates (origin_country_code, destination_country_code, category_id, rate_per_kg, is_active)
SELECT 'SG', 'LK', category_id, 6000.00, true
FROM product_categories
ON CONFLICT DO NOTHING;

-- 7. Insert domestic shipping destination charge (Sri Lanka: 500 LKR)
INSERT INTO domestic_shipping_destination_charges (destination_country_code, charge_amount, is_active)
SELECT 'LK', 500.00, true
WHERE NOT EXISTS (SELECT 1 FROM domestic_shipping_destination_charges WHERE destination_country_code = 'LK' AND is_active = true);

-- 8. Insert service charge config (Colombo Mail Service: 15%)
INSERT INTO service_charge_config (service_name, charge_percentage, is_active)
SELECT 'colombo_mail_service', 15.00, true
WHERE NOT EXISTS (SELECT 1 FROM service_charge_config WHERE service_name = 'colombo_mail_service' AND is_active = true);

