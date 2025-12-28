/**
 * Shipment Details Page
 * Displays comprehensive information about a single shipment
 */

"use client";

import { Navbar } from "@/components/navbar";
import { OrderDetailsCard } from "@/components/shipments/order-details-card";
import { PaymentCard } from "@/components/shipments/payment-card";
import { ProductInfoCard } from "@/components/shipments/product-info-card";
import { ProductPaymentCard } from "@/components/shipments/product-payment-card";
import { ReceiverInfoCard } from "@/components/shipments/receiver-info-card";
import { StatusBadge } from "@/components/shipments/status-badge";
import { StatusOverviewCard } from "@/components/shipments/status-overview-card";
import { TrackingHistoryCard } from "@/components/shipments/tracking-history-card";
import type { Shipment, ShipmentItem } from "@/components/shipments/types";
import { WarehouseInfoCard } from "@/components/shipments/warehouse-info-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { generateBarcode } from "@/lib/barcode";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Loader2,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Get the singleton instance
const supabase = getSupabaseBrowserClient();

export default function ShipmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [showProductImagesDialog, setShowProductImagesDialog] = useState(false);

  const labelData = {
    destinationName: "Chinenye Ezinma",
    destinationAddress: ["9 York Road", "STEVENAGE", "Hertfordshire"],
    destinationPostcode: "SG1 4ET",
    returnAddress: [
      "COLOMBO MAIL",
      "SHOP LOCALLY",
      "21 WELSH STREET",
      "CHEPSTOW",
      "NP16 5LL",
    ],
    date: "2025-03-13",
    weight: "<1kg",
    code: "C-00HH-A-055943949-2",
    barcodeImg: "/barcodes-side.png",
    barcodeBottomImg: "/barcodes-bottom.png",
    barcodeSideImg: "/barcodes-side.png",
  };

  // Fetch shipment details - extracted for reuse
  const fetchShipmentDetails = async (isInitialLoad = false) => {
    if (!id || !user) return;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefetching(true);
    }
    setError(null);

    try {
      // Fetch shipment using the string id directly
      const { data: shipmentData, error: shipmentError } = await supabase
        .from("shipments")
        .select("*")
        .eq("shipment_id", id)
        .eq("user_id", user?.id)
        .single();

      // Only generate QR code on initial load
      if (isInitialLoad) {
        const qr = await generateBarcode(
          `https://universalmail.in/shipments/${id}`
        );
        setQrCodeData(qr);
      }

      if (shipmentError) {
        if (shipmentError.code === "PGRST116") {
          // Not found code
          setError(
            "Shipment not found or you do not have permission to view it."
          );
        } else {
          throw shipmentError;
        }
        setShipment(null);
        setItems([]);
      } else if (shipmentData) {
        setShipment(shipmentData as Shipment);

        // Fetch associated items using the string id
        const { data: itemsData, error: itemsError } = await supabase
          .from("shipment_items")
          .select("*")
          .eq("shipment_id", id);
        console.log({ itemsData });

        if (itemsError) {
          console.error("Error fetching shipment items:", itemsError);
          setItems([]);
        } else {
          setItems((itemsData || []) as ShipmentItem[]);
        }
      } else {
        setError("Shipment data could not be loaded.");
      }
    } catch (err: any) {
      console.error("Failed to load shipment details:", err);
      setError(`Failed to load shipment details: ${err.message}`);
      setShipment(null);
      setItems([]);
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  };

  // Refetch shipment data (called after payment success)
  const refetchShipmentData = () => {
    fetchShipmentDetails(false);
  };

  useEffect(() => {
    fetchShipmentDetails(true);
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar activePage="shipments" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading Order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar activePage="shipments" />
        <div className="sm:container flex h-screen items-center justify-center">
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-xl">Shipment Not Found</CardTitle>
              <CardDescription>
                The shipment you're looking for doesn't exist or has been
                removed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/shipments">Return to Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activePage="shipments" />

      <main className="flex-1 p-4 md:p-6">
        <div className="sm:container">
          <div className="mb-6">
            <Link
              href="/shipments"
              className="mb-2 flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Orders
            </Link>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Shipment {shipment.shipment_id}
                </h1>
                <div className="ml-auto flex items-center gap-2 mt-2">
                  <StatusBadge status={shipment.current_status} />
                  {shipment.order_id && (
                    <Badge variant="secondary">
                      Order: {shipment.order_id}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* <Button variant="outline" size="sm" className="gap-1">
                  <Printer className="h-4 w-4" />
                  <PDFDownloadLink
                    document={
                      <OrderPdf
                        {...labelData}
                        destinationAddress={formatAddressForLabel(shipment)}
                        code={shipment.order_id || ""}
                        destinationName={
                          `${shipment.receiver_first_name || ""} ${
                            shipment.receiver_last_name || ""
                          }` || ""
                        }
                        date={formatDate(shipment.created_at)}
                        weight={`${shipment.shipment_total_weight || 0} g`}
                        destinationPostcode={
                          shipment.receiver_postal_code || ""
                        }
                        shipmentId={shipment.shipment_id}
                        qrCodeData={qrCodeData || undefined}
                      />
                    }
                    fileName="order-label.pdf"
                  >
                    {({ loading }) =>
                      loading ? "Generating PDF..." : "Print Label"
                    }
                  </PDFDownloadLink>
                </Button> */}
                <Button variant="outline" size="sm" className="gap-1">
                  <Truck className="h-4 w-4" />
                  Track Shipment
                </Button>

                {shipment.confirmed_invoice_url && (
                  <Button variant="outline" size="sm" className="gap-1" asChild>
                    <Link href={shipment.confirmed_invoice_url} target="_blank">
                      <FileText className="h-4 w-4" />
                      View Invoice
                    </Link>
                  </Button>
                )}
                {shipment.drop_and_ship_product_invoice_url_admin && (
                  <Button variant="outline" size="sm" className="gap-1" asChild>
                    <Link
                      href={shipment.drop_and_ship_product_invoice_url_admin}
                      target="_blank"
                    >
                      <FileText className="h-4 w-4" />
                      View Product Invoice
                    </Link>
                  </Button>
                )}
                {shipment.drop_and_ship_product_images_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setShowProductImagesDialog(true)}
                  >
                    <ImageIcon className="h-4 w-4" />
                    View Product Images
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
            {/* Left Column - 2x2 Card Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <OrderDetailsCard shipment={shipment} />
              <ReceiverInfoCard shipment={shipment} />
              <ProductInfoCard shipment={shipment} items={items} />
              {shipment.drop_and_ship_warehouse_address && (
                <WarehouseInfoCard shipment={shipment} />
              )}
            </div>

            {/* Right Column - Tracking History */}
            <div className="lg:col-span-1">
              <StatusOverviewCard shipment={shipment} />

              {/* Show PaymentCard when status is Payment Requested */}
              {shipment.current_status === "Payment Requested" && (
                <PaymentCard
                  shipment={shipment}
                  onPaymentUpdate={refetchShipmentData}
                />
              )}

              {/* Show ProductPaymentCard when status is Product Payment Requested */}
              {shipment.current_status === "Product Payment Requested" && (
                <ProductPaymentCard
                  shipment={shipment}
                  items={items}
                  onPaymentUpdate={refetchShipmentData}
                />
              )}

              <TrackingHistoryCard shipment={shipment} />
            </div>
          </div>
        </div>
      </main>

      {/* Product Images Dialog */}
      <Dialog
        open={showProductImagesDialog}
        onOpenChange={setShowProductImagesDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Images</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {shipment?.drop_and_ship_product_images_admin ? (
              (() => {
                // Parse the images array (it might be a JSON string or already an array)
                let images: string[] = [];
                try {
                  if (
                    typeof shipment.drop_and_ship_product_images_admin ===
                    "string"
                  ) {
                    images = JSON.parse(
                      shipment.drop_and_ship_product_images_admin
                    );
                  } else if (
                    Array.isArray(shipment.drop_and_ship_product_images_admin)
                  ) {
                    images = shipment.drop_and_ship_product_images_admin;
                  }
                } catch (e) {
                  console.error("Error parsing product images:", e);
                }

                if (images.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mb-3 text-gray-400" />
                      <p className="font-medium">No Product Images Available</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((imageUrl, index) => {
                      // Use regular img tag for better error handling
                      return (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow bg-muted"
                        >
                          <img
                            src={imageUrl}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Replace with placeholder on error
                              const target = e.target as HTMLImageElement;
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
                              target.onerror = null; // Prevent infinite loop
                            }}
                            loading="lazy"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-3 text-gray-400" />
                <p className="font-medium">No Product Images Available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
