import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();

export interface UserAddress {
  user_address_id: string;
  user_id: string;
  address_line1: string;
  address_line2: string | null;
  address_line3: string | null;
  address_line4: string | null;
  pincode: string | null;
  country: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  code: string;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_country_code: string;
  phone_number: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_identity_verified: boolean;
}

export const userAddressApi = {
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user addresses: ${error.message}`);
    }

    return data || [];
  },

  async getPrimaryAddress(userId: string): Promise<UserAddress | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows found" which is acceptable
      throw new Error(`Failed to fetch primary address: ${error.message}`);
    }

    return data || null;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const { data, error } = await supabase
      .from("users")
      .select(
        "user_id, first_name, last_name, email, phone_country_code, phone_number, is_email_verified, is_phone_verified, is_identity_verified"
      )
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data || null;
  },
};
