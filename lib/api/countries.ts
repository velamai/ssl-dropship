import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();

export interface Country {
  code: string;
  name: string;
}

export const countriesApi = {
  // Get all countries from countries table
  async getCountries(): Promise<Country[]> {
    const { data, error } = await supabase
      .from("drop_and_ship_receiving_countries")
      .select("code, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching countries:", error);
      throw new Error(`Failed to fetch countries: ${error.message}`);
    }

    return data || [];
  },
};
