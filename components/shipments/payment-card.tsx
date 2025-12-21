"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CheckCircle, Clock, CreditCard, Loader2, XCircle } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useState } from "react";
import { toast as sonnerToast } from "sonner";
import type { BankDetail, PaymentCardProps } from "./types";

// Get the singleton instance
const supabase = getSupabaseBrowserClient();

export function PaymentCard({ shipment, onPaymentUpdate }: PaymentCardProps) {
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
  const onlinePaymentCharges = Number(shipment.grand_total) * 0.035;
  const totalWithCharges = Number(shipment.grand_total) + onlinePaymentCharges;

  // Check if payment is already processed or being reviewed
  const isPaymentProcessed =
    shipment.payment_id ||
    shipment.payment_proof_status === "Submitted" ||
    shipment.payment_proof_status === "Approved";

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
          payment_type: "regular_payment",
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
                  Online Payment (3.5% additional charge)
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
                  <span>Online Payment Charge (3.5%):</span>
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
