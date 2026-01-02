-- Product Price Calculator Database Schema Migration
-- Creates all required tables for product price calculator without modifying existing tables

-- 1. Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  exchange_rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate NUMERIC(20, 6) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  CONSTRAINT fk_from_currency FOREIGN KEY (from_currency) REFERENCES exchange_currencies(currency_code),
  CONSTRAINT fk_to_currency FOREIGN KEY (to_currency) REFERENCES exchange_currencies(currency_code),
  CONSTRAINT unique_exchange_rate UNIQUE (from_currency, to_currency, effective_date)
);

-- Create indexes for exchange_rates
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON exchange_rates(from_currency, to_currency, is_active, effective_date DESC);

-- Add comment
COMMENT ON TABLE exchange_rates IS 'Stores exchange rates between currency pairs with effective dates';

-- 2. Create country_currencies table (maps countries to currency codes without modifying countries table)
CREATE TABLE IF NOT EXISTS country_currencies (
  country_currency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  currency_code VARCHAR(10) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  CONSTRAINT fk_country_code FOREIGN KEY (country_code) REFERENCES countries(code),
  CONSTRAINT fk_currency_code FOREIGN KEY (currency_code) REFERENCES exchange_currencies(currency_code),
  CONSTRAINT unique_country_currency UNIQUE (country_code)
);

-- Create indexes for country_currencies
CREATE INDEX IF NOT EXISTS idx_country_currencies_lookup ON country_currencies(country_code, is_active);

-- Add comment
COMMENT ON TABLE country_currencies IS 'Maps countries to their currency codes';

-- 3. Create domestic_courier_charges table
CREATE TABLE IF NOT EXISTS domestic_courier_charges (
  charge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country_code TEXT NOT NULL,
  charge_amount NUMERIC(20, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  CONSTRAINT fk_origin_country FOREIGN KEY (origin_country_code) REFERENCES countries(code)
);

-- Create unique partial index for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_domestic_courier_active ON domestic_courier_charges(origin_country_code) WHERE is_active = true;

-- Create general index
CREATE INDEX IF NOT EXISTS idx_domestic_courier_lookup ON domestic_courier_charges(origin_country_code, is_active);

-- Add comment
COMMENT ON TABLE domestic_courier_charges IS 'Stores domestic courier charges per source country in origin currency';

-- 4. Create enum type for charge_type
DO $$ BEGIN
  CREATE TYPE charge_type_enum AS ENUM ('percentage', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create warehouse_handling_charges table
CREATE TABLE IF NOT EXISTS warehouse_handling_charges (
  handling_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country_code TEXT NOT NULL,
  charge_type charge_type_enum NOT NULL,
  charge_value NUMERIC(20, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  CONSTRAINT fk_origin_country FOREIGN KEY (origin_country_code) REFERENCES countries(code)
);

-- Create unique partial index for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouse_handling_active ON warehouse_handling_charges(origin_country_code) WHERE is_active = true;

-- Create general index
CREATE INDEX IF NOT EXISTS idx_warehouse_handling_lookup ON warehouse_handling_charges(origin_country_code, is_active);

-- Add comment
COMMENT ON TABLE warehouse_handling_charges IS 'Stores warehouse handling charges per source country (percentage or fixed)';

-- 5. Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(50) NOT NULL UNIQUE,
  category_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Create indexes for product_categories
CREATE INDEX IF NOT EXISTS idx_product_categories_code ON product_categories(category_code, is_active);

-- Add comment
COMMENT ON TABLE product_categories IS 'Stores product categories for shipping rate calculations';

-- 6. Create shipping_rates table
CREATE TABLE IF NOT EXISTS shipping_rates (
  rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country_code TEXT NOT NULL,
  destination_country_code TEXT NOT NULL,
  category_id UUID NOT NULL,
  rate_per_kg NUMERIC(20, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  CONSTRAINT fk_origin_country FOREIGN KEY (origin_country_code) REFERENCES countries(code),
  CONSTRAINT fk_destination_country FOREIGN KEY (destination_country_code) REFERENCES countries(code),
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES product_categories(category_id)
);

-- Create unique partial index for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipping_rates_active ON shipping_rates(origin_country_code, destination_country_code, category_id) WHERE is_active = true;

-- Create general index
CREATE INDEX IF NOT EXISTS idx_shipping_rates_lookup ON shipping_rates(origin_country_code, destination_country_code, category_id, is_active);

-- Add comment
COMMENT ON TABLE shipping_rates IS 'Stores shipping rates per kg for origin-destination country pairs and categories';

-- 7. Create domestic_shipping_destination_charges table
CREATE TABLE IF NOT EXISTS domestic_shipping_destination_charges (
  charge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_country_code TEXT NOT NULL,
  charge_amount NUMERIC(20, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ,
  CONSTRAINT fk_destination_country FOREIGN KEY (destination_country_code) REFERENCES countries(code)
);

-- Create unique partial index for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_domestic_shipping_dest_active ON domestic_shipping_destination_charges(destination_country_code) WHERE is_active = true;

-- Create general index
CREATE INDEX IF NOT EXISTS idx_domestic_shipping_dest_lookup ON domestic_shipping_destination_charges(destination_country_code, is_active);

-- Add comment
COMMENT ON TABLE domestic_shipping_destination_charges IS 'Stores domestic shipping charges in destination country in destination currency';

-- 8. Create service_charge_config table
CREATE TABLE IF NOT EXISTS service_charge_config (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL UNIQUE,
  charge_percentage NUMERIC(5, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Create unique partial index for active records
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_charge_active ON service_charge_config(service_name) WHERE is_active = true;

-- Create general index
CREATE INDEX IF NOT EXISTS idx_service_charge_lookup ON service_charge_config(service_name, is_active);

-- Add comment
COMMENT ON TABLE service_charge_config IS 'Stores service charge percentages (e.g., Colombo Mail Service)';

