"use client";

import { Footer } from "@/components/home-page/footer";
import { Navbar } from "@/components/home-page/navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  Loader2,
  Package,
  Search,
  Share2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

const supabase = getSupabaseBrowserClient();

// Tracking Event Interface
interface TrackingEvent {
  status: string;
  updated_at: string;
  description: string;
}

// Status Badge Component (from shipments page)
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      // Initial & Processing States
      Pending: {
        label: "Pending",
        color: "bg-amber-100 text-amber-800 border-amber-300",
      },
      Assigned: {
        label: "Assigned",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      },
      Received: {
        label: "Received",
        color: "bg-cyan-100 text-cyan-800 border-cyan-300",
      },
      "Pick Up": {
        label: "Pick Up",
        color: "bg-violet-100 text-violet-800 border-violet-300",
      },
      // Acceptance & Pricing States
      Accepted: {
        label: "Accepted",
        color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      },
      "Price Ready": {
        label: "Price Ready",
        color: "bg-indigo-100 text-indigo-800 border-indigo-300",
      },
      // Payment States
      "Invoice Generated": {
        label: "Invoice Generated",
        color: "bg-purple-100 text-purple-800 border-purple-300",
      },
      "Payment Requested": {
        label: "Payment Requested",
        color: "bg-orange-100 text-orange-800 border-orange-300",
      },
      Paid: {
        label: "Paid",
        color: "bg-green-100 text-green-800 border-green-300",
      },
      // Shipping States
      "Ready to Ship": {
        label: "Ready to Ship",
        color: "bg-sky-100 text-sky-800 border-sky-300",
      },
      Departure: {
        label: "Departure",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      },
      "In Transit": {
        label: "In Transit",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      Delivered: {
        label: "Delivered",
        color: "bg-green-100 text-green-800 border-green-300",
      },
      // Negative States
      Cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-300",
      },
      Rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-800 border-red-300",
      },
      Failed: {
        label: "Failed",
        color: "bg-red-100 text-red-800 border-red-300",
      },
      // UPS Tracking States
      "Out for Delivery": {
        label: "Out for Delivery",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      "On the Way": {
        label: "On the Way",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      },
      "We Have Your Package": {
        label: "We Have Your Package",
        color: "bg-cyan-100 text-cyan-800 border-cyan-300",
      },
      "Label Created": {
        label: "Label Created",
        color: "bg-gray-100 text-gray-800 border-gray-300",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: "bg-gray-100 text-gray-700 border-gray-300",
      }
    );
  };

  const { label, color } = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}
    >
      {label}
    </span>
  );
}

// Get status color for timeline
const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    // Initial & Processing States
    Pending: "#f59e0b",
    Assigned: "#3b82f6",
    Received: "#06b6d4",
    "Pick Up": "#8b5cf6",
    // Acceptance & Pricing States
    Accepted: "#10b981",
    "Price Ready": "#6366f1",
    // Payment States
    "Invoice Generated": "#a855f7",
    "Payment Requested": "#f97316",
    Paid: "#22c55e",
    // Shipping States
    "Ready to Ship": "#0ea5e9",
    Departure: "#3b82f6",
    "In Transit": "#eab308",
    Delivered: "#16a34a",
    // Negative States
    Cancelled: "#ef4444",
    Rejected: "#dc2626",
    Failed: "#ef4444",
    // UPS States
    "Out for Delivery": "#f59e0b",
    "On the Way": "#3b82f6",
    "We Have Your Package": "#06b6d4",
    "Label Created": "#9ca3af",
  };

  return statusColors[status] || "#9ca3af";
};

function TrackingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trackingNumber = searchParams.get("tracking_number") || "";
  const [inputTrackingNumber, setInputTrackingNumber] =
    useState(trackingNumber);
  const [shipmentData, setShipmentData] = useState<any | null>(null);
  const [upsTrackingData, setUpsTrackingData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingType, setTrackingType] = useState<"shipment" | "ups" | null>(
    null
  );
  const [countryName, setCountryName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Determine if input is shipment ID (SH) or tracking ID (UN)
  const getTrackingType = (id: string): "shipment" | "trackship" | null => {
    const trimmed = id.trim().toUpperCase();
    if (trimmed.startsWith("SH")) return "shipment";
    if (trimmed.startsWith("UN")) return "trackship";
    return null;
  };

  // Fetch shipment data by shipment ID
  const fetchShipmentData = useCallback(async (shipmentId: string) => {
    setIsLoading(true);
    setError(null);
    setShipmentData(null);
    setUpsTrackingData(null);
    setTrackingType("shipment");

    try {
      const { data, error: dbError } = await supabase
        .from("shipments")
        .select("*")
        .eq("system_tracking_id", shipmentId)
        .single();

      if (dbError) {
        if (dbError.code === "PGRST116") {
          throw new Error("Shipment not found");
        }
        throw dbError;
      }

      if (!data) {
        throw new Error("Shipment not found");
      }

      setShipmentData(data);

      // Fetch country name if country code exists
      if (data.shipment_country_code) {
        const { data: countryData, error: countryError } = await supabase
          .from("countries")
          .select("name")
          .eq("code", data.shipment_country_code)
          .single();

        if (!countryError && countryData) {
          setCountryName(countryData.name);
        }
      }
    } catch (e: any) {
      console.error("Shipment fetch error:", e);
      setError(
        e?.message ||
        "Failed to fetch shipment data. Please check the shipment ID."
      );
      setShipmentData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const fetchShipmentDataByShipmentId = useCallback(
    async (shipmentId: string) => {
      setIsLoading(true);
      setError(null);
      setShipmentData(null);
      setUpsTrackingData(null);
      setTrackingType("shipment");

      try {
        const { data, error: dbError } = await supabase
          .from("shipments")
          .select("*")
          .eq("shipment_id", shipmentId)
          .single();

        if (dbError) {
          if (dbError.code === "PGRST116") {
            throw new Error("Shipment not found");
          }
          throw dbError;
        }

        if (!data) {
          throw new Error("Shipment not found");
        }

        setShipmentData(data);

        // Fetch country name if country code exists
        if (data.shipment_country_code) {
          const { data: countryData, error: countryError } = await supabase
            .from("countries")
            .select("name")
            .eq("code", data.shipment_country_code)
            .single();

          if (!countryError && countryData) {
            setCountryName(countryData.name);
          }
        }
      } catch (e: any) {
        console.error("Shipment fetch error:", e);
        setError(
          e?.message ||
          "Failed to fetch shipment data. Please check the shipment ID."
        );
        setShipmentData(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch UPS tracking data
  const fetchUpsTrackingData = useCallback(async (trackingId: string) => {
    setIsLoading(true);
    setError(null);
    setShipmentData(null);
    setUpsTrackingData(null);
    setTrackingType("ups");

    try {
      const { data, error: apiError } = await supabase.functions.invoke(
        "ups-tracker",
        {
          method: "POST",
          body: {
            tracking_id: trackingId,
          },
        }
      );

      if (apiError) {
        throw apiError;
      }

      if (!data || !data.trackResponse) {
        throw new Error("Invalid tracking data received");
      }

      setUpsTrackingData(data);
    } catch (e: any) {
      console.error("UPS tracking error:", e);
      setError(
        e?.message ||
        "Failed to fetch tracking data. Please check the tracking number."
      );
      setUpsTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch tracking data when tracking number is in URL
  useEffect(() => {
    if (trackingNumber) {
      setInputTrackingNumber(trackingNumber);
      const type = getTrackingType(trackingNumber);
      if (type === "shipment") {
        fetchShipmentDataByShipmentId(trackingNumber);
      } else if (type === "trackship") {
        fetchShipmentData(trackingNumber);
      } else {
        setError(
          "Invalid tracking number. Must start with SH (shipment) or UN (tracking)"
        );
      }
    }
  }, [trackingNumber, fetchShipmentData, fetchShipmentDataByShipmentId]);

  // Handle track button click
  const handleTrack = () => {
    if (!inputTrackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    const type = getTrackingType(inputTrackingNumber);
    if (!type) {
      toast.error(
        "Invalid tracking number. Must start with SH (shipment) or UN (tracking)"
      );
      return;
    }

    router.push(
      `/tracking?tracking_number=${encodeURIComponent(
        inputTrackingNumber.trim()
      )}`
    );
  };

  // Parse shipment tracking history
  const shipmentTrackingHistory: TrackingEvent[] = shipmentData?.status_timeline
    ? (typeof shipmentData.status_timeline === "string"
      ? JSON.parse(shipmentData.status_timeline)
      : shipmentData.status_timeline
    ).sort((a: TrackingEvent, b: TrackingEvent) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    })
    : [];

  // Parse UPS tracking data
  const upsShipment = upsTrackingData?.trackResponse?.shipment?.[0];
  const upsPackageData = upsShipment?.package?.[0];
  const upsActivities = upsPackageData?.activity || [];
  const upsCurrentStatus = upsPackageData?.currentStatus;
  const upsTrackingNumber =
    upsPackageData?.trackingNumber ||
    upsShipment?.inquiryNumber ||
    trackingNumber;

  // Format date and time for UPS activities
  const formatActivityDateTime = (date: string, time: string) => {
    if (!date || !time) return "N/A";
    try {
      const year = date.substring(0, 4);
      const month = date.substring(4, 6);
      const day = date.substring(6, 8);
      const hour = time.substring(0, 2);
      const minute = time.substring(2, 4);
      const dateObj = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
      return (
        dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        " • " +
        dateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return `${date} ${time}`;
    }
  };

  // Map UPS status codes to readable labels
  const getUpsStatusLabel = (desc: string) => {
    if (desc?.includes("DELIVERED")) return "Delivered";
    if (desc?.includes("OUT_FOR_DELIVERY")) return "Out for Delivery";
    if (desc?.includes("IN_TRANSIT")) return "On the Way";
    if (desc?.includes("ORIGIN_SCAN")) return "We Have Your Package";
    if (desc?.includes("LABEL_CREATED")) return "Label Created";
    return desc?.replace(/_/g, " ") || "In Transit";
  };

  // Get UPS activity status color
  const getUpsActivityStatusColor = (statusType: string) => {
    const colors: Record<string, string> = {
      I: "#3b82f6", // In Transit - Blue
      X: "#f59e0b", // Exception - Amber
      P: "#8b5cf6", // Pickup - Purple
      M: "#6366f1", // Manifest - Indigo
      D: "#10b981", // Delivered - Green
    };
    return colors[statusType] || "#9ca3af";
  };

  // Convert UPS activities to TrackingEvent format
  const upsTrackingHistory: TrackingEvent[] = upsActivities
    .map((activity: any) => {
      const location = activity.location?.address;
      const addressParts = [];
      if (location?.city) addressParts.push(location.city);
      if (location?.stateProvince) addressParts.push(location.stateProvince);
      if (location?.country) addressParts.push(location.country);

      return {
        status: getUpsStatusLabel(activity.status?.description || ""),
        updated_at: `${activity.date}T${activity.time}`,
        description: addressParts.length > 0 ? addressParts.join(", ") : "",
      };
    })
    .sort((a: TrackingEvent, b: TrackingEvent) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

  // Determine which tracking history to display
  const displayTrackingHistory =
    trackingType === "shipment" ? shipmentTrackingHistory : upsTrackingHistory;

  const displayId =
    trackingType === "shipment"
      ? shipmentData?.system_tracking_id || shipmentData?.shipment_id
      : upsTrackingNumber;

  const currentStatus =
    trackingType === "shipment"
      ? shipmentData?.current_status
      : upsCurrentStatus?.simplifiedTextDescription ||
      upsCurrentStatus?.description ||
      "In Transit";

  // Calculate days in transit
  const calculateDaysInTransit = () => {
    if (!shipmentData?.created_at) return 0;
    const createdDate = new Date(shipmentData.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysInTransit =
    trackingType === "shipment" ? calculateDaysInTransit() : 0;

  // Get tracking link
  const trackingLink = displayId
    ? `https://www.buy2send.com/tracking?tracking_number=${encodeURIComponent(
      displayId
    )}`
    : "";

  // Copy tracking link to clipboard
  const handleCopyLink = async () => {
    if (!trackingLink) return;
    try {
      await navigator.clipboard.writeText(trackingLink);
      setCopied(true);
      toast.success("Tracking link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    if (!displayId || !trackingLink) return;
    const message = `Tracking ${displayId} ${trackingLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl mt-20">
          <div className="space-y-6">
            {/* Tracking Input Section - Always visible */}
            {!shipmentData && !upsTrackingData && !isLoading && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    Track Your Shipment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="Enter shipment ID or tracking ID"
                      value={inputTrackingNumber}
                      onChange={(e) => setInputTrackingNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleTrack();
                        }
                      }}
                      className="flex-1 h-12 text-base"
                    />
                    <Button
                      onClick={handleTrack}
                      disabled={isLoading}
                      className="h-12 px-6 bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg"
                    >
                      <Search className="h-5 w-5 mr-2" />
                      Track
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <Card className="shadow-sm">
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-red-600 mb-4" />
                    <p className="text-lg text-muted-foreground font-medium">
                      Fetching tracking information...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <Alert className="border-red-300 bg-red-50">
                <AlertTitle className="text-red-700 font-bold">Error</AlertTitle>
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Tracking Results */}
            {(shipmentData || upsTrackingData) && !isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* Tracking History Card */}
                <Card className="transition-all hover:shadow-md h-full overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Clock className="md:size-6 size-5 text-primary" />
                      </div>
                      <span className="text-base md:text-lg font-semibold">
                        Tracking History
                      </span>
                      {displayTrackingHistory.length > 0 && (
                        <span className="ml-auto text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          {displayTrackingHistory.length} updates
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {displayTrackingHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                          <Clock className="h-8 w-8 text-muted-foreground/60" />
                        </div>
                        <p className="font-medium text-foreground mb-1">
                          No Tracking History Yet
                        </p>
                        <p className="text-sm text-muted-foreground max-w-[250px]">
                          {currentStatus === "Payment Requested"
                            ? "Awaiting payment confirmation."
                            : currentStatus === "Pick Up"
                              ? "Waiting for pickup."
                              : currentStatus === "Pending"
                                ? "Shipment is being processed."
                                : "Check back later for updates."}
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Timeline vertical line */}
                        <div
                          className="hidden md:block absolute left-[172px] z-10 top-3 bottom-3 w-0.5 rounded-full bg-slate-400/80"
                        // style={{
                        //   background: `linear-gradient(to bottom, ${getStatusColor(
                        //     displayTrackingHistory[0]?.status
                        //   )}, ${getStatusColor(
                        //     displayTrackingHistory[
                        //       displayTrackingHistory.length - 1
                        //     ]?.status
                        //   )})`,
                        // }}
                        />

                        <div className="space-y-0">
                          {displayTrackingHistory.map(
                            (history: TrackingEvent, index: number) => {
                              const isFirst = index === 0;
                              const isLast =
                                index === displayTrackingHistory.length - 1;
                              const statusColor = getStatusColor(history.status);
                              const dateTime = new Date(history.updated_at);
                              const formattedDate = dateTime.toLocaleDateString(
                                "en-US",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              );
                              const formattedTime = dateTime.toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                }
                              );

                              return (
                                <div
                                  key={index}
                                  className={`relative flex flex-col sm:flex-row gap-4 sm:gap-6 py-3 pl-3 sm:pl-6 ${index % 2 === 0 ? "bg-slate-100" : "bg-white"
                                    }`}
                                >
                                  {/* Content - Layout like image */}
                                  <div className="flex-1 min-w-0">
                                    {/* Date and Time on the left */}
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                                      <div className="flex-shrink-0 w-full sm:w-28">
                                        <div className="text-sm font-medium text-gray-900">
                                          {formattedDate}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-0.5">
                                          {formattedTime}
                                        </div>
                                      </div>

                                      <div className="relative flex-shrink-0 z-10 mt-1 sm:mt-0">
                                        <div
                                          className={`flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 shadow-sm transition-all duration-300 ${isFirst
                                            ? "ring-4 ring-slate-500 border-slate-500"
                                            : ""
                                            }`}
                                          style={{
                                            borderColor: "#e0e0e0",
                                            ...(isFirst && {
                                              boxShadow: `0 0 0 4px ${statusColor}20`,
                                            }),
                                          }}
                                        >
                                          <div
                                            className={`rounded-full transition-all bg-slate-500 ${isFirst ? "size-3.5" : "size-3"
                                              }`}
                                          />
                                        </div>
                                      </div>

                                      {/* Status and Description in center */}
                                      <div className="flex-1 min-w-0">
                                        <div className="mb-1.5">
                                          <StatusBadge status={history.status} />
                                        </div>
                                        {history.description && (
                                          <p className="text-sm text-gray-600 leading-relaxed">
                                            {history.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sidebar - Tracking Input and Details */}
                <div className="space-y-4">
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Track Another Shipment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Input
                          type="text"
                          placeholder="Enter shipment ID or tracking ID"
                          value={inputTrackingNumber}
                          onChange={(e) => setInputTrackingNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleTrack();
                            }
                          }}
                          className="h-11 text-sm"
                        />
                        <Button
                          onClick={handleTrack}
                          disabled={isLoading}
                          className="w-full h-11 bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Track
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tracking Details Card - Only show for shipments */}
                  {trackingType === "shipment" && shipmentData && (
                    <Card className="shadow-sm">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Tracking Number */}
                          <div className="">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Tracking number
                            </label>
                            <p className="text-sm font-semibold text-foreground">
                              {displayId || "N/A"}
                            </p>
                          </div>

                          {/* To */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              To
                            </label>
                            <p className="text-sm font-semibold text-foreground">
                              {countryName ||
                                shipmentData.shipment_country_code ||
                                "N/A"}
                            </p>
                          </div>

                          {/* Weight */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Weight
                            </label>
                            <p className="text-sm font-semibold text-foreground">
                              {shipmentData.shipment_total_weight
                                ? `${shipmentData.shipment_total_weight / 1000
                                } KG`
                                : "N/A"}
                            </p>
                          </div>

                          {/* Shipping Type */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Shipping Type
                            </label>
                            <p className="text-sm font-semibold capitalize text-foreground">
                              {shipmentData.shipment_type || "N/A"}
                            </p>
                          </div>

                          {/* Days in transit */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Days in transit
                            </label>
                            <p className="text-sm font-semibold text-foreground">
                              {daysInTransit}
                            </p>
                          </div>

                          {/* Tracking Link */}
                          {trackingLink && (
                            <div className="space-y-2 pt-2 border-t">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                <Share2 className="h-3.5 w-3.5" />
                                Tracking link
                              </label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  value={trackingLink}
                                  readOnly
                                  className="h-9 text-xs font-mono flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCopyLink}
                                  className="h-9 px-3"
                                >
                                  {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Bookmark this page to track parcels faster!
                              </p>
                            </div>
                          )}

                          {/* Share to WhatsApp */}
                          {trackingLink && (
                            <div className="pt-2">
                              <Button
                                onClick={handleShareWhatsApp}
                                className="w-full h-11 bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-md flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share to WhatsApp
                                </div>
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl mt-20">
            <Card className="shadow-sm">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-red-600 mb-4" />
                  <p className="text-lg text-muted-foreground font-medium">
                    Loading tracking page...
                  </p>
                </div>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      }
    >
      <TrackingPageContent />
    </Suspense>
  );
}
