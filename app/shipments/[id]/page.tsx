"use client";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { generateBarcode } from "@/lib/barcode";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
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
// import { sortedCountries } from "@/lib/countries";
import { getSupabaseBrowserClient } from "@/lib/supabase";
// import { PDFDownloadLink } from "@react-pdf/renderer";
import { sortedCountries } from "@/lib/countries";
import Image from "next/image";
import Script from "next/script";
import { toast as sonnerToast, type ExternalToast } from "sonner";
// import { generateBarcode } from "@/lib/barcode";

const DROP_AND_SHIP_ADD_ON_PRICE = 100;
const DROP_AND_SHIP_ADD_ON_LABELS: Record<string, string> = {
  "gift-wrapper": "Gift Wrapper",
  "gift-message": "Gift Message",
  "extra-packing": "Extra Packing Material",
};

type Warehouse = {
  name: string;
  country: string;
  postal_code: string;
  address_line1: string;
  address_line2?: string;
  address_line3?: string;
  address_line4?: string;
};

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
}

type ShipmentItem = {
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
interface BankDetail {
  id: string;
  account_number: string;
  account_name: string;
  ifsc_code: string;
  bank_name: string;
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
    shipment.payment_method || "Bank Transfer"
  );
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetail[] | null>(null);
  const [isFetchingBank, setIsFetchingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Set initial file preview from shipment data
  useEffect(() => {
    if (shipment.payment_proof_url) {
      setFilePreview(shipment.payment_proof_url);
    }
  }, [shipment.payment_proof_url]);

  // Calculate charges for online payment
  const onlinePaymentCharges = Number(shipment.grand_total) * 0.02;
  const totalWithCharges = Number(shipment.grand_total) + onlinePaymentCharges;

  // Check if payment is already processed or being reviewed
  const isPaymentProcessed =
    shipment.payment_id ||
    shipment.payment_proof_status === "Submitted" ||
    shipment.payment_proof_status === "Approved";
  //  ||
  // (shipment.payment_method === "Cash" &&
  //   shipment.current_status === "Payment Requested");

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

  // Fetch bank details when Bank Transfer is selected
  const fetchBankDetails = async () => {
    setIsFetchingBank(true);
    setBankError(null);
    try {
      const { data, error } = await supabase.from("bank_details").select("*");
      if (error) throw error;
      setBankDetails((data || []) as BankDetail[]);
    } catch (err: any) {
      console.error("Failed to load bank details:", err);
      setBankError("Failed to load bank details. Please try again.");
      setBankDetails(null);
    } finally {
      setIsFetchingBank(false);
    }
  };

  useEffect(() => {
    if (paymentMethod === "Bank Transfer") {
      fetchBankDetails();
    }
  }, [paymentMethod]);

  // Update toast calls to use the correct Sonner signature
  const showToast = (props: {
    title?: string;
    description: string;
    variant?: "default" | "destructive";
  }) => {
    const { title, description, variant } = props;
    const isError = variant === "destructive";
    if (isError) {
      if (title) {
        sonnerToast.error(title, { description });
      } else {
        sonnerToast.error(description);
      }
      return;
    }

    if (title) {
      sonnerToast(title, { description });
    } else {
      sonnerToast(description);
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
      const filename = `payment-proof/${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("colombo-storage")
        .upload(filename, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("colombo-storage").getPublicUrl(filename);

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
      // Clear local selected state so button disables and preview resets
      setSelectedFile(null);
      // Trigger a refresh to pull latest status and proof URL
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
        name: "Buy2Send",
        description: `Payment for shipment ${shipment.shipment_id}`,
        order_id: data.orderId,

        // Handler called when payment is successful
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // Show success toast immediately
          showToast({
            title: "Payment Successful!",
            description: `Payment ID: ${response.razorpay_payment_id}. Your shipment will be processed shortly.`,
          });

          setTimeout(() => {
            onPaymentUpdate();
          }, 2000);
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
                paymentMethod === "Cash") && (
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

          <div className="space-y-1">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              disabled={Boolean(isPaymentProcessed)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Online Payment">
                  Online Payment (2% additional charge)
                </SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span>{Number(shipment.grand_total).toFixed(2)} INR</span>
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

          {paymentMethod === "Cash" && !isPaymentProcessed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Pay with Cash at Office</p>
              </div>
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium mb-1">Office Address</p>
                <div className="text-muted-foreground">
                  <p>GF - 4, Manthra Apartments</p>
                  <p>No.112, North Boag Road, T Nagar</p>
                  <p>Chennai, Tamil Nadu 600017</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Visit our office to make the payment. Please obtain the
                  payment invoice and upload it below as proof.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === "Bank Transfer" && !isPaymentProcessed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Bank Transfer Details</p>
                {isFetchingBank && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {bankError && <p className="text-xs text-red-600">{bankError}</p>}
              {!bankError &&
                !isFetchingBank &&
                bankDetails &&
                bankDetails.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No bank details available.
                  </p>
                )}
              {!bankError && bankDetails && bankDetails.length > 0 && (
                <div className="space-y-3">
                  {bankDetails.map((b) => (
                    <div key={b.id} className="rounded-md border p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Account Name:
                          </span>{" "}
                          <span className="font-medium">{b.account_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Account Number:
                          </span>{" "}
                          <span className="font-medium">
                            {b.account_number}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            IFSC Code:
                          </span>{" "}
                          <span className="font-medium">{b.ifsc_code}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Bank Name:
                          </span>{" "}
                          <span className="font-medium">{b.bank_name}</span>
                        </div>
                      </div>
                      {/* <p className="mt-2 text-xs text-muted-foreground">
                        Use shipment ID {shipment.shipment_id} as payment
                        reference.
                      </p> */}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    After completing the transfer, please submit the payment
                    proof below.
                  </p>
                </div>
              )}
            </div>
          )}

          {(paymentMethod === "Bank Transfer" || paymentMethod === "Cash") && (
            <div className="space-y-4">
              {!isPaymentProcessed && (
                <div className="space-y-2">
                  <Label htmlFor="proofFile">Upload Payment Proof</Label>
                  <Input
                    id="proofFile"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    disabled={Boolean(isUploading || isPaymentProcessed)}
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
                <span>{Number(shipment.grand_total).toFixed(2)} INR</span>
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
  const [isRefetching, setIsRefetching] = useState(false);

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

  const formatAddressForLabel = (s: Shipment) => {
    const parts = [];
    if (s.receiver_address_line1) parts.push(s.receiver_address_line1);
    if (s.receiver_address_line2) parts.push(s.receiver_address_line2);
    if (s.receiver_address_line3) parts.push(s.receiver_address_line3);
    if (s.receiver_address_line4) parts.push(s.receiver_address_line4);
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

  const formatCurrency = (value: number | null | undefined) => {
    const numericValue = Number(value) || 0;
    return `₹${numericValue.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatAddOnLabel = (id: string) => {
    if (DROP_AND_SHIP_ADD_ON_LABELS[id]) {
      return DROP_AND_SHIP_ADD_ON_LABELS[id];
    }

    return id
      .split("-")
      .map((segment) =>
        segment.length > 0
          ? segment[0].toUpperCase() + segment.slice(1).toLowerCase()
          : segment
      )
      .join(" ");
  };

  const addOnSelections = Array.isArray(shipment.drop_and_ship_add_ons)
    ? shipment.drop_and_ship_add_ons
    : [];
  const addOnsTotal = addOnSelections.length * DROP_AND_SHIP_ADD_ON_PRICE;

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

                {shipment.confirmed_invoice_url && (
                  <Button variant="outline" size="sm" className="gap-1" asChild>
                    <Link href={shipment.confirmed_invoice_url} target="_blank">
                      <FileText className="h-4 w-4" />
                      View Invoice
                    </Link>
                  </Button>
                )}
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
                    Order Details
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
                        Expected Receiving Date
                      </h3>
                      <p className="text-sm">
                        {formatDate(
                          shipment.drop_and_ship_expected_receiving_date
                        )}
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Company
                      </h3>
                      <p className="text-sm">
                        {shipment.receiver_company || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        VAT/TAX
                      </h3>
                      <p className="text-sm">
                        {shipment.receiver_tax || "N/A"}
                      </p>
                    </div>
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
                      <div className="grid grid-cols-3 gap-3">
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
                        {shipment.drop_and_ship_purchase_date && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground">
                              Purchased Date
                            </h3>
                            <p className="text-sm">
                              {formatDate(shipment.drop_and_ship_purchase_date)}
                            </p>
                          </div>
                        )}
                        {shipment.drop_and_ship_purchase_site && (
                          <div>
                            <h3 className="text-xs font-medium text-muted-foreground">
                              Purchased Site
                            </h3>
                            <p className="text-sm">
                              {shipment.drop_and_ship_purchase_site || ""}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left text-xs font-medium text-muted-foreground py-2">
                                Name
                              </th>
                              <th className="text-right text-xs font-medium text-muted-foreground py-2">
                                Price
                              </th>
                              <th className="text-right text-xs font-medium text-muted-foreground py-2">
                                Quantity
                              </th>
                              <th className="text-right text-xs font-medium text-muted-foreground py-2">
                                Total Price
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => (
                              <tr
                                key={item.shipment_item_id || index}
                                className="border-b last:border-b-0"
                              >
                                <td className="text-sm py-2">
                                  {item.name && item.name.length > 25 ? (
                                    <TooltipProvider>
                                      <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                          <Link
                                            href={
                                              item.drop_and_ship_product_url ||
                                              ""
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {item.name.substring(0, 25)}...
                                          </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{item.name}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <Link
                                      href={
                                        item.drop_and_ship_product_url || ""
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {item.name}
                                    </Link>
                                  )}
                                </td>
                                <td className="text-sm text-right py-2">
                                  ₹{item.declared_value || 0}
                                </td>
                                <td className="text-sm text-right py-2">
                                  {item.quantity || 1}
                                </td>
                                <td className="text-sm font-medium text-right py-2">
                                  ₹
                                  {(
                                    (Number(item.declared_value) || 0) *
                                    (item.quantity || 1)
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No items found for this shipment.
                    </p>
                  )}

                  {addOnSelections.length > 0 && (
                    <div className="space-y-3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Add-ons
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(DROP_AND_SHIP_ADD_ON_PRICE)} each
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {addOnSelections.map((addon) => (
                          <Badge
                            key={addon}
                            variant="outline"
                            className="gap-2 rounded-full px-3 py-1 text-xs font-medium"
                          >
                            <span>{formatAddOnLabel(addon)}</span>
                            <span className="text-muted-foreground">
                              +{formatCurrency(DROP_AND_SHIP_ADD_ON_PRICE)}
                            </span>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>Total add-on charges</span>
                        <span>{formatCurrency(addOnsTotal)}</span>
                      </div>
                    </div>
                  )}

                  {shipment.drop_and_ship_note && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Special Instructions
                      </h3>
                      <p className="text-sm">{shipment.drop_and_ship_note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 4: Warehouse Information */}
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="bg-muted/30 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-5 w-5 text-primary" />
                    Warehouse Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {shipment.drop_and_ship_warehouse_address ? (
                    <>
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground">
                          Warehouse Name
                        </h3>
                        <p className="text-sm font-medium">
                          {shipment.drop_and_ship_warehouse_address.name ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-muted-foreground">
                          Address
                        </h3>
                        <div className="space-y-1 mt-1">
                          <p className="text-sm">
                            {
                              shipment.drop_and_ship_warehouse_address
                                .address_line1
                            }{" "}
                            ,
                          </p>
                          <p className="text-sm">
                            {shipment.drop_and_ship_warehouse_address
                              .address_line2 && (
                              <>
                                {
                                  shipment.drop_and_ship_warehouse_address
                                    .address_line2
                                }
                              </>
                            )}
                          </p>
                          <p className="text-sm">
                            {shipment.drop_and_ship_warehouse_address
                              .address_line3 && (
                              <>
                                {
                                  shipment.drop_and_ship_warehouse_address
                                    .address_line3
                                }
                              </>
                            )}
                            {shipment.drop_and_ship_warehouse_address
                              .address_line4 && (
                              <>
                                ,{" "}
                                {
                                  shipment.drop_and_ship_warehouse_address
                                    .address_line4
                                }
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground">
                            Country
                          </h3>
                          <p className="text-sm font-medium">
                            {shipment.drop_and_ship_warehouse_address.country ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs font-medium text-muted-foreground">
                            Postal Code
                          </h3>
                          <p className="text-sm font-medium">
                            {shipment.drop_and_ship_warehouse_address
                              .postal_code || "N/A"}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No warehouse information available
                    </p>
                  )}
                </CardContent>
              </Card>
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
                  onPaymentUpdate={refetchShipmentData}
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

    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        variant: "outline",
      }
    );
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
