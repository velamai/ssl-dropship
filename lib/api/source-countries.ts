import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();

export interface SourceCountry {
  code: string;
  name: string;
  currency?: string; // Currency code (e.g., "INR", "AED", "USD")
  domestic_courier_charge?: number; // Percentage value (e.g., 5 for 5%)
  warehouse_handling_charges?: number; // Percentage value (e.g., 10 for 10%)
  created_at?: string;
  updated_at?: string;
}

export const sourceCountriesApi = {
  // Get all source countries from drop_and_ship_source_countries table
  async getSourceCountries(): Promise<SourceCountry[]> {
    const { data, error } = await supabase
      .from("drop_and_ship_source_countries")
      .select(
        "code, name, currency, domestic_courier_charge, warehouse_handling_charges, created_at, updated_at"
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching source countries:", error);
      throw new Error(`Failed to fetch source countries: ${error.message}`);
    }

    return data || [];
  },
};
