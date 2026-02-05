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

export interface CreateAddressPayload {
  address_line1: string;
  address_line2?: string | null;
  address_line3?: string | null;
  address_line4?: string | null;
  pincode?: string | null;
  country: string;
  code: string;
  is_primary?: boolean;
}

export interface UpdateAddressPayload {
  address_line1?: string;
  address_line2?: string | null;
  address_line3?: string | null;
  address_line4?: string | null;
  pincode?: string | null;
  country?: string;
  code?: string;
  is_primary?: boolean;
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

  async createAddress(
    userId: string,
    payload: CreateAddressPayload
  ): Promise<UserAddress> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (payload.is_primary) {
      await supabase
        .from("user_addresses")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    const { data, error } = await supabase
      .from("user_addresses")
      .insert({
        user_id: userId,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2 ?? null,
        address_line3: payload.address_line3 ?? null,
        address_line4: payload.address_line4 ?? null,
        pincode: payload.pincode ?? null,
        country: payload.country,
        code: payload.code,
        is_primary: payload.is_primary ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create address: ${error.message}`);
    }

    return data;
  },

  async updateAddress(
    userId: string,
    addressId: string,
    payload: UpdateAddressPayload
  ): Promise<UserAddress> {
    if (!userId || !addressId) {
      throw new Error("User ID and address ID are required");
    }

    if (payload.is_primary === true) {
      await supabase
        .from("user_addresses")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.address_line1 !== undefined) updateData.address_line1 = payload.address_line1;
    if (payload.address_line2 !== undefined) updateData.address_line2 = payload.address_line2;
    if (payload.address_line3 !== undefined) updateData.address_line3 = payload.address_line3;
    if (payload.address_line4 !== undefined) updateData.address_line4 = payload.address_line4;
    if (payload.pincode !== undefined) updateData.pincode = payload.pincode;
    if (payload.country !== undefined) updateData.country = payload.country;
    if (payload.code !== undefined) updateData.code = payload.code;
    if (payload.is_primary !== undefined) updateData.is_primary = payload.is_primary;

    const { data, error } = await supabase
      .from("user_addresses")
      .update(updateData)
      .eq("user_address_id", addressId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }

    return data;
  },

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    if (!userId || !addressId) {
      throw new Error("User ID and address ID are required");
    }

    const { error } = await supabase
      .from("user_addresses")
      .delete()
      .eq("user_address_id", addressId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
  },

  async setPrimaryAddress(
    userId: string,
    addressId: string
  ): Promise<UserAddress> {
    if (!userId || !addressId) {
      throw new Error("User ID and address ID are required");
    }

    await supabase
      .from("user_addresses")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    const { data, error } = await supabase
      .from("user_addresses")
      .update({
        is_primary: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_address_id", addressId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set primary address: ${error.message}`);
    }

    return data;
  },
};
