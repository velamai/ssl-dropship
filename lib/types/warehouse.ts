export interface Warehouse {
  country_code: string;
  warehouse_id: string;
  name: string | null;
  address_line1: string;
  address_line2: string | null;
  address_line3: string | null;
  address_line4: string | null;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehouseData {
  name?: string;
  address_line1: string;
  address_line2?: string;
  address_line3?: string;
  address_line4?: string;
  postal_code: string;
  country: string;
}

export interface UpdateWarehouseData extends Partial<CreateWarehouseData> {
  warehouse_id: string;
}
