"use client";
import {
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  User,
  Warehouse,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Navbar } from "@/components/navbar";
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
import { getSupabaseBrowserClient } from "@/lib/supabase";

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
  const router = useRouter();
  const { user } = useAuth();

  console.log("[Shipments Page] Initial user state:", user);

  // Helper function to get courier name

  // Load shipments with item counts
  useEffect(() => {
    console.log("[Shipments Page] User state in useEffect:", user);

    // Guard clause: don't proceed if user is not loaded
    if (!user || !user.id) {
      console.log("[Shipments Page] No user found, skipping shipment load");
      setLoading(false);
      return;
    }

    async function loadShipments() {
      setLoading(true);
      try {
        // let query = supabase
        //   .from("shipments")
        //   .select<string, Shipment>("*", { count: "estimated" })
        //   .eq("user_id", user?.id)
        //   .not("drop_and_ship_order_id", "is", null)
        //   .order("created_at", { ascending: false });

        let query = supabase
          .from("shipments")
          .select("*", { count: "estimated" })
          .eq("user_id", user?.id)
          .not("drop_and_ship_order_id", "is", null)
          .order("created_at", { ascending: false });

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
                  0
                ) || 0,
              total_quantity:
                itemData?.reduce(
                  (acc, item) => acc + (item.quantity || 0),
                  0
                ) || 0,
            };
          })
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
    // Ensure user object changes trigger reload if necessary, though id might be sufficient
  }, [user, statusFilter, currentPage, itemsPerPage]); // REMOVED getCourierName

  // Filter shipments based on search term
  useEffect(() => {
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
            .includes(lowerCaseSearch))
    );

    setFilteredShipments(filtered);
  }, [searchTerm, shipments]);

  const handleCardClick = (shipmentId: string) => {
    router.push(`/shipments/${shipmentId}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Add event type
    setSearchTerm(e.target.value);
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
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-dark">
                Orders
              </h2>
              <p className="text-text-subtle">
                Manage and track all your orders in one place.
              </p>
            </div>
            <Button
              onClick={() => router.push("/create-shipments")}
              className="gap-2"
            >
              Create Orders
            </Button>
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
                            <span className="text-text-subtle">Shipment: </span>
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
                                  shipment.drop_and_ship_expected_receiving_date
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
                              <span className="text-text-subtle">Type:</span>
                              <span className="capitalize font-medium">
                                {shipment.drop_and_ship_order_type || "Unknown"}
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
                              <span>{shipment.total_quantity || 0} items</span>
                            </div>
                          </div>

                          {/* Price and Courier */}
                          <div className="flex items-center justify-between text-sm pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <Warehouse className="h-4 w-4 text-primary/70" />
                              <span className="font-medium">
                                {shipment.drop_and_ship_warehouse_address
                                  ?.name || "Unknown"}
                              </span>
                            </div>
                            <div className="font-medium text-primary">
                              ₹
                              {(shipment.total_price || 0) +
                                (shipment.drop_and_ship_add_ons?.length || 0) *
                                  100 || 0}{" "}
                              /-
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

function StatusBadge({ status }: { status: string }) {
  // Map status values to appropriate badge variants and colors
  const getStatusConfig = (status: string) => {
    const statusMap = {
      "Pick Up Assigned": {
        label: "Pick Up Assigned",
        variant: "outline",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      Pending: {
        label: "Pending",
        variant: "outline",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      Received: {
        label: "Received",
        variant: "default",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      Accepted: {
        label: "Accepted",
        variant: "default",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      "Payment Requested": {
        label: "Payment Requested",
        variant: "outline",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
      "Invoice Generated": {
        label: "Invoice Generated",
        variant: "default",
        color: "bg-purple-100 text-purple-800 border-purple-200",
      },
      Paid: {
        label: "Paid",
        variant: "success",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      "Ready to Ship": {
        label: "Ready to Ship",
        variant: "default",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      Departure: {
        label: "Departure",
        variant: "default",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
    };

    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        variant: "outline",
        color: "bg-gray-100 text-gray-800 border-gray-200",
      }
    );
  };

  const { label, color } = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {label}
    </span>
  );
}
