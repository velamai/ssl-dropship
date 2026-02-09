"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { toast as sonnerToast } from "sonner";

const supabase = getSupabaseBrowserClient();

interface PaymentAtCheckoutProps {
  shipmentId: string;
  paymentMethod: "Online Payment" | "Bank Transfer";
  receiverInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function showToast(props: {
  title?: string;
  description: string;
  variant?: "default" | "destructive";
}) {
  const { title, description, variant } = props;
  if (variant === "destructive") {
    sonnerToast.error(title || "Error", { description });
  } else {
    sonnerToast(title || "Success", { description });
  }
}

export function PaymentAtCheckout({
  shipmentId,
  paymentMethod,
  receiverInfo,
  open,
  onSuccess,
  onCancel,
}: PaymentAtCheckoutProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false);
  const razorpayTriggered = useRef(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      showToast({
        title: "Invalid file type",
        description: "Please upload a JPG, JPEG or PNG file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleProofUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      const filename = `product-payment-proof/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("colombo-storage")
        .upload(filename, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("colombo-storage")
        .getPublicUrl(filename);

      const { error: updateError } = await supabase
        .from("shipments")
        .update({
          drop_and_ship_product_payment_method: "Bank Transfer",
          drop_and_ship_product_payment_proof_url: publicUrl,
          drop_and_ship_product_payment_proof_status: "Submitted",
          drop_and_ship_product_payment_proof_submitted_at:
            new Date().toISOString(),
        })
        .eq("shipment_id", shipmentId);

      if (updateError) throw updateError;

      showToast({
        title: "Success",
        description:
          "Payment proof uploaded. Please wait for admin verification.",
      });
      onSuccess();
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

  const initializeRazorpay = async () => {
    if (razorpayTriggered.current || !open || paymentMethod !== "Online Payment")
      return;
    razorpayTriggered.current = true;
    setIsProcessing(true);

    try {
      const response = await fetch("/api/razorpay-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId,
          payment_type: "product_payment",
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const { data, success, error } = await response.json();
      if (!success || error) throw new Error(error || "Failed to create order");

      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay script not loaded");
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Buy2Send",
        description: `Product payment for shipment ${shipmentId}`,
        order_id: data.orderId,
        handler: async () => {
          showToast({
            title: "Payment Successful",
            description: "Your payment will be processed shortly.",
          });
          onSuccess();
        },
        modal: {
          ondismiss: () => {
            razorpayTriggered.current = false;
            setIsProcessing(false);
            onCancel();
          },
          confirm_close: true,
          escape: true,
        },
        prefill: {
          name: `${receiverInfo.firstName} ${receiverInfo.lastName}`,
          email: receiverInfo.email,
          contact: receiverInfo.phone,
        },
        notes: {
          shipment_id: shipmentId,
          payment_type: "product_payment",
        },
        theme: { color: "#0284c7" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        showToast({
          title: "Payment Failed",
          description: response.error?.description || "Payment failed. Please try again.",
          variant: "destructive",
        });
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay init failed:", err);
      razorpayTriggered.current = false;
      showToast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      });
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  // Wait for Razorpay script before initializing; poll if onLoad hasn't fired yet
  useEffect(() => {
    if (
      !open ||
      paymentMethod !== "Online Payment" ||
      razorpayTriggered.current
    ) {
      return;
    }
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      setRazorpayScriptLoaded(true);
      return;
    }
    const pollInterval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        setRazorpayScriptLoaded(true);
      }
    }, 200);
    const timeout = setTimeout(() => clearInterval(pollInterval), 10000);
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [open, paymentMethod]);

  useEffect(() => {
    if (
      open &&
      paymentMethod === "Online Payment" &&
      !razorpayTriggered.current &&
      razorpayScriptLoaded
    ) {
      const timer = setTimeout(initializeRazorpay, 100);
      return () => clearTimeout(timer);
    }
  }, [open, paymentMethod, shipmentId, razorpayScriptLoaded]);

  if (paymentMethod === "Bank Transfer") {
    return (
      <>
        <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Payment Proof</DialogTitle>
              <DialogDescription>
                Upload proof of your bank transfer to complete the order
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proofFile">Payment Proof (JPG, PNG)</Label>
                <Input
                  id="proofFile"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </div>
              {filePreview && (
                <div className="relative aspect-video w-full max-w-sm rounded-md overflow-hidden border">
                  <Image
                    src={filePreview}
                    alt="Preview"
                    className="object-cover"
                    fill
                  />
                </div>
              )}
              <Button
                onClick={handleProofUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Proof
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full"
                disabled={isUploading}
              >
                Pay Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (paymentMethod === "Online Payment" && isProcessing) {
    return (
      <>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
          onLoad={() => setRazorpayScriptLoaded(true)}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Opening payment...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="beforeInteractive"
      onLoad={() => setRazorpayScriptLoaded(true)}
    />
  );
}
