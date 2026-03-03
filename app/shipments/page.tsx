"use client";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  MapPin,
  Package,
  ShoppingBag,
  User,
  Warehouse,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { CountryFlag } from "@/components/country-flag";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/shipments/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getCountryCode } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/currency";
import Link from "next/link";

// Get the singleton instance
const supabase = getSupabaseBrowserClient();

// Define the shipment type based on your database schema
interface Shipment {
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

  drop_and_ship_warehouse_address?: { name: string | null } | null;
  total_price: number | null;
  total_quantity: number | null;

  // Currency fields
  source_currency_code?: string | null;
  destination_currency_code?: string | null;
  exchange_rate_source_to_inr?: number | null;
  exchange_rate_destination_to_inr?: number | null;
}

type ShipmentWithRelations = Shipment & {
  warehouse: {
    name: string;
  } | null;
  shipment_items: {
    total_price: number | null;
    quantity: number | null;
  }[];
};

interface WarehouseWithPackageCount {
  warehouse_id: string;
  name: string | null;
  country_code: string;
  country: string;
  address_line1: string;
  address_line2: string | null;
  address_line3: string | null;
  address_line4: string | null;
  postal_code: string;
  phone: string[];
  packageCount: number;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentWithRelations[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<
    ShipmentWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [warehousesWithCounts, setWarehousesWithCounts] = useState<
    WarehouseWithPackageCount[]
  >([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [selectedWarehouseCountryCode, setSelectedWarehouseCountryCode] =
    useState<string | null>(null);
  const [selectedWarehouseName, setSelectedWarehouseName] = useState<
    string | null
  >(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { data: warehousesData, isLoading: warehousesDataLoading } =
    useWarehouses();

  console.log("[Shipments Page] Initial user state:", user);

  // Fetch warehouse info when warehouse query parameter is present
  useEffect(() => {
    const warehouseId = searchParams.get("warehouse");
    if (!warehouseId || !user?.id) {
      setSelectedWarehouseCountryCode(null);
      setSelectedWarehouseName(null);
      return;
    }

    async function fetchWarehouseInfo() {
      try {
        const { data, error } = await supabase
          .from("warehouses")
          .select("country_code, name")
          .eq("warehouse_id", warehouseId)
          .single();

        if (error) throw error;

        if (data) {
          setSelectedWarehouseCountryCode(data.country_code);
          setSelectedWarehouseName(data.name);
          // Reset to first page when warehouse filter changes
          setCurrentPage(1);
        }
      } catch (error: any) {
        console.error("Failed to fetch warehouse info:", error);
        toast.error("Failed to load warehouse information", {
          description: error.message || "Please try again.",
        });
        setSelectedWarehouseCountryCode(null);
        setSelectedWarehouseName(null);
      }
    }

    fetchWarehouseInfo();
  }, [searchParams, user?.id]);

  // Load warehouses with package counts
  useEffect(() => {
    if (!user?.id || warehousesDataLoading || !warehousesData?.data) {
      if (!warehousesDataLoading) {
        setWarehousesLoading(false);
      }
      return;
    }

    const userId = user.id;
    const warehouses = warehousesData.data;

    async function loadWarehousesWithCounts() {
      setWarehousesLoading(true);
      try {
        const warehousesWithPackageCounts = await Promise.all(
          warehouses.map(async (warehouse) => {
            // Count packages at this warehouse
            const { count, error } = await supabase
              .from("shipments")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("drop_and_ship_warehouse_id", warehouse.warehouse_id)
              .not("drop_and_ship_order_id", "is", null);

            if (error) {
              console.error(
                `Error counting packages for warehouse ${warehouse.warehouse_id}:`,
                error,
              );
            }

            return {
              ...warehouse,
              packageCount: count || 0,
            };
          }),
        );

        setWarehousesWithCounts(warehousesWithPackageCounts);
      } catch (error: any) {
        console.error("Failed to load warehouses:", error);
        toast.error("Failed to load warehouses", {
          description: error.message || "Please try again.",
        });
      } finally {
        setWarehousesLoading(false);
      }
    }

    loadWarehousesWithCounts();
  }, [user?.id, warehousesData, warehousesDataLoading]);

  // Helper function to get courier name

  // Load shipments with item counts
  useEffect(() => {
    console.log("[Shipments Page] User state in useEffect:", user?.id);

    // Guard clause: don't proceed if user is not loaded
    if (!user || !user.id) {
      console.log("[Shipments Page] No user found, skipping shipment load");
      setLoading(false);
      return;
    }

    // Use a ref to track the current user ID to prevent unnecessary reloads
    const userId = user.id;

    async function loadShipments() {
      setLoading(true);
      try {
        let query = supabase
          .from("shipments")
          .select("*", { count: "estimated" })
          .eq("user_id", userId)
          .not("drop_and_ship_order_id", "is", null)
          .order("created_at", { ascending: false });

        // Filter by warehouse country code if warehouse is selected
        if (selectedWarehouseCountryCode) {
          query = query
            .eq("shipment_country_code", selectedWarehouseCountryCode)
            .eq("source", "drop_and_ship");
        }

        // Apply search filter at database level when warehouse is selected
        if (searchTerm.trim() && selectedWarehouseCountryCode) {
          // When warehouse is selected, search within that warehouse's shipments
          const searchPattern = `%${searchTerm.toLowerCase()}%`;
          query = query.or(
            `shipment_id.ilike.${searchPattern},drop_and_ship_order_id.ilike.${searchPattern},receiver_first_name.ilike.${searchPattern},receiver_last_name.ilike.${searchPattern},receiver_postal_code.ilike.${searchPattern},receiver_address_line1.ilike.${searchPattern}`,
          );
        }

        if (statusFilter !== "all") {
          query = query.eq("current_status", statusFilter);
        }

        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        if (count !== null) {
          setTotalCount(count);
        }

        // Process shipments with courier names
        const shipmentsWithExtras: ShipmentWithRelations[] = await Promise.all(
          (data || []).map(async (shipment) => {
            // Get item count
            const { data: itemData } = await supabase
              .from("shipment_items")
              .select("total_price, quantity") // Use head: true for count only
              .eq("shipment_id", shipment.shipment_id);

            return {
              ...shipment,
              total_price:
                itemData?.reduce(
                  (acc, item) => acc + (item.total_price || 0),
                  0,
                ) || 0,
              total_quantity:
                itemData?.reduce(
                  (acc, item) => acc + (item.quantity || 0),
                  0,
                ) || 0,
            };
          }),
        );
        console.log({ shipmentsWithExtras });

        setShipments(shipmentsWithExtras || []);
      } catch (error: any) {
        // Catch error as any for broader compatibility
        console.error("Failed to load shipments:", error);
        // Correct usage of sonner toast for error
        toast.error("Failed to load shipments", {
          description: error.message || "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadShipments();
    // Use user.id instead of user object to prevent reloads on token refresh
  }, [
    user?.id,
    statusFilter,
    currentPage,
    itemsPerPage,
    selectedWarehouseCountryCode,
    searchTerm, // Added searchTerm to reload when searching with warehouse filter
  ]);

  // Filter shipments based on search term (only when no warehouse filter is active)
  useEffect(() => {
    // If warehouse filter is active, search is handled at database level
    if (selectedWarehouseCountryCode) {
      setFilteredShipments(shipments);
      return;
    }

    // Client-side filtering for all warehouses view
    if (!searchTerm.trim()) {
      setFilteredShipments(shipments);
      return;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = shipments.filter(
      (shipment) =>
        shipment.shipment_id.toLowerCase().includes(lowerCaseSearch) ||
        shipment.drop_and_ship_order_id
          ?.toLowerCase()
          .includes(lowerCaseSearch) ||
        `${shipment.receiver_first_name} ${shipment.receiver_last_name}`
          .toLowerCase()
          .includes(lowerCaseSearch) ||
        (shipment.receiver_postal_code &&
          shipment.receiver_postal_code
            .toLowerCase()
            .includes(lowerCaseSearch)) ||
        (shipment.receiver_address_line1 &&
          shipment.receiver_address_line1
            .toLowerCase()
            .includes(lowerCaseSearch)),
    );

    setFilteredShipments(filtered);
  }, [searchTerm, shipments, selectedWarehouseCountryCode]);

  const handleCardClick = (shipmentId: string) => {
    router.push(`/shipments/${shipmentId}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Add event type
    setSearchTerm(e.target.value);
    // Reset to first page when searching
    setCurrentPage(1);
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, identifier: string) => {
    if (text === "") return;
    navigator.clipboard.writeText(text);
    setCopiedAddress(identifier);

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedAddress(null);
    }, 2000);
  };

  const handleStatusChange = (value: string) => {
    // Add value type (assuming string from Select)
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage * itemsPerPage < totalCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Helper function to format destination from address
  const formatDestination = (shipment: ShipmentWithRelations): string => {
    // Add parameter type and return type
    const parts = [];
    if (shipment.receiver_postal_code)
      parts.push(shipment.receiver_postal_code);
    if (shipment.shipment_country_code)
      parts.push(shipment.shipment_country_code.toUpperCase());

    return parts.join(", ") || "Unknown location";
  };

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined): string => {
    // Add parameter type and return type
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        // Add options for clarity
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };

  // Helper function to get recipient full name
  const getRecipientName = (shipment: ShipmentWithRelations): string => {
    // Add parameter type and return type
    return (
      `${shipment.receiver_first_name || ""} ${
        shipment.receiver_last_name || ""
      }`.trim() || "Unknown recipient"
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar activePage="shipments" />
        <main className="flex-1 p-4 md:p-6">
          <div className="md:container">
            {/* Header Placeholder */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="h-7 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
            </div>

            {/* Filters Placeholder */}
            <Card className="mb-6 border-gray-200 shadow-sm bg-white animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="h-10 bg-gray-200 rounded w-full md:w-1/2 lg:w-2/5"></div>
                  <div className="h-10 bg-gray-200 rounded w-full md:w-1/3 md:max-w-[200px]"></div>
                </div>
              </CardContent>
            </Card>

            {/* Skeleton Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <ShipmentCardSkeleton key={index} />
              ))}
            </div>

            {/* Pagination Placeholder */}
            <div className="mt-4 flex items-center justify-between animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-20 bg-gray-200 rounded"></div>
                <div className="h-9 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar activePage="shipments" />

      <main className="flex-1 p-4 md:p-6">
        <div className="md:container">
          {/* Locations Section - Only show when no warehouse filter is active */}
          {!selectedWarehouseCountryCode && (
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold tracking-tight text-dark">
                    Warehouse Locations
                  </h2>
                </div>

                {!selectedWarehouseCountryCode && (
                  <div className="mb-8 flex justify-end">
                    <Link href="/create-shipments?service=link">
                      <Button className="gap-2">Create Orders</Button>
                    </Link>
                  </div>
                )}
              </div>

              {warehousesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2].map((i) => (
                    <Card
                      key={i}
                      className="border-text-subtle/20 shadow-sm bg-white animate-pulse"
                    >
                      <CardHeader className="pb-3 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                          <div className="h-5 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-48 mt-2"></div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-40"></div>
                        <div className="h-3 bg-gray-200 rounded w-36"></div>
                        <div className="h-3 bg-gray-200 rounded w-28"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-36"></div>
                        <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : warehousesWithCounts.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {warehousesWithCounts.map((warehouse) => {
                    const countryCode =
                      warehouse.country_code?.length === 2
                        ? warehouse.country_code.toUpperCase()
                        : getCountryCode(warehouse.country);
                    const countryName =
                      warehouse.country === "United States" ||
                      warehouse.country === "USA"
                        ? "USA"
                        : warehouse.country === "United Kingdom" ||
                            warehouse.country === "United Kingdom - UK"
                          ? "UK"
                          : warehouse.country;

                    return (
                      <Card
                        key={warehouse.warehouse_id}
                        className="flex flex-col h-full border-text-subtle/20 shadow-sm bg-white hover:shadow-md transition-all"
                      >
                        <CardHeader className="pb-0 bg-white">
                          <div className="flex flex-col items-center">
                            <div className=" overflow-hidden flex items-center justify-center">
                              <CountryFlag
                                countryCode={countryCode}
                                size="lg"
                                className="size-24"
                                imageClassName="size-24"
                                imageWidth={24}
                                imageHeight={24}
                              />
                            </div>
                            <CardTitle className="text-lg text-dark text-center">
                              {countryName}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 space-y-2">
                          <div className="flex-grow">
                            {/* <p className="font-semibold text-dark text-sm mb-2">
                              {warehouse.name || `${countryName} Address`}
                            </p> */}
                            <div className="space-y-1 text-sm text-text-subtle">
                              {/* User Name with Warehouse ID */}
                              <div className="flex items-center justify-between group/item">
                                <p className="flex-1">
                                  <span className="capitalize text-text/75">
                                    Name:
                                  </span>{" "}
                                  <span className="text-text">
                                    {warehousesData?.userFirstName}{" "}
                                    {warehousesData?.userLastName}{" "}
                                  </span>
                                </p>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      `${warehousesData?.userFirstName} ${warehousesData?.userLastName} ${warehouse.country_code}${warehousesData?.userWarehouseId}`,
                                      `${warehouse.warehouse_id}-name`,
                                    )
                                  }
                                  className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-text-subtle hover:text-primary flex-shrink-0 ml-2"
                                  title="Copy"
                                >
                                  {copiedAddress ===
                                  `${warehouse.warehouse_id}-name` ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>

                              {/* Address Line 1 */}
                              <div className="flex items-center justify-between group/item">
                                <p className="flex-1">
                                  <span className="capitalize text-text/75">
                                    Address 1:
                                  </span>{" "}
                                  <span className="text-text">
                                    {warehouse.address_line1},{" "}
                                    {`${warehouse.country_code}${warehousesData?.userWarehouseId}`}
                                  </span>
                                </p>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      `${warehouse.address_line1}, ${warehouse.country_code}${warehousesData?.userWarehouseId}`,
                                      `${warehouse.warehouse_id}-line1`,
                                    )
                                  }
                                  className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-text-subtle hover:text-primary flex-shrink-0 ml-2"
                                  title="Copy"
                                >
                                  {copiedAddress ===
                                  `${warehouse.warehouse_id}-line1` ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>

                              {/* Address Line 2 */}
                              {warehouse.address_line2 && (
                                <div className="flex items-center justify-between group/item">
                                  <p className="flex-1">
                                    <span className="capitalize text-text/75">
                                      Address 2:
                                    </span>{" "}
                                    <span className="text-text">
                                      {warehouse.address_line2}
                                    </span>
                                  </p>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        warehouse.address_line2!,
                                        `${warehouse.warehouse_id}-line2`,
                                      )
                                    }
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-text-subtle hover:text-primary flex-shrink-0 ml-2"
                                    title="Copy"
                                  >
                                    {copiedAddress ===
                                    `${warehouse.warehouse_id}-line2` ? (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* City */}
                              {warehouse.address_line3 && (
                                <div className="flex items-center justify-between group/item">
                                  <p className="flex-1">
                                    <span className="capitalize text-text/75">
                                      City:
                                    </span>{" "}
                                    <span className="text-text">
                                      {warehouse.address_line3}
                                    </span>
                                  </p>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        warehouse.address_line3!,
                                        `${warehouse.warehouse_id}-city`,
                                      )
                                    }
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-text-subtle hover:text-primary flex-shrink-0 ml-2"
                                    title="Copy"
                                  >
                                    {copiedAddress ===
                                    `${warehouse.warehouse_id}-city` ? (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* State/Prov */}
                              {warehouse.address_line4 && (
                                <div className="flex items-center justify-between group/item">
                                  <p className="flex-1">
                                    <span className="capitalize text-text/75">
                                      State/Prov:
                                    </span>{" "}
                                    <span className="text-text">
                                      {warehouse.address_line4}
                                    </span>
                                  </p>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        warehouse.address_line4!,
                                        `${warehouse.warehouse_id}-state`,
                                      )
                                    }
                                    className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-text-subtle hover:text-primary flex-shrink-0 ml-2"
                                    title="Copy"
                                  >
                                    {copiedAddress ===
                                    `${warehouse.warehouse_id}-state` ? (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* Zip/Post */}
                              <div className="flex items-center justify-between group/item">
                                <p className="flex-1">
                                  <span className="capitalize text-text/75">
                                    Zip/Post:
                                  </span>{" "}
                                  <span className="text-text">
                                    {warehouse.postal_code}
                                  </span>
                                </p>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      warehouse.postal_code || "",
                                      `${warehouse.warehouse_id}-postal`,
                                    )
                                  }
                                  className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-text-subtle hover:text-primary flex-shrink-0 ml-2"
                                  title="Copy"
                                >
                                  {copiedAddress ===
                                  `${warehouse.warehouse_id}-postal` ? (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>

                              {/* Telephone */}
                              {warehouse.phone &&
                                warehouse.phone.length > 0 && (
                                  <div className="flex items-center justify-between group/item">
                                    <p className="flex-1">
                                      <span className="capitalize text-text/75">
                                        Telephone:
                                      </span>{" "}
                                      <span className="text-text">
                                        {warehouse.phone[0]}
                                      </span>
                                    </p>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(
                                          warehouse.phone[0],
                                          `${warehouse.warehouse_id}-phone`,
                                        )
                                      }
                                      className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 text-text-subtle hover:text-primary flex-shrink-0 ml-2"
                                      title="Copy"
                                    >
                                      {copiedAddress ===
                                      `${warehouse.warehouse_id}-phone` ? (
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>
                          <div className="pt-4 border-t border-text-subtle/20 space-y-2">
                            <Link
                              href={`/shipments?warehouse=${warehouse.warehouse_id}`}
                              className="block"
                            >
                              <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                                Manage {countryName} Location
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="w-full border-text-subtle/30 text-text hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-200 font-medium"
                              onClick={() => {
                                const fullAddress = [
                                  `${warehousesData?.userFirstName} ${warehousesData?.userLastName}`.trim(),
                                  `${warehouse.address_line1}, ${warehouse.country_code}${warehousesData?.userWarehouseId}`,
                                  warehouse.address_line2,
                                  warehouse.address_line3,
                                  warehouse.address_line4,
                                  warehouse.postal_code,
                                  warehouse.country,
                                ]
                                  .filter(Boolean)
                                  .join(", ");

                                copyToClipboard(
                                  fullAddress,
                                  `${warehouse.warehouse_id}-full`,
                                );
                              }}
                            >
                              {copiedAddress ===
                              `${warehouse.warehouse_id}-full` ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Address Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Full Address
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-text-subtle/20 shadow-sm bg-white">
                  <CardContent className="py-8 text-center">
                    <MapPin className="h-12 w-12 text-text-subtle mx-auto mb-4" />
                    <p className="text-text-subtle">No warehouses available</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Orders Section - Only show when warehouse filter is active */}
          {selectedWarehouseCountryCode && (
            <>
              <div className="mb-8">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        router.push("/shipments");
                        setSelectedWarehouseCountryCode(null);
                        setSelectedWarehouseName(null);
                        setCurrentPage(1);
                      }}
                      className="border-text-subtle/30 h-8 w-10 text-text-subtle hover:bg-gray-50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                    </Button>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-dark">
                        Orders at {selectedWarehouseName}
                      </h2>
                      {/* <p className="text-text-subtle mt-1 text-sm">
                        Showing orders for{" "}
                        {selectedWarehouseName || "selected warehouse"}
                      </p> */}
                    </div>
                  </div>
                  <Link href="/create-shipments?service=link">
                    <Button className="gap-2">Create Orders</Button>
                  </Link>
                </div>
              </div>

              <Card className="mb-6 border-text-subtle/20 shadow-sm bg-white">
                <CardHeader className="pb-3 bg-white">
                  <CardTitle className="text-dark">Filters</CardTitle>
                  <CardDescription className="text-text-subtle">
                    Narrow down shipments by specific criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-1/2 lg:w-2/5">
                      {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4" /> */}
                      <Input
                        type="search"
                        placeholder="Search by tracking #, destination, recipient..."
                        className=" border-text-subtle/30 bg-white text-text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <div className="w-full md:w-1/3 md:max-w-[200px]">
                      <Select
                        value={statusFilter}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="border-text-subtle/30 bg-white text-text">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Received">Received</SelectItem>
                          <SelectItem value="Picked Up">Picked Up</SelectItem>
                          <SelectItem value="Accepted">Accepted</SelectItem>
                          <SelectItem value="Invoice Ready">
                            Invoice Ready
                          </SelectItem>
                          <SelectItem value="Payment Requested">
                            Payment Requested
                          </SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Ready">Ready</SelectItem>
                          <SelectItem value="Departure">Departure</SelectItem>
                          <SelectItem value="Canceled">Canceled</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {filteredShipments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No shipments found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Create your first shipment to get started"}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button onClick={() => router.push("/create-shipments")}>
                      Create Orders
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredShipments.map((shipment) => (
                      <div
                        key={shipment.shipment_id}
                        onClick={() => handleCardClick(shipment.shipment_id)}
                        className="cursor-pointer"
                      >
                        <Card className="overflow-hidden h-full transition-all hover:shadow-md hover:border-primary/50 bg-white">
                          <CardHeader className="pb-2 flex justify-between items-start bg-white border-b">
                            <div>
                              <CardTitle className="text-base text-dark">
                                {shipment.drop_and_ship_order_id}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                <span className="text-text-subtle">
                                  Shipment:{" "}
                                </span>
                                <span className="text-primary font-medium">
                                  {shipment.shipment_id}
                                </span>
                              </CardDescription>
                            </div>
                            <StatusBadge status={shipment.current_status} />
                          </CardHeader>
                          <CardContent className="pt-4 pb-4">
                            <div className="space-y-3">
                              {/* Primary Information */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-text-subtle text-xs mb-1">
                                    {/* Destination */}
                                    Expected Receiving Date
                                  </p>
                                  <p className="font-medium text-dark text-sm">
                                    {/* {formatDestination(shipment)} */}
                                    {formatDate(
                                      shipment.drop_and_ship_expected_receiving_date,
                                    )}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-text-subtle text-xs mb-1">
                                    Order Date
                                  </p>
                                  <p className="font-medium text-dark text-sm">
                                    {formatDate(shipment.created_at)}
                                  </p>
                                </div>
                              </div>

                              {/* Package Details */}
                              <div className="flex items-center justify-between text-sm pt-3 border-t">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-primary/70" />
                                  <span className="text-text-subtle">
                                    Type:
                                  </span>
                                  <span className="capitalize font-medium">
                                    {shipment.drop_and_ship_order_type ||
                                      "Unknown"}
                                  </span>
                                </div>
                                <div className="flex items-center ">
                                  <MapPin className="h-4 w-4 text-primary/70" />
                                  <span className="font-medium ml-1">
                                    {formatDestination(shipment)}
                                    {/* {shipment.receiver_country_code || "Unknown"} */}
                                  </span>
                                </div>
                              </div>

                              {/* Recipient and Items */}
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary/70" />
                                  <span className="text-text-subtle">To:</span>
                                  <span className="font-medium">
                                    {getRecipientName(shipment)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className="h-4 w-4 text-primary/70" />
                                  <span>
                                    {shipment.total_quantity || 0} items
                                  </span>
                                </div>
                              </div>

                              {/* Price and Courier */}
                              <div className="flex items-center justify-between text-sm pt-3 border-t">
                                <div className="flex items-center gap-2">
                                  <Warehouse className="h-4 w-4 text-primary/70" />
                                  <span className="font-medium">
                                    {shipment.drop_and_ship_warehouse_address
                                      ?.name || "N/A"}
                                  </span>
                                </div>
                                <div className="font-medium text-primary">
                                  {formatPrice(shipment.grand_total, shipment)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-text-subtle">
                      Showing{" "}
                      <strong>
                        {(currentPage - 1) * itemsPerPage + 1}-
                        {Math.min(currentPage * itemsPerPage, totalCount)}
                      </strong>{" "}
                      of <strong>{totalCount}</strong> shipments
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={handlePreviousPage}
                        className="border-text-subtle/30 text-text-subtle"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage * itemsPerPage >= totalCount}
                        onClick={handleNextPage}
                        className="border-text-subtle/30 text-text hover:bg-primary/10 hover:text-primary hover:border-primary"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Skeleton component for loading state
function ShipmentCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full bg-white animate-pulse">
      <CardHeader className="pb-2 flex justify-between items-start bg-white border-b border-gray-200">
        <div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
      </CardHeader>
      <CardContent className="pt-4 pb-4">
        <div className="space-y-3">
          {/* Primary Information Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="text-right">
              <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>

          {/* Package Details Skeleton */}
          <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>

          {/* Recipient and Items Skeleton */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>

          {/* Price and Courier Skeleton */}
          <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
