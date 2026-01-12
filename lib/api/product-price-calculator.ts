import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();

export interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
}

export interface DomesticCourierCharge {
  charge_id: string;
  origin_country_code: string;
  charge_type: "percentage" | "fixed";
  charge_value: number; // Percentage (e.g., 5.0) or fixed amount
  is_active: boolean;
}

export interface WarehouseHandlingCharge {
  handling_id: string;
  origin_country_code: string;
  charge_type: "percentage" | "fixed";
  charge_value: number;
  is_active: boolean;
}

export interface ProductCategory {
  category_id: string;
  category_code: string;
  category_name: string;
  is_active: boolean;
}

export interface ShippingRate {
  rate_id: string;
  origin_country_code: string;
  destination_country_code: string;
  category_id: string;
  rate_per_kg: number;
  is_active: boolean;
}

export interface DomesticShippingDestinationCharge {
  charge_id: string;
  destination_country_code: string;
  charge_amount: number;
  is_active: boolean;
}

export interface ServiceChargeConfig {
  config_id: string;
  service_name: string;
  charge_percentage: number;
  is_active: boolean;
}

export const productPriceCalculatorApi = {
  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_currency", fromCurrency)
      .eq("to_currency", toCurrency)
      .eq("is_active", true)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching exchange rate:", error);
      return null;
    }

    return data?.rate || null;
  },

  /**
   * Get domestic courier charge for an origin country
   */
  async getDomesticCourierCharge(
    originCountryCode: string
  ): Promise<DomesticCourierCharge | null> {
    const { data, error } = await supabase
      .from("domestic_courier_charges")
      .select("*")
      .eq("origin_country_code", originCountryCode)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching domestic courier charge:", error);
      return null;
    }

    return data || null;
  },

  /**
   * Calculate domestic courier amount based on percentage from drop_and_ship_source_countries table
   */
  async calculateDomesticCourier(
    originCountryCode: string,
    itemPrice: number
  ): Promise<number> {
    // Get source country data which includes domestic_courier_charge percentage
    const { sourceCountriesApi } = await import("./source-countries");
    const sourceCountries = await sourceCountriesApi.getSourceCountries();
    const sourceCountry = sourceCountries.find(
      (sc) => sc.code === originCountryCode
    );

    if (
      sourceCountry &&
      sourceCountry.domestic_courier_charge !== undefined &&
      sourceCountry.domestic_courier_charge !== null
    ) {
      // Calculate as percentage of item price
      return (itemPrice * sourceCountry.domestic_courier_charge) / 100;
    }

    // Fallback: try old method from separate table
    const charge = await this.getDomesticCourierCharge(originCountryCode);
    if (charge) {
      if (charge.charge_type === "percentage") {
        return (itemPrice * charge.charge_value) / 100;
      } else {
        return charge.charge_value;
      }
    }

    return 0;
  },

  /**
   * Get warehouse handling charge for an origin country
   */
  async getWarehouseHandlingCharge(
    originCountryCode: string
  ): Promise<WarehouseHandlingCharge | null> {
    const { data, error } = await supabase
      .from("warehouse_handling_charges")
      .select("*")
      .eq("origin_country_code", originCountryCode)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching warehouse handling charge:", error);
      return null;
    }

    return data;
  },

  /**
   * Calculate warehouse handling amount based on percentage from drop_and_ship_source_countries table
   * Now calculates based on item price only (not item + domestic courier)
   */
  async calculateWarehouseHandling(
    originCountryCode: string,
    itemPrice: number
  ): Promise<number> {
    // Get source country data which includes warehouse_handling_charges percentage
    const { sourceCountriesApi } = await import("./source-countries");
    const sourceCountries = await sourceCountriesApi.getSourceCountries();
    const sourceCountry = sourceCountries.find(
      (sc) => sc.code === originCountryCode
    );

    if (
      sourceCountry &&
      sourceCountry.warehouse_handling_charges !== undefined &&
      sourceCountry.warehouse_handling_charges !== null
    ) {
      // Calculate as percentage of item price
      return (itemPrice * sourceCountry.warehouse_handling_charges) / 100;
    }

    // Fallback: try old method from separate table
    const handling = await this.getWarehouseHandlingCharge(originCountryCode);
    if (handling) {
      if (handling.charge_type === "percentage") {
        return (itemPrice * handling.charge_value) / 100;
      } else {
        return handling.charge_value;
      }
    }

    return 0;
  },

  /**
   * Get all product categories
   */
  async getProductCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("is_active", true)
      .order("category_name");

    if (error) {
      console.error("Error fetching product categories:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get shipping rate per kg for origin, destination, and category
   */
  async getShippingRate(
    originCountryCode: string,
    destinationCountryCode: string,
    categoryCode: string
  ): Promise<number | null> {
    // First get category_id from category_code
    const { data: category, error: categoryError } = await supabase
      .from("product_categories")
      .select("category_id")
      .eq("category_code", categoryCode)
      .eq("is_active", true)
      .single();

    if (categoryError || !category) {
      console.error("Error fetching category:", categoryError);
      return null;
    }

    // Get shipping rate
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("rate_per_kg")
      .eq("origin_country_code", originCountryCode)
      .eq("destination_country_code", destinationCountryCode)
      .eq("category_id", category.category_id)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching shipping rate:", error);
      // Try to get default rate (others category) as fallback
      const { data: defaultCategory } = await supabase
        .from("product_categories")
        .select("category_id")
        .eq("category_code", "others")
        .eq("is_active", true)
        .single();

      if (defaultCategory) {
        const { data: defaultRate } = await supabase
          .from("shipping_rates")
          .select("rate_per_kg")
          .eq("origin_country_code", originCountryCode)
          .eq("destination_country_code", destinationCountryCode)
          .eq("category_id", defaultCategory.category_id)
          .eq("is_active", true)
          .single();

        return defaultRate?.rate_per_kg || null;
      }
      return null;
    }

    return data?.rate_per_kg || null;
  },

  /**
   * Get domestic shipping charge in destination country
   */
  async getDomesticShippingDestinationCharge(
    destinationCountryCode: string
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from("domestic_shipping_destination_charges")
      .select("charge_amount")
      .eq("destination_country_code", destinationCountryCode)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error(
        "Error fetching domestic shipping destination charge:",
        error
      );
      return null;
    }

    return data?.charge_amount || null;
  },

  /**
   * Get service charge percentage
   */
  async getServiceChargePercentage(
    serviceName: string = "colombo_mail_service"
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from("service_charge_config")
      .select("charge_percentage")
      .eq("service_name", serviceName)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching service charge:", error);
      return null;
    }

    return data?.charge_percentage || null;
  },

  /**
   * Get currency code for a country
   */
  async getCurrencyCode(countryCode: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("country_currencies")
      .select("currency_code")
      .eq("country_code", countryCode)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching currency code:", error);
      return null;
    }

    return data?.currency_code || null;
  },
};
