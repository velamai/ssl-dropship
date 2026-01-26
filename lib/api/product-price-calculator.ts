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
    toCurrency: string,
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
    originCountryCode: string,
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
    itemPrice: number,
  ): Promise<number> {
    // Get source country data which includes domestic_courier_charge percentage
    const { sourceCountriesApi } = await import("./source-countries");
    const sourceCountries = await sourceCountriesApi.getSourceCountries();
    const sourceCountry = sourceCountries.find(
      (sc) => sc.code === originCountryCode,
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
    originCountryCode: string,
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
    itemPrice: number,
  ): Promise<number> {
    // Get source country data which includes warehouse_handling_charges percentage
    const { sourceCountriesApi } = await import("./source-countries");
    const sourceCountries = await sourceCountriesApi.getSourceCountries();
    const sourceCountry = sourceCountries.find(
      (sc) => sc.code === originCountryCode,
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
    categoryCode: string,
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
    destinationCountryCode: string,
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
        error,
      );
      return null;
    }

    return data?.charge_amount || null;
  },

  /**
   * Get service charge percentage
   */
  async getServiceChargePercentage(
    serviceName: string = "colombo_mail_service",
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

  /**
   * Get price per kg from drop_and_ship_receiving_country_price table
   * Returns price in INR
   */
  async getReceivingCountryPrice(
    fromCountry: string,
    toCountry: string,
  ): Promise<number | null> {
    const { data, error } = await supabase
      .from("drop_and_ship_receiving_country_price")
      .select("price_per_kg")
      .eq("from_country", fromCountry)
      .eq("to_country", toCountry)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching receiving country price:", error);
      return null;
    }

    return data?.price_per_kg ? Number(data.price_per_kg) : null;
  },
};

type CurrencyType = "USD" | "INR" | "LKR" | "GBP" | "AED" | "MYR";

const countryCodeToCurrency = [
  { code: "US", currency: "USD" },
  { code: "IN", currency: "INR" },
  { code: "LK", currency: "LKR" },
  { code: "GB", currency: "GBP" },
  { code: "AE", currency: "AED" },
  { code: "MY", currency: "MYR" },
];

export const currenciesToCountryCode = (currency: CurrencyType) => {
  const mapping = countryCodeToCurrency.find((c) => c.currency === currency);
  return mapping ? mapping.code : "US";
};

export const countryCodeToCurrencies = (countryCode: string) => {
  const mapping = countryCodeToCurrency.find((c) => c.code === countryCode);
  return mapping ? mapping.currency : "USD";
};

const getSourceCountries = async () => {
  const { data, error } = await supabase
    .from("drop_and_ship_source_countries")
    .select("code");

  if (error) {
    console.error("Error fetching source countries:", error);
    return [];
  }

  return data || [];
};

export const getHandlingCharge = async ({
  itemPrice,
  itemCurrency,
  fromCountry,
  toCountry,
}: {
  itemPrice: number;
  itemCurrency: string;
  fromCountry: string;
  toCountry: string;
}) => {
  const itemCurrencyCountry = currenciesToCountryCode(
    itemCurrency as CurrencyType,
  );

    /**
   * Warehouse handling charge (percentage)
   */
  const { data: warehouseData, error: warehouseHandlingChargesError } =
    await supabase
      .from("drop_and_ship_source_countries")
      .select("warehouse_handling_charges")
      .eq("code", fromCountry)
      .limit(1)
      .single();
  
  /**
   * Exchange rate:
   * itemCurrencyCountry -> destination country
   */

  let exchangeRateToDestination;
  let exchangeRateDestError;

  const sourceCountries = await getSourceCountries();

  if (sourceCountries.find((sc) => sc.code === toCountry)) {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", fromCountry)
      .eq("to_country", toCountry)
      .eq("is_active", true)
      .limit(1)
      .single();

    exchangeRateToDestination = data;
    exchangeRateDestError = error;
  } else {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", fromCountry)
      .eq("to_country", "US")
      .eq("is_active", true)
      .limit(1)
      .single();

    exchangeRateToDestination = data;
    exchangeRateDestError = error;
  }

  /**
   * Exchange rate:
   * itemCurrencyCountry -> source country
   */

  const { data: exchangeRateToSource, error: exchangeRateSourceError } =
    await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", itemCurrencyCountry)
      .eq("to_country", fromCountry)
      .eq("is_active", true)
      .limit(1)
      .single();
  if (
    exchangeRateDestError ||
    exchangeRateSourceError ||
    warehouseHandlingChargesError
  ) {
    throw new Error("Failed to fetch handling charge data");
  }

  const warehousePercentage = warehouseData.warehouse_handling_charges / 100;

  const sourcePrice = itemPrice * exchangeRateToSource.rate * warehousePercentage

  return {
    /**
     * Price converted to source country currency
     * + warehouse handling charge applied
     */
    sourceCountryPrice:
      itemPrice * exchangeRateToSource.rate * warehousePercentage,

    /**
     * Price converted to destination country currency
     */
    destinationCountryPrice: sourcePrice * (exchangeRateToDestination?.rate || 1),
  };
};

export const getDomesticCourierCharge = async ({
  fromCountry,
  toCountry,
}: {
  fromCountry: string;
  toCountry: string;
}) => {
  const { data: domesticCourierChargeData, error: domesticCourierChargeError } =
    await supabase
      .from("drop_and_ship_source_countries")
      .select("domestic_courier_charge")
      .eq("code", fromCountry)
      .limit(1)
      .single();

      

  const { data: exchangeRateToSource, error: exchangeRateSourceError } =
    await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", "IN")
      .eq("to_country", fromCountry)
      .eq("is_active", true)
      .limit(1)
      .single();



  let exchangeRateToDestination;
  let exchangeRateDestError;

  const sourceCountries = await getSourceCountries();

  console.log({sourceCountries});
  

  if (sourceCountries.find((sc) => sc.code === toCountry)) {

    console.log("Fetch from correct");
    
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", "IN")
      .eq("to_country", toCountry)
      .eq("is_active", true)
      .limit(1)
      .single();

    exchangeRateToDestination = data;
    exchangeRateDestError = error;
  } else {
    console.log("Fetch from USD");

    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", "IN")
      .eq("to_country", "US")
      .eq("is_active", true)
      .limit(1)
      .single();

    exchangeRateToDestination = data;
    exchangeRateDestError = error;
  }

  console.log({domesticCourierChargeData, exchangeRateToSource, exchangeRateToDestination, toCountry, exchangeRateDestError});


  if (
    domesticCourierChargeError ||
    exchangeRateSourceError ||
    exchangeRateDestError
  ) {
    throw new Error("Failed to fetch domestic courier charge data");
  }

  return {
    sourceCountryCharge:
      domesticCourierChargeData.domestic_courier_charge *
      exchangeRateToSource.rate,
    destinationCountryCharge:
      domesticCourierChargeData.domestic_courier_charge *
      (exchangeRateToDestination?.rate || 1),
  };
};

export const getProductPrice = async ({
  productPrice,
  productPriceCurrency,
  fromCountry,
  toCountry,
}: {
  productPrice: number;
  productPriceCurrency: string;
  fromCountry: string;
  toCountry: string;
}) => {
  const itemCurrencyCountry = currenciesToCountryCode(
    productPriceCurrency as CurrencyType,
  );

  /**
   * Exchange rate:
   * itemCurrencyCountry -> destination country
   */

  let exchangeRateToDestination;
  let exchangeRateDestError;

  const sourceCountries = await getSourceCountries();

  console.log({ toCountry, sourceCountries });

  if (sourceCountries.find((sc) => sc.code === toCountry)) {
    console.log("Fetch from correct");

    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", itemCurrencyCountry)
      .eq("to_country", toCountry)
      .eq("is_active", true)
      .limit(1)
      .single();

    exchangeRateToDestination = data;
    exchangeRateDestError = error;
  } else {
    console.log("Fetch from USD");

    const { data, error } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", itemCurrencyCountry)
      .eq("to_country", "US")
      .eq("is_active", true)
      .limit(1)
      .single();

    exchangeRateToDestination = data;

    exchangeRateDestError = error;
  }

  /**
   * Exchange rate:
   * itemCurrencyCountry -> source country
   */

  const { data: exchangeRateToSource, error: exchangeRateSourceError } =
    await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", itemCurrencyCountry)
      .eq("to_country", fromCountry)
      .eq("is_active", true)
      .limit(1)
      .single();

  if (exchangeRateDestError || exchangeRateSourceError) {
    throw new Error("Failed to fetch handling charge data");
  }

  console.log({ test: productPrice * exchangeRateToDestination?.rate });

  return {
    sourceCountryPrice: productPrice * exchangeRateToSource.rate,
    destinationCountryPrice:
      productPrice * (exchangeRateToDestination?.rate || 1),
  };
};

export const convertCurrencyByCountryCode = async ({
  amount,
  sourceCountryCode,
  destinationCountryCode,
}: {

  amount: number | null;
  sourceCountryCode: string;
  destinationCountryCode: string;
}) => {
  const sourceCountries = await getSourceCountries();

  if (!sourceCountries.find((sc) => sc.code === destinationCountryCode)) {
    destinationCountryCode = "US";
  }

  try {
    const {data, error} = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("from_country", sourceCountryCode)
      .eq("to_country", destinationCountryCode)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (error) {
      throw new Error("Failed to fetch exchange rate");
    }

    if(!amount) {
      return data.rate;
    }

    return data.rate * amount;
  } catch (error) {
    console.error("Error converting currency:", error);
    return 0;
  }
};