import type { CourierService, Currency } from "./price-calculator";
import { getSupabaseBrowserClient } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ApiResponse<T = any> = {
  status: "success" | "error";
  data?: T;
  error?: string;
  message?: string;
};

// Enhanced error interface to properly type API errors
export interface ApiError extends Error {
  response?: {
    status: number;
    data: {
      status: string;
      error?: string;
      message?: string;
    };
  };
  isAxiosError?: boolean;
}

export type UserType = "ecommerce" | "logistics" | "dropship";

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  usertype: UserType;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OtpPayload {
  identifier: string;
  type: "EMAIL" | "PHONE";
}

export interface VerifyOtpPayload extends OtpPayload {
  otp: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Get the current origin
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";

      // Log the request details
      console.log("API Request:", {
        url: `${API_URL}${endpoint}`,
        method: options.method,
        origin,
      });

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: origin,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          ...options.headers,
        },
      });

      // Parse response JSON first, regardless of status code
      const data = await response.json();

      // Log the complete response for debugging
      console.log("API Response:", {
        url: `${API_URL}${endpoint}`,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      });

      // If response is not ok, throw an error with the parsed error data
      if (!response.ok) {
        const error = new Error() as ApiError;
        error.response = {
          status: response.status,
          data: {
            status: "error",
            error: data.error || data.message,
            message: data.message || data.error,
          },
        };
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Request Error:", {
        error,
        endpoint,
        options,
      });

      // If error has response data, return it
      const apiError = error as ApiError;
      if (apiError.response?.data) {
        return {
          status: "error" as const,
          error: apiError.response.data.error,
          message: apiError.response.data.message,
        };
      }

      // For network or parsing errors, return a generic error
      return {
        status: "error" as const,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        message:
          "Failed to connect to the server. Please check your connection and try again.",
      };
    }
  }

  async register(payload: RegisterPayload) {
    console.log("Registering user:", payload);
    return this.request("/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async login(payload: LoginPayload) {
    return this.request("/signin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async sendOtp(payload: OtpPayload) {
    return this.request("/send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async verifyOtp(payload: VerifyOtpPayload) {
    return this.request("/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export const apiClient = new ApiClient();

const supabase = getSupabaseBrowserClient();

// Get the Supabase URL from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-shipment`;

// Helper function to generate a valid UUID v4
function generateUUID() {
  // This implementation follows RFC4122 version 4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createShipments(shipmentData: any) {
  try {
    // Process each shipment to ensure proper UUID format for product IDs
    const processedShipments = shipmentData.map((shipment: any) => {
      // Create a copy of the shipment data
      const processedShipment = { ...shipment };

      // Process items to ensure proper UUID format for product_id
      if (processedShipment.items && Array.isArray(processedShipment.items)) {
        processedShipment.items = processedShipment.items.map((item: any) => ({
          ...item,
          // Add a UUID field that will be used as product_id on the server
          uuid: generateUUID(),
        }));
      }

      return processedShipment;
    });

    // Get the current session for authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    // Make the request to the Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ shipments: processedShipments }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Failed with status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating shipments:", error);
    throw error;
  }
}

// Function to fetch countries from the database
export async function fetchCountries() {
  try {
    // First, let's get the column names from the first row
    const { data: columnData, error: columnError } = await supabase
      .from("countries")
      .select("*")
      .limit(1);

    console.log("[Data Fetch] Countries column data:", columnData);

    if (columnError) throw columnError;

    // Determine the correct column names for code and name
    let codeColumn = "country_code";
    let nameColumn = "name";

    if (columnData && columnData.length > 0) {
      const columns = Object.keys(columnData[0]);

      // Find the most likely column names
      if (!columns.includes("country_code") && columns.includes("code")) {
        codeColumn = "code";
      } else if (!columns.includes("country_code") && columns.includes("id")) {
        codeColumn = "id";
      }

      if (!columns.includes("country_name") && columns.includes("name")) {
        nameColumn = "name";
      } else if (
        !columns.includes("country_name") &&
        columns.includes("title")
      ) {
        nameColumn = "title";
      }
    }

    // Now fetch all countries with the correct column ordering
    const { data, error } = await supabase
      .from("countries")
      .select(`${codeColumn}, ${nameColumn}`)
      .order(nameColumn);

    if (error) throw error;

    // Map the data to the expected format
    const formattedData = data.map((country: any) => ({
      code: country[codeColumn],
      name: country[nameColumn],
    }));

    return formattedData || [];
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Return some default countries as fallback
    return [
      { code: "us", name: "United States" },
      { code: "ca", name: "Canada" },
      { code: "uk", name: "United Kingdom" },
      { code: "au", name: "Australia" },
    ];
  }
}

export async function fetchCountriesByType(type?: "import" | "export") {
  try {
    let tableName: string;
    
    // Determine which table to query based on type
    if (type === "export") {
      tableName = "logistics_export_countries";
    } else if (type === "import") {
      tableName = "logistics_import_countries";
    } else {
      // Default to export if no type specified (for backward compatibility)
      tableName = "logistics_export_countries";
    }

    // First, let's get the column names from the first row
    const { data: columnData, error: columnError } = await supabase
      .from(tableName)
      .select("*")
      .limit(1);

    if (columnError) throw columnError;

    // Determine the correct column names for code and name
    let codeColumn = "country_code";
    let nameColumn = "name";

    if (columnData && columnData.length > 0) {
      const columns = Object.keys(columnData[0]);

      // Find the most likely column names
      if (!columns.includes("country_code") && columns.includes("code")) {
        codeColumn = "code";
      } else if (!columns.includes("country_code") && columns.includes("id")) {
        codeColumn = "id";
      }

      if (!columns.includes("country_name") && columns.includes("name")) {
        nameColumn = "name";
      } else if (
        !columns.includes("country_name") &&
        columns.includes("title")
      ) {
        nameColumn = "title";
      }
    }

    // Now fetch all countries with the correct column ordering
    const { data, error } = await supabase
      .from(tableName)
      .select(`${codeColumn}, ${nameColumn}`)
      .order(nameColumn);

    if (error) throw error;

    // Map the data to the expected format
    const formattedData = data.map((country: any) => ({
      code: country[codeColumn],
      name: country[nameColumn],
    }));

    return formattedData || [];
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Return some default countries as fallback
    return [
      { code: "us", name: "United States" },
      { code: "ca", name: "Canada" },
      { code: "uk", name: "United Kingdom" },
      { code: "au", name: "Australia" },
    ];
  }
}

// Function to fetch courier services from the database
export async function fetchCourierServices(): Promise<CourierService[]> {
  try {
    // Fetch courier services with all their data
    const { data, error } = await supabase.from("courier_services").select("*");

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching courier services:", error);
    // Return some default courier services as fallback
    return [
      {
        courier_service_id: "fedex",
        name: "FedEx",
        type: "export",
        min_weight: 0.5,
        max_weight: 30,
        adding_value: 0.5,
        countries: [
          { code: "us", name: "United States", zone: 1 },
          { code: "ca", name: "Canada", zone: 1 },
          { code: "uk", name: "United Kingdom", zone: 2 },
          { code: "au", name: "Australia", zone: 3 },
        ],
        rates: {
          zone1: [
            { weight: 1, price: 20 },
            { weight: 5, price: 40 },
            { weight: 10, price: 60 },
            { weight: 30, price: 120 },
          ],
          zone2: [
            { weight: 1, price: 30 },
            { weight: 5, price: 60 },
            { weight: 10, price: 90 },
            { weight: 30, price: 180 },
          ],
          zone3: [
            { weight: 1, price: 40 },
            { weight: 5, price: 80 },
            { weight: 10, price: 120 },
            { weight: 30, price: 240 },
          ],
        },
      },
      {
        courier_service_id: "dhl",
        name: "DHL",
        type: "export",
        min_weight: 1,
        max_weight: 50,
        adding_value: 1,
        countries: [
          { code: "us", name: "United States", zone: 1 },
          { code: "ca", name: "Canada", zone: 1 },
          { code: "uk", name: "United Kingdom", zone: 2 },
          { code: "au", name: "Australia", zone: 3 },
        ],
        rates: {
          zone1: [
            { weight: 1, price: 25 },
            { weight: 5, price: 45 },
            { weight: 10, price: 65 },
            { weight: 50, price: 150 },
          ],
          zone2: [
            { weight: 1, price: 35 },
            { weight: 5, price: 65 },
            { weight: 10, price: 95 },
            { weight: 50, price: 200 },
          ],
          zone3: [
            { weight: 1, price: 45 },
            { weight: 5, price: 85 },
            { weight: 10, price: 125 },
            { weight: 50, price: 250 },
          ],
        },
      },
      {
        courier_service_id: "ups",
        name: "UPS",
        type: "import",
        min_weight: 0.5,
        max_weight: 40,
        adding_value: 0.5,
        countries: [
          { code: "us", name: "United States", zone: 1 },
          { code: "ca", name: "Canada", zone: 1 },
          { code: "uk", name: "United Kingdom", zone: 2 },
          { code: "au", name: "Australia", zone: 3 },
        ],
        rates: {
          zone1: [
            { weight: 1, price: 22 },
            { weight: 5, price: 42 },
            { weight: 10, price: 62 },
            { weight: 40, price: 140 },
          ],
          zone2: [
            { weight: 1, price: 32 },
            { weight: 5, price: 62 },
            { weight: 10, price: 92 },
            { weight: 40, price: 190 },
          ],
          zone3: [
            { weight: 1, price: 42 },
            { weight: 5, price: 82 },
            { weight: 10, price: 122 },
            { weight: 40, price: 240 },
          ],
        },
      },
    ];
  }
}

// Function to fetch currencies from the database
export async function fetchCurrencies(): Promise<Currency[]> {
  try {
    const { data, error } = await supabase
      .from("exchange_currencies")
      .select("*");

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching currencies:", error);
    // Return some default currencies as fallback
    return [
      {
        exchange_currency_id: "3302e366-89b9-487b-b8ce-b598d21be29d", // Volume currency ID
        name: "USD",
        currency_code: "USD",
        value: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        exchange_currency_id: "fedex-currency",
        name: "EUR",
        currency_code: "EUR",
        value: 0.85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        exchange_currency_id: "dhl-currency",
        name: "GBP",
        currency_code: "GBP",
        value: 0.75,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }
}


// Function to fetch courier services from the database
export async function fetchCourierServicesByType(type?: "import" | "export"): Promise<CourierService[]> {
  try {
    // Fetch courier services with all their data, filtering out soft-deleted ones
    let query = supabase
      .from("courier_services")
      .select("*")
      .is("deleted_at", null);

    // Optionally filter by type if provided
    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching courier services:", error);
    // Return some default courier services as fallback
    return [
      {
        courier_service_id: "fedex",
        name: "FedEx",
        type: "export",
        min_weight: 0.5,
        max_weight: 30,
        adding_value: 0.5,
        countries: [
          { code: "us", name: "United States", zone: 1 },
          { code: "ca", name: "Canada", zone: 1 },
          { code: "uk", name: "United Kingdom", zone: 2 },
          { code: "au", name: "Australia", zone: 3 },
        ],
        rates: {
          zone1: [
            { weight: 1, price: 20 },
            { weight: 5, price: 40 },
            { weight: 10, price: 60 },
            { weight: 30, price: 120 },
          ],
          zone2: [
            { weight: 1, price: 30 },
            { weight: 5, price: 60 },
            { weight: 10, price: 90 },
            { weight: 30, price: 180 },
          ],
          zone3: [
            { weight: 1, price: 40 },
            { weight: 5, price: 80 },
            { weight: 10, price: 120 },
            { weight: 30, price: 240 },
          ],
        },
      },
      {
        courier_service_id: "dhl",
        name: "DHL",
        type: "export",
        min_weight: 1,
        max_weight: 50,
        adding_value: 1,
        countries: [
          { code: "us", name: "United States", zone: 1 },
          { code: "ca", name: "Canada", zone: 1 },
          { code: "uk", name: "United Kingdom", zone: 2 },
          { code: "au", name: "Australia", zone: 3 },
        ],
        rates: {
          zone1: [
            { weight: 1, price: 25 },
            { weight: 5, price: 45 },
            { weight: 10, price: 65 },
            { weight: 50, price: 150 },
          ],
          zone2: [
            { weight: 1, price: 35 },
            { weight: 5, price: 65 },
            { weight: 10, price: 95 },
            { weight: 50, price: 200 },
          ],
          zone3: [
            { weight: 1, price: 45 },
            { weight: 5, price: 85 },
            { weight: 10, price: 125 },
            { weight: 50, price: 250 },
          ],
        },
      },
      {
        courier_service_id: "ups",
        name: "UPS",
        type: "import",
        min_weight: 0.5,
        max_weight: 40,
        adding_value: 0.5,
        countries: [
          { code: "us", name: "United States", zone: 1 },
          { code: "ca", name: "Canada", zone: 1 },
          { code: "uk", name: "United Kingdom", zone: 2 },
          { code: "au", name: "Australia", zone: 3 },
        ],
        rates: {
          zone1: [
            { weight: 1, price: 22 },
            { weight: 5, price: 42 },
            { weight: 10, price: 62 },
            { weight: 40, price: 140 },
          ],
          zone2: [
            { weight: 1, price: 32 },
            { weight: 5, price: 62 },
            { weight: 10, price: 92 },
            { weight: 40, price: 190 },
          ],
          zone3: [
            { weight: 1, price: 42 },
            { weight: 5, price: 82 },
            { weight: 10, price: 122 },
            { weight: 40, price: 240 },
          ],
        },
      },
    ];
  }
}