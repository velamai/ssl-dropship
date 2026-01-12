import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();

export interface SourceCountry {
  code: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export const sourceCountriesApi = {
  // Get all source countries from drop_and_ship_source_countries table
  async getSourceCountries(): Promise<SourceCountry[]> {
    const { data, error } = await supabase
      .from("drop_and_ship_source_countries")
      .select("code, name, created_at, updated_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching source countries:", error);
      throw new Error(`Failed to fetch source countries: ${error.message}`);
    }

    return data || [];
  },
};
