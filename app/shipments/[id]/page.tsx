"use client";

import {
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Printer,
  ShoppingBag,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Navbar } from "@/components/navbar";
import OrderPdf from "@/components/shipments/order-pdf";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { sortedCountries } from "@/lib/countries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import Image from "next/image";
import Script from "next/script";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { generateBarcode } from "@/lib/barcode";

interface Shipment {
  receiver_phone_code: string;
  shipment_id: string;
  order_id?: string;
  user_id: string;
  created_at: string;
  receiver_first_name?: string;
  receiver_last_name?: string;
  receiver_address_line1?: string;
  receiver_address_line2?: string;
  receiver_address_line3?: string;
  receiver_address_line4?: string;
  receiver_city?: string;
  receiver_postal_code?: string;
  receiver_phone?: string;
  receiver_email?: string;
  receiver_company?: string;
  shipment_country_code?: string;
  shipment_type?: string;
  shipment_courier_service_id?: string;
  shipment_total_weight?: number;
  package_type?: string;
  package_lenght: number;
  package_width: number;
  package_height: number;
  package_volume?: number;
  current_status: string;
  current_status_updated_at?: string;
  status_timeline?: any[];
  special_instructions?: string;
  is_pickup_needed?: boolean;
  pickup_address_line1?: string;
  pickup_address_line2?: string;
  pickup_address_line3?: string;
  pickup_address_line4?: string;
  pickup_postalcode?: string;
  pickup_country?: string;
  pickup_phonenumber?: string;
  pickup_phone_code?: string;
  pickup_date?: string;
  pickup_instructions?: string;
  grand_total: number;
  payment_method?: string;
  payment_proof_url?: string;
  payment_proof_status?: string;
  payment_proof_submitted_at?: string;
  payment_proof_rejection_reason?: string;
  payment_id?: string;
  paid_at?: string;
  payment_details?: any;
  payment_proof_approved_at?: string;
}

interface ShipmentItem {
  shipment_id: string;
  shipment_item_id: string;
  description?: string;
  declared_value?: number;
  purpose?: string;
}

interface TrackingEvent {
  status: string;
  updated_at: string;
  description: string;
}

interface PaymentCardProps {
  shipment: Shipment;
  onPaymentUpdate: () => void;
}

// Add type for toast
type ToastProps = {
  title?: string;
  description: string;
  variant?: "default" | "destructive";
};

// Add Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Get the singleton instance
const supabase = getSupabaseBrowserClient();

function PaymentCard({ shipment, onPaymentUpdate }: PaymentCardProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>(
    shipment.payment_method || "Online Payment"
  );
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Set initial file preview from shipment data
  useEffect(() => {
    if (shipment.payment_proof_url) {
      setFilePreview(shipment.payment_proof_url);
    }
  }, [shipment.payment_proof_url]);

  // Calculate charges for online payment
  const onlinePaymentCharges = shipment.grand_total * 0.02;
  const totalWithCharges = shipment.grand_total + onlinePaymentCharges;

  // Check if payment is already processed or being reviewed
  const isPaymentProcessed =
    shipment.payment_id ||
    shipment.payment_proof_status === "Submitted" ||
    shipment.payment_proof_status === "Approved" ||
    (shipment.payment_method === "Cash" &&
      shipment.current_status === "Payment Requested");

  // Get status chip color and text
  const getStatusChip = (status: string | null | undefined) => {
    if (!status) return null;

    const statusConfig = {
      Submitted: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: "Under Review",
      },
      Approved: {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Approved",
      },
      Rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        text: "Rejected",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  // Update toast calls to use the correct Sonner signature
  const showToast = (props: {
    title?: string;
    description: string;
    variant?: "default" | "destructive";
  }) => {
    const { title, description, variant } = props;
    const options: ExternalToast = { description, variant };
    if (title) {
      sonnerToast(title, options);
    } else {
      // If no title, use description as the main message in Sonner
      sonnerToast(description, { variant });
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPaymentProcessed) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      showToast({
        title: "Invalid file type",
        description: "Please upload a JPG, JPEG or PNG file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  // Handle proof upload
  const handleProofUpload = async () => {
    if (!selectedFile || isPaymentProcessed) return;
    setIsUploading(true);

    try {
      // Upload file to storage
      const filename = `invoices/${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("universal-storage")
        .upload(filename, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("universal-storage").getPublicUrl(filename);

      // Update shipment
      const { error: updateError } = await supabase
        .from("shipments")
        .update({
          payment_method: paymentMethod,
          payment_proof_url: publicUrl,
          payment_proof_status: "Submitted",
          payment_proof_submitted_at: new Date().toISOString(),
        })
        .eq("shipment_id", shipment.shipment_id);

      if (updateError) throw updateError;

      showToast({
        title: "Success",
        description:
          "Payment proof uploaded successfully. Please wait for admin verification.",
      });
      onPaymentUpdate();
    } catch (error) {
      console.error("Error uploading proof:", error);
      showToast({
        title: "Error",
        description: "Failed to upload payment proof",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Initialize Razorpay payment
  const initializeRazorpay = async () => {
    if (isPaymentProcessed) return;
    setIsProcessing(true);
    try {
      // Create order
      const response = await fetch("/api/razorpay-create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipmentId: shipment.shipment_id,
          amount: totalWithCharges,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const { data, success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || "Failed to create order");
      }

      // Initialize Razorpay
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "SSL Logistics",
        description: `Payment for shipment ${shipment.shipment_id}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Update shipment with payment details
            const { error: updateError } = await supabase
              .from("shipments")
              .update({
                payment_id: response.razorpay_payment_id,
                payment_method: "Online Payment",
                paid_at: new Date().toISOString(),
                payment_details: response,
              })
              .eq("shipment_id", shipment.shipment_id);

            if (updateError) throw updateError;

            // Payment successful
            showToast({
              title: "Payment Successful",
              description:
                "Your payment has been processed successfully. Please wait for admin verification.",
            });
            onPaymentUpdate();
          } catch (error) {
            console.error("Error updating payment details:", error);
            showToast({
              title: "Error",
              description:
                "Payment was successful but failed to update details. Please contact support.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setShowConfirmation(false);
          },
          confirm_close: true,
          escape: true,
        },
        prefill: {
          name: `${shipment.receiver_first_name} ${shipment.receiver_last_name}`,
          email: shipment.receiver_email,
          contact: shipment.receiver_phone,
        },
        notes: {
          shipment_id: shipment.shipment_id,
        },
        theme: {
          color: "#0284c7",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        showToast({
          title: "Payment Failed",
          description:
            response.error.description || "Payment failed. Please try again.",
          variant: "destructive",
        });
      });

      rzp.open();
    } catch (error) {
      console.error("Payment initialization failed:", error);
      showToast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  };

  // Handle cash payment
  const handleCashPayment = async () => {
    if (isPaymentProcessed) return;
    try {
      const { error: updateError } = await supabase
        .from("shipments")
        .update({
          payment_method: "Cash",
          payment_proof_status: "Submitted",
          payment_proof_submitted_at: new Date().toISOString(),
        })
        .eq("shipment_id", shipment.shipment_id);

      if (updateError) throw updateError;

      showToast({
        title: "Success",
        description:
          "Cash payment method confirmed. Please wait for admin verification.",
      });
      onPaymentUpdate();
    } catch (error) {
      console.error("Error updating payment method:", error);
      showToast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive",
      });
    }
  };

  // Render payment status message
  const renderPaymentStatusMessage = () => {
    if (shipment.payment_id) {
      return (
        <Alert className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Payment Successful</AlertTitle>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              Paid Online
            </span>
          </div>
          <AlertDescription className="mt-2">
            Your online payment has been received. Please wait for admin
            verification before proceeding.
            <div className="mt-2 text-sm">
              <div>Payment ID: {shipment.payment_id}</div>
              <div>Paid on: {new Date(shipment.paid_at!).toLocaleString()}</div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (shipment.payment_proof_status) {
      return (
        <Alert
          className={
            shipment.payment_proof_status === "Rejected"
              ? "mb-4 border-red-200"
              : "mb-4"
          }
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {shipment.payment_proof_status === "Rejected" ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : shipment.payment_proof_status === "Approved" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-blue-600" />
              )}
              <AlertTitle>
                Payment Proof{" "}
                {shipment.payment_proof_status === "Rejected"
                  ? "Rejected"
                  : "Status"}
              </AlertTitle>
            </div>
            {getStatusChip(shipment.payment_proof_status)}
          </div>
          <AlertDescription className="mt-2">
            {shipment.payment_proof_status === "Submitted" &&
              "Your payment proof has been submitted and is being reviewed by our admin team. Please wait for verification."}
            {shipment.payment_proof_status === "Approved" &&
              "Your payment has been verified by our admin team. Your shipment will be processed shortly."}
            {shipment.payment_proof_status === "Rejected" && (
              <>
                {shipment.payment_proof_rejection_reason}
                <div className="mt-2">Please submit a new payment proof.</div>
              </>
            )}
            {shipment.payment_proof_url &&
              (paymentMethod === "Bank Transfer" ||
                paymentMethod === "Bank Deposit") && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Submitted Proof:
                  </p>
                  <div className="relative aspect-video w-full max-w-sm rounded-md overflow-hidden border">
                    <Image
                      src={shipment.payment_proof_url}
                      alt="Payment proof"
                      className="object-cover"
                      fill
                    />
                  </div>
                </div>
              )}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <Card className="mb-6">
        <CardHeader className="bg-muted/30 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {renderPaymentStatusMessage()}

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              disabled={isPaymentProcessed}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Online Payment">
                  Online Payment (2% additional charge)
                </SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Bank Deposit">Bank Deposit</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span>{shipment.grand_total.toFixed(2)} INR</span>
            </div>
            {paymentMethod === "Online Payment" && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Online Payment Charge (2%):</span>
                  <span>{onlinePaymentCharges.toFixed(2)} INR</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Amount:</span>
                  <span>{totalWithCharges.toFixed(2)} INR</span>
                </div>
              </>
            )}
          </div>

          {(paymentMethod === "Bank Transfer" ||
            paymentMethod === "Bank Deposit") && (
            <div className="space-y-4">
              {!isPaymentProcessed && (
                <div className="space-y-2">
                  <Label htmlFor="proofFile">Upload Payment Proof</Label>
                  <Input
                    id="proofFile"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    disabled={isUploading || isPaymentProcessed}
                  />
                  {filePreview && !shipment.payment_proof_url && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        Preview:
                      </p>
                      <div className="relative aspect-video w-full max-w-sm rounded-md overflow-hidden border">
                        <Image
                          src={filePreview}
                          alt="Payment proof preview"
                          className="object-cover"
                          fill
                        />
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleProofUpload}
                    disabled={Boolean(
                      !selectedFile || isUploading || isPaymentProcessed
                    )}
                    className="w-full"
                  >
                    {isUploading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Proof
                  </Button>
                </div>
              )}
            </div>
          )}

          {paymentMethod === "Online Payment" && !isPaymentProcessed && (
            <Button
              onClick={() => setShowConfirmation(true)}
              className="w-full"
              disabled={Boolean(isProcessing)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          )}

          {paymentMethod === "Cash" && !isPaymentProcessed && (
            <Button onClick={handleCashPayment} className="w-full">
              Confirm Cash Payment
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Please review the payment details before proceeding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Amount:</span>
                <span>{shipment.grand_total.toFixed(2)} INR</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Online Payment Charge (2%):</span>
                <span>{onlinePaymentCharges.toFixed(2)} INR</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Total Amount:</span>
                <span>{totalWithCharges.toFixed(2)} INR</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                By clicking proceed, you will be redirected to Razorpay's secure
                payment gateway.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={Boolean(isProcessing)}
            >
              Cancel
            </Button>
            <Button
              onClick={initializeRazorpay}
              disabled={Boolean(isProcessing)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "#10b981"; // green
    case "Pick Up":
    case "Pending":
      return "#3b82f6"; // blue
    case "Delivered":
      return "#10b981"; // green
    case "In Transit":
      return "#f59e0b"; // yellow
    case "Failed":
      return "#ef4444"; // red
    default:
      return "#e5e7eb"; // gray
  }
};

export default function ShipmentDetailsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [courierServices, setCourierServices] = useState<any[]>([]);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

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
  useEffect(() => {
    if (!id || !user) return;

    async function fetchShipmentDetails() {
      setLoading(true);
      setError(null);
      try {
        // Fetch shipment using the string id directly
        const { data: shipmentData, error: shipmentError } = await supabase
          .from("shipments")
          .select("*")
          .eq("shipment_id", id)
          .eq("user_id", user.id)
          .single();

        const qr = await generateBarcode(
          `https://universalmail.in/shipments/${id}`
        );
        setQrCodeData(qr);

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
            .eq("shipment_id", id); // Use string id directly

          if (itemsError) {
            console.error("Error fetching shipment items:", itemsError);
            setItems([]); // Set empty items on error, but keep shipment data
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
      }
    }

    fetchShipmentDetails();
  }, [id, user]);

  useEffect(() => {
    async function fetchCourierServices() {
      try {
        const { data, error } = await supabase
          .from("courier_services")
          .select("*");
        if (error) throw error;
        setCourierServices(data || []);
      } catch (err) {
        console.error("Error fetching courier services:", err);
      }
    }
    fetchCourierServices();
  }, []);

  // Helper function to get courier name
  const getCourierName = (courierId: string) => {
    const courier = courierServices.find(
      (c) => c.courier_service_id === courierId
    );
    return courier ? courier.name : "Unknown Courier";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar activePage="shipments" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading shipment details...</p>
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
                <Link href="/shipments">Return to Shipments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Format receiver name
  const receiverName =
    `${shipment.receiver_first_name || ""} ${
      shipment.receiver_last_name || ""
    }`.trim() || "Unknown";

  // Format destination address
  const formatAddress = (s: Shipment) => {
    const parts = [];
    if (s.receiver_address_line1) parts.push(s.receiver_address_line1);
    if (s.receiver_city) parts.push(s.receiver_city);
    if (s.receiver_postal_code) parts.push(s.receiver_postal_code);
    if (s.shipment_country_code)
      parts.push(s.shipment_country_code.toUpperCase());

    return parts.join(", ") || "Unknown location";
  };

  const formatAddressForLabel = (s: Shipment) => {
    const parts = [];
    if (s.receiver_address_line1) parts.push(s.receiver_address_line1);
    if (s.receiver_address_line2) parts.push(s.receiver_address_line2);
    if (s.receiver_address_line3) parts.push(s.receiver_address_line3);
    if (s.receiver_address_line4) parts.push(s.receiver_address_line4);
    if (s.receiver_city) parts.push(s.receiver_city);
    // if (s.receiver_postal_code) parts.push(s.receiver_postal_code);

    sortedCountries.filter((country) => {
      if (
        country.code.toUpperCase() === s.shipment_country_code?.toUpperCase()
      ) {
        parts.push(country.name);
      }
    });

    return parts || ["Unknown location"];
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Parse tracking history if available
  const trackingHistory = shipment.status_timeline
    ? typeof shipment.status_timeline === "string"
      ? JSON.parse(shipment.status_timeline)
      : shipment.status_timeline
    : [];

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
              Back to Shipments
            </Link>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Shipment {shipment.shipment_id}
                </h1>
                <div className="ml-auto flex items-center gap-2">
                  <StatusBadge status={shipment.current_status} />
                  {shipment.order_id && (
                    <Badge variant="secondary">
                      Order: {shipment.order_id}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1">
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
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Truck className="h-4 w-4" />
                  Track Shipment
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
            {/* Left Column - 2x2 Card Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Shipment Details */}
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Tracking #
                      </h3>
                      <p className="font-medium text-sm">
                        {shipment.shipment_id}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Created Date
                      </h3>
                      <p className="text-sm">
                        {formatDate(shipment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Service Type
                      </h3>
                      <p className="text-sm capitalize">
                        {shipment.shipment_type || "Standard"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Courier
                      </h3>
                      <p className="text-sm">
                        {shipment.shipment_courier_service_id
                          ? getCourierName(shipment.shipment_courier_service_id)
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">
                      Receiving Address
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        {shipment.receiver_address_line1 ||
                          "No address specified"}
                      </p>
                      {shipment.receiver_address_line2 && (
                        <p>{shipment.receiver_address_line2}</p>
                      )}
                      {shipment.receiver_address_line3 && (
                        <p>{shipment.receiver_address_line3}</p>
                      )}
                      {shipment.receiver_address_line4 && (
                        <p>{shipment.receiver_address_line4}</p>
                      )}
                      <p>
                        {shipment.receiver_postal_code},{" "}
                        {shipment.shipment_country_code?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Receiver Information */}
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-5 w-5 text-primary" />
                    Receiver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        First Name
                      </h3>
                      <p className="text-sm">
                        {shipment.receiver_first_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Last Name
                      </h3>
                      <p className="text-sm">
                        {shipment.receiver_last_name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">
                      Phone Number
                    </h3>
                    <p className="text-sm">
                      +{shipment.receiver_phone_code || ""}{" "}
                      {shipment.receiver_phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">
                      Email
                    </h3>
                    <p className="text-sm">
                      {shipment.receiver_email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">
                      Company
                    </h3>
                    <p className="text-sm">
                      {shipment.receiver_company || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Product Information */}
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {items.length > 0 ? (
                    <>
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground">
                          Items
                        </h3>
                        <div className="flex items-center gap-1">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {items.length}
                          </span>
                          <span className="text-sm">items</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <div
                            key={item.shipment_item_id || index}
                            className="border-t pt-2"
                          >
                            <div className="flex justify-between">
                              <h3 className="text-xs font-medium text-muted-foreground">
                                Item #{index + 1}
                              </h3>
                              <span className="text-xs font-medium">
                                ₹{item.declared_value || 0}
                              </span>
                            </div>
                            <p className="text-sm font-medium">
                              {item.description}
                            </p>
                            {item.purpose && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                                {item.purpose}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No items found for this shipment.
                    </p>
                  )}

                  {shipment.special_instructions && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Special Instructions
                      </h3>
                      <p className="text-sm">{shipment.special_instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 4: Package Information */}
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5 text-primary" />
                    Package Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Package Type
                      </h3>
                      <div className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary capitalize">
                        {shipment.package_type || "Standard"}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Weight
                      </h3>
                      <p className="text-sm font-medium">
                        {shipment.shipment_total_weight || 0} g
                      </p>
                    </div>
                  </div>
                  {shipment.package_type !== "envelope" && (
                    <>
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground">
                          Dimensions
                        </h3>
                        <p className="text-sm">
                          {shipment.package_lenght || 0} ×{" "}
                          {shipment.package_width || 0} ×{" "}
                          {shipment.package_height || 0} cm
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground">
                          Dimensional Volume
                        </h3>
                        <p className="text-sm">
                          {shipment.package_volume ||
                            shipment.package_lenght *
                              shipment.package_width *
                              shipment.package_height ||
                            0}{" "}
                          cm³
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Card 5: Pickup Information - Only show if pickup is enabled */}
              {shipment.is_pickup_needed && (
                <Card className="transition-all hover:shadow-md md:col-span-2">
                  <CardHeader className="bg-muted/30 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Truck className="h-5 w-5 text-primary" />
                      Pickup Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground">
                            Pickup Address
                          </h3>
                          <div className="space-y-1 mt-1 text-sm">
                            <p>
                              {shipment.pickup_address_line1 ||
                                "No address specified"}
                            </p>
                            {shipment.pickup_address_line2 && (
                              <p>{shipment.pickup_address_line2}</p>
                            )}
                            {shipment.pickup_address_line3 && (
                              <p>{shipment.pickup_address_line3}</p>
                            )}
                            {shipment.pickup_address_line4 && (
                              <p>{shipment.pickup_address_line4}</p>
                            )}
                            <p>
                              {shipment.pickup_postalcode},{" "}
                              {shipment.pickup_country?.toUpperCase() ||
                                shipment.shipment_country_code?.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground">
                            Phone Number
                          </h3>
                          <p className="text-sm">
                            +{shipment.pickup_phone_code || ""}{" "}
                            {shipment.pickup_phonenumber || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground">
                            Pickup Date
                          </h3>
                          <p className="text-sm">
                            {formatDate(shipment.pickup_date)}
                          </p>
                        </div>

                        {shipment.pickup_instructions && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground">
                              Pickup Instructions
                            </h3>
                            <p className="text-sm">
                              {shipment.pickup_instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Tracking History */}
            <div className="lg:col-span-1">
              {/* Status Overview Card */}
              <Card
                className="border-l-4 mb-6"
                style={{
                  borderLeftColor: getStatusColor(shipment.current_status),
                }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Current Status
                        </p>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={shipment.current_status} />
                          <span className="text-sm text-muted-foreground">
                            Updated:{" "}
                            {formatDate(
                              shipment.current_status_updated_at ||
                                shipment.created_at
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Show PaymentCard when status is Payment Requested */}
              {shipment.current_status === "Payment Requested" && (
                <PaymentCard
                  shipment={shipment}
                  onPaymentUpdate={() => {
                    // Refresh shipment data
                    router.refresh();
                  }}
                />
              )}

              {/* Tracking History Card */}
              <Card className="transition-all hover:shadow-md h-full">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-primary" />
                    Tracking History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {trackingHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                      <Clock className="h-10 w-10 mb-3 text-gray-400" />
                      <p className="font-medium mb-1">
                        No Tracking History Yet
                      </p>
                      <p className="text-sm">
                        {shipment.current_status === "Payment Requested"
                          ? "Awaiting payment confirmation."
                          : shipment.current_status === "Pick Up"
                          ? "Waiting for pickup."
                          : shipment.current_status === "Pending"
                          ? "Shipment is being processed."
                          : "Check back later for updates."}
                      </p>
                    </div>
                  ) : (
                    <div className="relative space-y-6 pl-6 border-l border-border">
                      {trackingHistory.map(
                        (history: TrackingEvent, index: number) => (
                          <div key={index} className="relative">
                            <div className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor: getStatusColor(
                                    history.status
                                  ),
                                }}
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <StatusBadge status={history.status} />
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  history.updated_at
                                ).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(
                                  history.updated_at
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {history.description}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  // Map status values to appropriate badge variants
  const getStatusConfig = (status: string) => {
    const statusMap = {
      Pending: { label: "Pending", variant: "outline" },
      Received: { label: "Received", variant: "default" },
      "Picked Up": { label: "Picked Up", variant: "default" },
      Accepted: { label: "Accepted", variant: "default" },
      "Invoice Ready": { label: "Invoice Ready", variant: "default" },
      "Payment Requested": { label: "Payment Requested", variant: "outline" },
      Paid: { label: "Paid", variant: "success" },
      Ready: { label: "Ready", variant: "default" },
      Departure: { label: "Departure", variant: "default" },
      Canceled: { label: "Canceled", variant: "destructive" },
      Rejected: { label: "Rejected", variant: "destructive" },
    };

    return statusMap[status] || { label: status, variant: "outline" };
  };

  const { label, variant } = getStatusConfig(status);

  if (variant === "success") {
    return (
      <Badge className="bg-success hover:bg-success/90 text-white">
        {label}
      </Badge>
    );
  }

  return (
    <Badge
      variant={variant as "default" | "secondary" | "destructive" | "outline"}
    >
      {label}
    </Badge>
  );
}
