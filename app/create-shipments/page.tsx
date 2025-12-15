"use client";

import { IdentityVerificationDialog } from "@/components/identity-verification-v2";
import { Navbar } from "@/components/navbar";
import {
  OrderFormData,
  OrderSchema,
  ShipmentFormData,
  getPhoneDetails,
} from "@/lib/schemas/shipmentSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { fetchCountries } from "@/lib/api-client";
import { fetchIdentityVerificationData } from "@/lib/api/identity";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductsStep } from "@/components/shipments/products-step";
import { ReceiverInfoTab } from "@/components/shipments/receiver-info-tab";
import { AddOnsStep } from "@/components/shipments/addons-step";
import { ReviewStep } from "@/components/shipments/review-step";
import { WarehouseSelectionStep } from "@/components/shipments/warehouse-selection-step";
import { ServiceSelectionDialog } from "@/components/shipments/service-selection-dialog";

// Get the singleton instance
const supabase = getSupabaseBrowserClient();

// Helper function to generate UUID
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type Step = 1 | 2 | 3 | 4 | 5;
type AddOnId = "gift-wrapper" | "gift-message" | "extra-packing";

// Component that uses useSearchParams - needs to be wrapped in Suspense
function CreateShipmentPageContent() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get service type from search params (link or warehouse)
  const serviceType =
    searchParams.get("type") || searchParams.get("service") || "link";
  const isLinkService = serviceType === "link";
  const isWarehouseService = serviceType === "warehouse";

  const { data: identityVerificationData } = useQuery({
    queryKey: ["identityVerificationData", user?.id],
    queryFn: () => fetchIdentityVerificationData(user?.id || ""),
    enabled: !!user?.id,
  });

  const isVerified =
    identityVerificationData?.data?.is_identity_verified || false;
  const identityVerificationId =
    identityVerificationData?.data?.identity_verification_id;
  const verificationStatus = identityVerificationData?.data
    ?.identity_verification?.status as
    | "pending"
    | "approved"
    | "rejected"
    | undefined;
  const verificationRejectionReason =
    identityVerificationData?.data?.identity_verification?.rejection_reason;

  // Determine verification state
  const isPending = identityVerificationId && verificationStatus === "pending";
  const isRejected =
    identityVerificationId && verificationStatus === "rejected";

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnId[]>([]);
  const [addOnTotal, setAddOnTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    trigger,
  } = useForm<OrderFormData>({
    mode: "onBlur",
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      shipments: [
        {
          shipmentType: isLinkService ? "link" : "warehouse",
          country: "",
          warehouseId: undefined,
          purchasedDate: undefined,
          purchasedSite: "",
          packageType: "box",
          dimensions: {
            length: undefined,
            width: undefined,
            height: undefined,
          },
          isPickupNeeded: false,
          pickup: {
            addressLine1: "",
            addressLine2: "",
            addressLine3: "",
            addressLine4: "",
            postalCode: "",
            date: undefined,
            phoneNumber: "",
            phoneCode: "",
            instructions: "",
          },
          receiver: {
            firstName: "",
            lastName: "",
            company: "",
            vatTax: "",
            phone: "",
            phoneCode: "",
            email: "",
            addressLine1: "",
            addressLine2: "",
            addressLine3: "",
            addressLine4: "",
            postalCode: "",
            receivingCountry: "",
          },
          items: [
            {
              uuid: generateUUID(),
              productUrl: "",
              productName: "",
              productNote: "",
              price: 0,
              valueCurrency: "INR",
              quantity: 0,
            },
          ],
          invoiceUrls: [],
          productImageUrls: [],
          notes: "",
        },
      ],
    },
  });

  // State for fetched data
  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate total price from all product items
  const calculateTotalPrice = useCallback(() => {
    const formData = getValues();
    let total = 0;

    formData.shipments.forEach((shipment) => {
      if (shipment.items) {
        shipment.items.forEach((item) => {
          if (item.price && item.quantity) {
            total += item.price * item.quantity;
          }
        });
      }
    });

    return total;
  }, [getValues]);

  const totalPrice = calculateTotalPrice();
  const baseAmount = totalPrice;

  // Watch for changes in product items and update total price
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && (name.includes(".price") || name.includes(".quantity"))) {
        // Total price will be recalculated on next render
      }
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authIsLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create shipments",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [user, authIsLoading, router, toast]);

  // Fetch countries on component mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const countriesData = await fetchCountries();
        setCountries(countriesData);

        if (countriesData.length > 0) {
          setValue("shipments.0.country", countriesData[0].code, {
            shouldValidate: true,
          });
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load countries. Using default values.",
          variant: "destructive",
        });

        const defaultCountries = [
          { code: "us", name: "United States" },
          { code: "ca", name: "Canada" },
          { code: "uk", name: "United Kingdom" },
          { code: "au", name: "Australia" },
        ];

        setCountries(defaultCountries);
        setValue("shipments.0.country", "us", { shouldValidate: true });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [toast, setValue]);

  // Validate current step before moving forward
  const validateStep = useCallback(
    async (step: Step): Promise<boolean> => {
      const shipmentIndex = 0;

      if (step === 1) {
        // Validate products
        const itemsResult = await trigger(`shipments.${shipmentIndex}.items`);
        if (isWarehouseService) {
          // Also validate warehouse-specific fields in products step
          const purchasedDateResult = await trigger(
            `shipments.${shipmentIndex}.purchasedDate`
          );
          const purchasedSiteResult = await trigger(
            `shipments.${shipmentIndex}.purchasedSite`
          );
          return itemsResult && purchasedDateResult && purchasedSiteResult;
        }
        return itemsResult;
      } else if (step === 2) {
        if (isWarehouseService) {
          // Validate warehouse selection
          const warehouseResult = await trigger(
            `shipments.${shipmentIndex}.warehouseId`
          );
          return warehouseResult;
        } else {
          // Validate receiver details for link service
          const receiverResult = await trigger(
            `shipments.${shipmentIndex}.receiver`
          );
          return receiverResult;
        }
      } else if (step === 3) {
        if (isWarehouseService) {
          // Validate receiver details for warehouse service
          const receiverResult = await trigger(
            `shipments.${shipmentIndex}.receiver`
          );
          return receiverResult;
        } else {
          // Add-ons step doesn't need validation for link service
          return true;
        }
      } else if (step === 4) {
        if (isWarehouseService) {
          // Add-ons step doesn't need validation
          return true;
        } else {
          // Review step - validate entire form for link service
          return await trigger();
        }
      } else if (step === 5) {
        // Review step - validate entire form for warehouse service
        return await trigger();
      }

      return false;
    },
    [trigger, isWarehouseService]
  );

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const maxStep = isWarehouseService ? 5 : 4;
    if (currentStep < maxStep) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  }, [currentStep, validateStep, toast, isWarehouseService]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  }, [currentStep]);

  const handleAddOnsChange = useCallback(
    (addOns: AddOnId[], addOnAmount: number) => {
      setSelectedAddOns(addOns);
      setAddOnTotal(addOnAmount);
    },
    []
  );

  // Helper function to transform shipment data for Supabase
  const transformShipmentData = useCallback(
    (shipmentData: ShipmentFormData) => {
      const phoneDetails = getPhoneDetails(shipmentData.receiver.phone || "");

      const initialStatus = shipmentData.isPickupNeeded ? "Pick Up" : "Pending";
      const statusDescription = shipmentData.isPickupNeeded
        ? "Shipment is ready for pickup"
        : "Shipment has been created";

      const statusTimeline = [
        {
          status: initialStatus,
          updated_at: new Date().toISOString(),
          description: statusDescription,
        },
      ];

      return {
        shipment_type: shipmentData.shipmentType,
        shipment_country_code: shipmentData.country,
        warehouse_id: shipmentData.warehouseId,
        purchased_date: shipmentData.purchasedDate?.toISOString(),
        purchased_site: shipmentData.purchasedSite,
        notes: shipmentData.notes,

        receiver_first_name: shipmentData.receiver.firstName,
        receiver_last_name: shipmentData.receiver.lastName,
        receiver_company: shipmentData.receiver.company || "",
        receiver_tax: shipmentData.receiver.vatTax || "",
        receiver_phone: phoneDetails.nationalNumber || "",
        receiver_phone_code: phoneDetails.countryCode || "",
        receiver_email: shipmentData.receiver.email || "",
        receiver_address_line1: shipmentData.receiver.addressLine1,
        receiver_address_line2: shipmentData.receiver.addressLine2,
        receiver_address_line3: shipmentData.receiver.addressLine3 || "",
        receiver_address_line4: shipmentData.receiver.addressLine4 || "",
        receiver_postal_code: shipmentData.receiver.postalCode || "",
        receiver_country: shipmentData.receiver.receivingCountry || "",

        status_timeline: statusTimeline,
        invoice_urls: shipmentData.invoiceUrls || [],
        product_image_urls: shipmentData.productImageUrls || [],
        products: shipmentData.items.map((item) => ({
          url: item.productUrl,
          name: item.productName,
          note: item.productNote || "",
          price: item.price || 0,
          value_currency: item.valueCurrency || "INR",
          quantity: item.quantity || 1,
        })),

        source: "drop_and_ship",
      };
    },
    []
  );

  // Submit Handler
  const onSubmitHandler: SubmitHandler<OrderFormData> = async (data) => {
    console.log("Validated Form Data:", data);

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a shipment",
        variant: "destructive",
      });
      router.push("/");
      return;
    }

    try {
      setIsSubmitting(true);
      const transformedShipment = transformShipmentData(data.shipments[0]);
      const payload = {
        ...transformedShipment,
        drop_and_ship_add_ons: selectedAddOns,
        drop_and_ship_add_ons_total: addOnTotal,
      };

      const { data: responseData, error } = await supabase.functions.invoke(
        "drop-and-ship-order",
        {
          method: "POST",
          body: payload,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success",
        description: "Drop and Ship Order created successfully",
      });
      console.log("Drop and Ship Order created:", responseData);

      router.push("/shipments");
    } catch (error: any) {
      console.error("Error creating shipments:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic step labels based on service type
  const stepLabels = isWarehouseService
    ? ["Products", "Warehouse", "Delivery", "Add-ons", "Review"]
    : ["Products", "Delivery", "Add-ons", "Review"];

  if (isLoading || authIsLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar activePage="create-shipments" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading shipment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activePage="create-shipments" />

      <main className="flex-1 p-4 md:p-6 bg-gray-50">
        <div className="md:container md:max-w-6xl mx-auto">
          {/* Identity Verification Banner */}
          {!isVerified && (
            <Alert
              className={`mb-6 rounded-lg border p-4 ${
                isPending
                  ? "border-yellow-200 bg-yellow-50"
                  : isRejected
                  ? "border-red-200 bg-red-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 ${
                  isPending
                    ? "text-yellow-600"
                    : isRejected
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              />
              <AlertTitle
                className={`font-medium ${
                  isPending
                    ? "text-yellow-900"
                    : isRejected
                    ? "text-red-900"
                    : "text-yellow-900"
                }`}
              >
                {isPending
                  ? "Identity Verification Pending"
                  : isRejected
                  ? "Identity Verification Rejected"
                  : "Identity Verification Required"}
              </AlertTitle>
              <AlertDescription
                className={`flex flex-col gap-1 mt-1 ${
                  isPending
                    ? "text-yellow-700"
                    : isRejected
                    ? "text-red-700"
                    : "text-[#D48806]"
                }`}
              >
                <span className="mt-1 text-sm">
                  {isPending ? (
                    "Your identity verification is being reviewed. We'll notify you once it's processed. You cannot place orders until your identity is verified."
                  ) : isRejected ? (
                    <>
                      Your identity verification was rejected.
                      {verificationRejectionReason && (
                        <span className="block mt-1 font-medium">
                          Reason: {verificationRejectionReason}
                        </span>
                      )}{" "}
                      Please re-upload valid documents to proceed.
                    </>
                  ) : (
                    "You need to verify your identity before you can place a shipment order. Please complete the KYC verification process."
                  )}
                </span>
                {!isPending && (
                  <IdentityVerificationDialog
                    userId={user?.id ?? ""}
                    identityVerificationId={identityVerificationId ?? undefined}
                    verificationStatus={verificationStatus}
                    verificationRejectionReason={
                      verificationRejectionReason ?? undefined
                    }
                  >
                    <button
                      className={`underline text-sm font-medium w-fit p-0 h-auto ${
                        isRejected
                          ? "text-red-800 hover:text-red-900"
                          : "text-yellow-800 hover:text-yellow-900"
                      }`}
                    >
                      {isRejected
                        ? "Re-upload Documents"
                        : "Verify Identity Now"}
                    </button>
                  </IdentityVerificationDialog>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Page Title */}
          <div className="flex items-start justify-between">
            <div className="mb-6 space-y-1.5">
              <h1 className="text-[28px] font-medium leading-tight text-[#3f3f3f]">
                Create Shipment{" "}
                <span className="font-bold text-[#9c4cd2]">BUY2SEND</span>
              </h1>
              <p className="text-[14px] text-[#a2a2a2] mt-2">
                Step {currentStep} of {isWarehouseService ? 5 : 4}:{" "}
                {stepLabels[currentStep - 1]}
              </p>
            </div>
            <ServiceSelectionDialog>
              <Button className="gap-2" variant="outline">
                Change Service
              </Button>
            </ServiceSelectionDialog>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 ">
            <div className="flex items-center justify-between mb-2 ">
              {(isWarehouseService ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map(
                (step) => (
                  <div key={step} className="flex items-center ">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? "bg-[#9c4cd2] text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step < currentStep ? <Check size={16} /> : step}
                    </div>
                    {step < (isWarehouseService ? 5 : 4) && (
                      <div
                        className={` ${
                          isWarehouseService ? "w-[12rem]" : "w-[19rem]"
                        } h-1 mx-2 rounded ${
                          step < currentStep ? "bg-[#9c4cd2]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Step Content */}
          <form id="order-form" onSubmit={handleSubmit(onSubmitHandler)}>
            {currentStep === 1 && (
              <ProductsStep
                index={0}
                control={control}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                onNext={handleNext}
                isWarehouseService={isWarehouseService}
                getValues={getValues}
              />
            )}

            {currentStep === 2 && isWarehouseService && (
              <div className="space-y-6">
                <WarehouseSelectionStep
                  index={0}
                  control={control}
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                />
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Continue to Delivery
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && !isWarehouseService && (
              <div className="space-y-6">
                <ReceiverInfoTab
                  index={0}
                  control={control}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  countries={countries}
                />
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Continue to Add-ons
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && isWarehouseService && (
              <div className="space-y-6">
                <ReceiverInfoTab
                  index={0}
                  control={control}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  countries={countries}
                />
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Continue to Add-ons
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && !isWarehouseService && (
              <AddOnsStep
                baseAmount={baseAmount}
                selectedAddOns={selectedAddOns}
                onAddOnsChange={handleAddOnsChange}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 4 && isWarehouseService && (
              <AddOnsStep
                baseAmount={baseAmount}
                selectedAddOns={selectedAddOns}
                onAddOnsChange={handleAddOnsChange}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {(currentStep === 4 && !isWarehouseService) ||
            (currentStep === 5 && isWarehouseService) ? (
              <ReviewStep
                baseAmount={baseAmount}
                selectedAddOns={selectedAddOns}
                addOnTotal={addOnTotal}
                onBack={handleBack}
                onSubmit={async () => {
                  const reviewStep = isWarehouseService ? 5 : 4;
                  const isValid = await validateStep(reviewStep);
                  if (isValid) {
                    handleSubmit(onSubmitHandler)();
                  } else {
                    toast({
                      title: "Validation Error",
                      description: "Please fill in all required fields",
                      variant: "destructive",
                    });
                  }
                }}
                isSubmitting={isSubmitting}
              />
            ) : null}
          </form>
        </div>
      </main>
    </div>
  );
}

// Main export with Suspense boundary
export default function CreateShipmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <Navbar activePage="create-shipments" />
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p>Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <CreateShipmentPageContent />
    </Suspense>
  );
}
