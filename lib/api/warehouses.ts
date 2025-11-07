import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  Warehouse,
  CreateWarehouseData,
  UpdateWarehouseData,
} from "@/lib/types/warehouse";

const supabase = getSupabaseBrowserClient();

export const warehouseApi = {
  // Get all warehouses
  async getWarehouses(
    userId: string
  ): Promise<{ data: Warehouse[]; userWarehouseId: string }> {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_warehouse_id")
      .eq("user_id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    if (!userData) {
      console.error("User not found");
      throw new Error("User not found");
    }

    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching warehouses:", error);
      throw new Error(`Failed to fetch warehouses: ${error.message}`);
    }

    return { data: data || [], userWarehouseId: userData.user_warehouse_id };
  },

  // Get a single warehouse by ID
  async getWarehouse(id: string): Promise<Warehouse> {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("warehouse_id", id)
      .single();

    if (error) {
      console.error("Error fetching warehouse:", error);
      throw new Error(`Failed to fetch warehouse: ${error.message}`);
    }

    return data;
  },

  // Create a new warehouse
  async createWarehouse(
    warehouseData: CreateWarehouseData
  ): Promise<Warehouse> {
    const { data, error } = await supabase
      .from("warehouses")
      .insert([warehouseData])
      .select()
      .single();

    if (error) {
      console.error("Error creating warehouse:", error);
      throw new Error(`Failed to create warehouse: ${error.message}`);
    }

    return data;
  },

  // Update a warehouse
  async updateWarehouse(
    warehouseData: UpdateWarehouseData
  ): Promise<Warehouse> {
    const { warehouse_id, ...updateData } = warehouseData;

    const { data, error } = await supabase
      .from("warehouses")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("warehouse_id", warehouse_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating warehouse:", error);
      throw new Error(`Failed to update warehouse: ${error.message}`);
    }

    return data;
  },

  // Delete a warehouse
  async deleteWarehouse(id: string): Promise<void> {
    const { error } = await supabase
      .from("warehouses")
      .delete()
      .eq("warehouse_id", id);

    if (error) {
      console.error("Error deleting warehouse:", error);
      throw new Error(`Failed to delete warehouse: ${error.message}`);
    }
  },
};
