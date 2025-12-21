/**
 * Type definitions for shipment-related components
 */

export type Warehouse = {
  name: string;
  country: string;
  postal_code: string;
  address_line1: string;
  address_line2?: string;
  address_line3?: string;
  address_line4?: string;
};

export interface Shipment {
  system_tracking_id: string | null;
  drop_and_ship_add_ons: string[];
  idx: number;
  shipment_id: string;
  user_id: string;
  current_status: string;
  current_status_updated_at: string;
  status_timeline: string; // JSON string of status history
  source: string;
  shipment_type: string;
  shipment_country_code: string;
  shipment_total_weight: number;

  // Price and totals
  shipment_weight_price: string;
  shipment_dimentional_price: string;
  shipment_price: string;
  grand_total: string;

  // Package details
  package_type: string;
  package_length: number;
  package_width: number;
  package_height: number;
  package_volume: string;

  // Receiver info
  receiver_first_name: string;
  receiver_last_name: string;
  receiver_company: string;
  receiver_tax: string;
  receiver_phone: string;
  receiver_email: string;
  receiver_address_line1: string;
  receiver_address_line2: string;
  receiver_address_line3: string;
  receiver_address_line4: string;
  receiver_postal_code: string;
  receiver_phone_code: string;

  // Drop and Ship
  drop_and_ship_product_invoice_url: string; // JSON string of URLs
  drop_and_ship_warehouse_id: string;
  drop_and_ship_note: string;
  drop_and_ship_expected_receiving_date: string;
  drop_and_ship_order_id: string;
  drop_and_ship_order_type: string;
  drop_and_ship_purchase_date: string | null;
  drop_and_ship_purchase_site: string | null;

  // Meta
  created_at: string;
  updated_at: string;

  // Optional / Nullable fields
  order_id?: string | null;
  price_details_quantity?: number;
  price_details_tracking_id?: string | null;
  price_details_other_charges?: string | null;
  price_details_packing_charges?: string | null;
  price_details_arrears_amount?: string | null;
  price_details_tax?: string | null;
  price_details_discount?: string | null;
  price_details_advance_paid?: string | null;

  confirmed_invoice_id?: string | null;
  confirmed_invoice_url?: string | null;

  payment_method?: string | null;
  payment_information?: string | null;
  payment_remarks?: string | null;
  payment_approved_by?: string | null;
  payment_proof_url?: string | null;
  payment_proof_status?: string | null;
  payment_proof_submitted_at?: string | null;
  payment_proof_approved_at?: string | null;
  payment_proof_rejection_reason?: string | null;
  payment_charges?: string | null;
  payment_id?: string | null;
  paid_at?: string | null;
  payment_details?: string | null;

  ecommerce_order_total_price?: string | null;
  ecommerce_order_id?: string | null;
  ecommerce_shipment_cost?: string | null;
  ecommerce_regular_price?: string | null;
  ecommerce_sales_price?: string | null;
  ecommerce_total_price?: string | null;
  ecommerce_payment_status?: string | null;

  drop_and_ship_warehouse_address?: Warehouse | null;
  total_price: number | null;
  total_quantity: number | null;

  // Product Payment fields
  drop_and_ship_product_images_admin?: string | null;
  drop_and_ship_product_invoice_url_admin?: string | null;
  drop_and_ship_product_invoice_id_admin?: string | null;
  drop_and_ship_product_payment_method?: string | null;
  drop_and_ship_product_payment_information?: string | null;
  drop_and_ship_product_payment_remarks?: string | null;
  drop_and_ship_product_payment_approved_by?: string | null;
  drop_and_ship_product_payment_proof_status?: string | null;
  drop_and_ship_product_payment_proof_submitted_at?: string | null;
  drop_and_ship_product_payment_proof_approved_at?: string | null;
  drop_and_ship_product_payment_proof_rejection_reason?: string | null;
  drop_and_ship_product_payment_charges?: string | null;
  drop_and_ship_product_payment_id?: string | null;
  drop_and_ship_product_paid_at?: string | null;
  drop_and_ship_product_payment_details?: string | null;
  drop_and_ship_product_payment_status?: string | null;
  drop_and_ship_product_payment_proof_url?: string | null;
}

export type ShipmentItem = {
  shipment_item_id: number;
  shipment_id: string;
  source: string;
  description: string;
  purpose: string;
  declared_value: number;
  name: string;
  image_urls: string; // This seems like a JSON string of array
  total_price: string;
  quantity: number;
  product_price: string | null;
  product_id: string | null;
  drop_and_ship_product_url: string;
};

export interface BankDetail {
  id: string;
  account_number: string;
  account_name: string;
  ifsc_code: string;
  bank_name: string;
}

export interface TrackingEvent {
  status: string;
  updated_at: string;
  description: string;
}

export interface PaymentCardProps {
  shipment: Shipment;
  onPaymentUpdate: () => void;
}

export interface ProductPaymentCardProps {
  shipment: Shipment;
  items: ShipmentItem[];
  onPaymentUpdate: () => void;
}

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}
