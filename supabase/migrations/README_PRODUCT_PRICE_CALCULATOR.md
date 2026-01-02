# Product Price Calculator Database Migrations

## Overview
This directory contains migrations to set up the database schema for the product price calculator feature.

## Migration Files

### 1. `20240101000002_product_price_calculator_tables.sql`
Creates all required tables for the product price calculator:
- `exchange_rates` - Exchange rates between currency pairs
- `country_currencies` - Maps countries to currency codes (without modifying countries table)
- `domestic_courier_charges` - Domestic courier charges per source country
- `warehouse_handling_charges` - Warehouse handling charges (percentage or fixed)
- `product_categories` - Product categories for shipping calculations
- `shipping_rates` - Shipping rates per kg by origin, destination, and category
- `domestic_shipping_destination_charges` - Domestic shipping charges in destination country
- `service_charge_config` - Service charge percentages

### 2. `20240101000003_product_price_calculator_seed_data.sql`
Populates all tables with initial seed data:
- Country-currency mappings (IN→INR, MY→MYR, AE→AED, US→USD, LK→LKR, SG→SGD)
- Exchange rates (calculated from exchange_currencies table values)
- Product categories (clothes, laptop, watch, medicine, electronics, others)
- Domestic courier charges for all origin countries
- Warehouse handling charges (10% for all countries)
- Shipping rates for all origin→destination pairs and categories
- Domestic shipping destination charges (500 LKR for Sri Lanka)
- Service charge config (15% for colombo_mail_service)

## Running Migrations

These migrations should be run in order:
1. First run the schema migration: `20240101000002_product_price_calculator_tables.sql`
2. Then run the seed data migration: `20240101000003_product_price_calculator_seed_data.sql`

## Notes

- All tables use `is_active` flags for soft deletes
- Unique constraints ensure only one active record per country/category combination
- The `warehouses` table already exists and has a `country_code` field - no changes needed
- The `countries` table is not modified - currency mappings are in `country_currencies` table
- Exchange rates can be updated by inserting new records with new `effective_date` values

## API Updates

The `lib/api/product-price-calculator.ts` file has been updated to:
- Use `country_currencies` table instead of querying `countries` for currency codes
- Filter exchange rates by `is_active` flag

