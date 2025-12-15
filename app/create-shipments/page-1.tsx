"use client";

import { IdentityVerificationDialog } from "@/components/identity-verification-v2";
import { Navbar } from "@/components/navbar";
import { FormHeader } from "@/components/shipments/form-header";
import { ShipmentCard } from "@/components/shipments/shipment-card";
import { Accordion } from "@/components/ui/accordion";
import {
  ItemFormData,
  OrderFormData,
  OrderSchema,
  ShipmentFormData,
  getPhoneDetails,
} from "@/lib/schemas/shipmentSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";

import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { fetchCountries } from "@/lib/api-client";
import { fetchIdentityVerificationData } from "@/lib/api/identity";
import { type PriceCalculationResult } from "@/lib/price-calculator";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

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

export default function CreateShipmentPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
    mode: "onBlur", // Changed back to onBlur to avoid premature validation
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      shipments: [
        {
          shipmentType: "export",
          country: "",
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
        },
      ],
    },
  });

  const {
    fields: shipmentFields,
    append: appendShipment,
    remove: removeShipment,
  } = useFieldArray({
    control,
    name: "shipments",
    keyName: "fieldId",
  });
  // --- End React Hook Form Setup ---

  // State for UI interaction and fetched data
  const [activeTab, setActiveTab] = useState<{ [key: string]: string }>({});
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: string | null;
  }>({});
  const [countries, setCountries] = useState<any[]>([]);
  const [courierServices, setCourierServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Keep loading state for data fetching
  const [detailedCourierServices, setDetailedCourierServices] = useState<any[]>(
    []
  );
  const [priceCalculationResults, setPriceCalculationResults] = useState<{
    [key: string]: PriceCalculationResult;
  }>({});
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addOnTotal, setAddOnTotal] = useState(0);

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

    setTotalPrice(total);
  }, [getValues]);

  // Watch for changes in product items and update total price
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Check if the change is related to product items (price or quantity)
      if (name && (name.includes(".price") || name.includes(".quantity"))) {
        calculateTotalPrice();
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, calculateTotalPrice]);

  // Calculate initial total price
  useEffect(() => {
    calculateTotalPrice();
  }, [calculateTotalPrice]);

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

  // Fetch countries and courier services on component mount
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
          description:
            "Failed to load countries and courier services. Using default values.",
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
        setValue("shipments.0.courierService", "fedex", {
          shouldValidate: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [toast]);

  // Initialize active tab for each shipment
  useEffect(() => {
    const initialTabs: { [key: string]: string } = {};
    shipmentFields.forEach((field) => {
      if (!activeTab[field.fieldId]) {
        initialTabs[field.fieldId] = "details";
      }
    });

    if (Object.keys(initialTabs).length > 0) {
      setActiveTab((prev) => ({ ...prev, ...initialTabs }));
    }
  }, [shipmentFields, activeTab]);

  // Toggle item expansion
  const toggleItemExpansion = useCallback((itemUuid: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemUuid]: prev[itemUuid] === itemUuid ? null : itemUuid,
    }));
  }, []);

  // Add a new shipment
  const addShipment = useCallback(() => {
    appendShipment({
      shipmentType: "link",
      country: countries[0]?.code || "",
      warehouseId: undefined,
      courierService:
        courierServices[0]?.courier_service_id || courierServices[0]?.id || "",
      purchasedDate: undefined,
      purchasedSite: undefined,
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
      },
      items: [
        {
          uuid: generateUUID(),
          productUrl: "",
          productName: "",
          productNote: "",
          price: undefined,
          valueCurrency: "INR",
          quantity: undefined,
        },
      ],
      invoiceUrls: [],
      notes: "",
    });
  }, [appendShipment, countries, courierServices]);

  // Remove a shipment
  const handleRemoveShipment = useCallback(
    (index: number) => {
      if (shipmentFields.length <= 1) {
        toast({
          title: "Cannot Remove",
          description: "You must have at least one shipment.",
          variant: "destructive",
        });
        return;
      }
      removeShipment(index);

      const removedFieldId = shipmentFields[index]?.fieldId;
      if (removedFieldId) {
        setActiveTab((prev) => {
          const newTabs = { ...prev };
          delete newTabs[removedFieldId];
          return newTabs;
        });
        setPriceCalculationResults((prev) => {
          const newResults = { ...prev };
          delete newResults[removedFieldId];
          return newResults;
        });
      }
    },
    [removeShipment, shipmentFields, toast]
  );

  const handleAddOnsChange = useCallback(
    (addOns: string[], addOnAmount: number) => {
      setSelectedAddOns(addOns);
      setAddOnTotal(addOnAmount);
    },
    []
  );

  // Helper function to transform shipment data for Supabase
  const transformShipmentData = useCallback(
    (shipmentData: ShipmentFormData) => {
      // Extract phone details
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

  // Helper function to transform item data for Supabase
  const transformItemData = useCallback(
    (item: ItemFormData, shipmentId: string) => {
      return {
        shipment_id: shipmentId,
        product_url: item.productUrl,
        product_name: item.productName,
        product_note: item.productNote || "",
        declared_value: item.price || 0,
        value_currency: item.valueCurrency || "INR",
        quantity: item.quantity || 1,
        total_price: item.price || 0,
        source: "drop_and_ship",
      };
    },
    []
  );

  // --- Submit Handler ---
  // const onSubmitHandler: SubmitHandler<OrderFormData> = async (data) => {
  //   console.log("Validated Form Data:", data);

  //   if (!user) {
  //     toast({
  //       title: "Authentication required",
  //       description: "Please log in to create a shipment",
  //       variant: "destructive",
  //     });
  //     router.push("/");
  //     return;
  //   }

  //   const userId = user.id;

  //   try {
  //     // 1. Create logistics order
  //     const { data: orderData, error: orderError } = await supabase
  //       .from("logistics_orders")
  //       .insert({ user_id: userId, number_of_shipments: data.shipments.length })
  //       .select()
  //       .single();

  //     if (orderError) throw orderError;
  //     const orderId: string = orderData.logistics_order_id;
  //     console.log("Order ID:", orderId);

  //     const results = [];
  //     // 2. Process each shipment
  //     for (let i = 0; i < data.shipments.length; i++) {
  //       const shipmentData = data.shipments[i];
  //       const fieldId = shipmentFields[i]?.fieldId;
  //       const priceResult = fieldId
  //         ? priceCalculationResults[fieldId]
  //         : undefined;
  //       const transformedShipment = transformShipmentData(shipmentData);

  //       // Create shipment
  //       const { data: shipment, error: shipmentError } = await supabase
  //         .from("shipments")
  //         .insert(transformedShipment)
  //         .select()
  //         .single();

  //       if (shipmentError) throw shipmentError;
  //       const shipmentId: string = shipment.shipment_id;

  //       // 3. Process items
  //       if (shipmentData.items && shipmentData.items.length > 0) {
  //         const itemsToInsert = shipmentData.items.map((item) =>
  //           transformItemData(item, shipmentId)
  //         );
  //         const { data: items, error: itemsError } = await supabase
  //           .from("shipment_items")
  //           .insert(itemsToInsert)
  //           .select();

  //         if (itemsError) throw itemsError;
  //         results.push({ shipment, items });
  //       } else {
  //         results.push({ shipment, items: [] });
  //       }
  //     }

  //     toast({
  //       title: "Success",
  //       description: `Created ${results.length} shipment(s)`,
  //     });
  //     console.log("[Create Shipment] User state before navigation:", user);
  //     setShowTermsDialog(false); // Close dialog on success
  //     router.push("/shipments");
  //   } catch (error: any) {
  //     console.error("Error creating shipments:", error);
  //     toast({
  //       title: "Error",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //     setShowTermsDialog(false); // Close dialog on error
  //   }
  // };
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
      setShowTermsDialog(true); // Close dialog on success
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

      setShowTermsDialog(false); // Close dialog on success
      router.push("/shipments");
    } catch (error: any) {
      console.error("Error creating shipments:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setShowTermsDialog(false); // Close dialog on error
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- End Submit Handler ---

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
          {/* Identity Verification Banner - Shows for pending or not verified users */}
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
                {/* Show verify/re-upload button only for rejected or not submitted states */}
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

          <FormHeader
            totalPrice={totalPrice.toFixed(2)}
            isSubmitting={isSubmitting}
            showTermsDialog={showTermsDialog}
            setShowTermsDialog={setShowTermsDialog}
            onSubmit={() => {
              const form = document.getElementById(
                "order-form"
              ) as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }}
            onAddOnsChange={handleAddOnsChange}
            isVerified={isVerified}
          />

          <form
            id="order-form"
            onSubmit={handleSubmit(
              // Success callback - only runs if validation passes
              (data) => {
                // Submit the form data
                onSubmitHandler(data);
              }
            )}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Shipments</h3>
                <div className="flex gap-2">
                  {/* <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={addShipment}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Shipment
                  </Button> */}
                </div>
              </div>

              <Accordion
                type="multiple"
                defaultValue={shipmentFields.map(
                  (field) => `shipment-${field.fieldId}`
                )}
                className="space-y-6"
              >
                {shipmentFields.map((field, index) => (
                  <ShipmentCard
                    key={field.fieldId}
                    control={control}
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                    getValues={getValues}
                    trigger={trigger}
                    index={index}
                    fieldId={field.fieldId}
                    countries={countries}
                    courierServices={detailedCourierServices}
                    shipmentType={watch(`shipments.${index}.shipmentType`)}
                    activeTab={activeTab[field.fieldId] || "details"}
                    setActiveTab={setActiveTab}
                    expandedItems={expandedItems}
                    toggleItemExpansion={toggleItemExpansion}
                    priceCalculationResult={
                      priceCalculationResults[field.fieldId]
                    }
                    onRemove={() => handleRemoveShipment(index)}
                    onPriceChange={calculateTotalPrice}
                    isVerified={isVerified}
                  />
                ))}
              </Accordion>

              <div className="flex w-full justify-end">
                <Button
                  type="button"
                  onClick={() => setShowTermsDialog(true)}
                  className="gap-2 w-full sm:w-auto"
                  disabled={isSubmitting || !isVerified}
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
