-- Product Price Calculator Database Schema Migration
-- This migration creates tables for dynamic product price calculation

-- 1. Enhance countries table to add currency_code and is_active
ALTER TABLE countries 
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) REFERENCES currencies(code),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create domestic_courier_charges table
CREATE TABLE IF NOT EXISTS domestic_courier_charges (
  charge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country_code VARCHAR(2) NOT NULL REFERENCES countries(country_code),
  charge_amount DECIMAL(10, 2) NOT NULL, -- In origin country currency
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create warehouse_handling_charges table
CREATE TABLE IF NOT EXISTS warehouse_handling_charges (
  handling_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country_code VARCHAR(2) NOT NULL REFERENCES countries(country_code),
  charge_type VARCHAR(20) NOT NULL CHECK (charge_type IN ('percentage', 'fixed')),
  charge_value DECIMAL(10, 4) NOT NULL, -- Percentage (e.g., 10.0) or fixed amount
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(50) UNIQUE NOT NULL, -- 'clothes', 'laptop', 'watch', etc.
  category_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create shipping_rates table
CREATE TABLE IF NOT EXISTS shipping_rates (
  rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_country_code VARCHAR(2) NOT NULL REFERENCES countries(country_code),
  destination_country_code VARCHAR(2) NOT NULL REFERENCES countries(country_code),
  category_id UUID NOT NULL REFERENCES product_categories(category_id),
  rate_per_kg DECIMAL(10, 2) NOT NULL, -- In destination currency
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(origin_country_code, destination_country_code, category_id)
);

-- 6. Create domestic_shipping_destination_charges table
CREATE TABLE IF NOT EXISTS domestic_shipping_destination_charges (
  charge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_country_code VARCHAR(2) NOT NULL REFERENCES countries(country_code),
  charge_amount DECIMAL(10, 2) NOT NULL, -- In destination currency
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create service_charge_config table
CREATE TABLE IF NOT EXISTS service_charge_config (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL, -- 'colombo_mail_service'
  charge_percentage DECIMAL(5, 2) NOT NULL, -- 15.00
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_rates_lookup ON shipping_rates(origin_country_code, destination_country_code, category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_domestic_courier_lookup ON domestic_courier_charges(origin_country_code, is_active);
CREATE INDEX IF NOT EXISTS idx_warehouse_handling_lookup ON warehouse_handling_charges(origin_country_code, is_active);
CREATE INDEX IF NOT EXISTS idx_domestic_shipping_dest_lookup ON domestic_shipping_destination_charges(destination_country_code, is_active);

