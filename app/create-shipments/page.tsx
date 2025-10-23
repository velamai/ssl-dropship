"use client";

import { Navbar } from "@/components/navbar";
import { FormHeader } from "@/components/shipments/form-header";
import { ShipmentCard } from "@/components/shipments/shipment-card";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ItemFormData,
  OrderFormData,
  OrderSchema,
  ShipmentFormData,
  getPhoneDetails,
} from "@/lib/schemas/shipmentSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";

import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchCountries,
  fetchCourierServices,
  fetchCurrencies,
} from "@/lib/api-client";
import {
  calculatePrice,
  type PriceCalculationResult,
} from "@/lib/price-calculator";
import { getSupabaseBrowserClient } from "@/lib/supabase";

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

  // --- React Hook Form Setup ---
  // MUST call useForm *before* useFieldArray because useFieldArray needs 'control'
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
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
          courierService: "",
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
              price: undefined,
              quantity: undefined,
            },
          ],
        },
      ],
    },
  });

  // Field Array for managing dynamic shipments - uses 'control' from useForm
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
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [detailedCourierServices, setDetailedCourierServices] = useState<any[]>(
    []
  );
  const [priceCalculationResults, setPriceCalculationResults] = useState<{
    [key: string]: PriceCalculationResult;
  }>({});
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  // Calculate total price based on shipment details
  const calculateShipmentPrice = useCallback(
    (shipmentIndex: number) => {
      const shipmentData = getValues(`shipments.${shipmentIndex}`);
      if (!shipmentData) return "0.00";

      const { country, courierService, dimensions: dims } = shipmentData;
      const shipmentType = "export";
      const fieldId = shipmentFields[shipmentIndex]?.fieldId;

      console.log(
        `[Price Calc] Inputs for shipment index ${shipmentIndex} (ID: ${fieldId}):`,
        {
          country,
          courierService,
          currenciesLoaded: currencies.length > 0,
          servicesLoaded: detailedCourierServices.length > 0,
        }
      );

      const { length, width, height } = dims || {};
      const hasAllDimensions =
        length && width && height && length > 0 && width > 0 && height > 0;

      const canCalculatePrice = country && courierService;

      if (!canCalculatePrice) {
        console.log(
          `[Price Calc] Missing required fields for shipment ${fieldId}`
        );
        return "0.00";
      }

      const volume = hasAllDimensions ? (length * width * height) / 1000000 : 0;

      const calculatorInput = {
        from: "IN",
        selected_to: country,
        selected_courier_service: courierService,
        selected_type: shipmentType,
        selected_volume: volume,
        currency: currencies,
        Allcourierservicesdata: detailedCourierServices,
      };

      console.log(
        `[Price Calc] Calculator input for shipment ${fieldId}:`,
        JSON.stringify(calculatorInput)
      );

      const result = calculatePrice(calculatorInput);

      console.log(`[Price Calc] Result for shipment ${fieldId}:`, result);

      if (fieldId) {
        setPriceCalculationResults((prev) => ({
          ...prev,
          [fieldId]: result,
        }));
      }

      if (result.transportable && result.prices && result.prices.length > 0) {
        return result.prices[0].finalPrice.toFixed(2);
      }

      return "0.00";
    },
    [
      getValues,
      currencies,
      detailedCourierServices,
      calculatePrice,
      shipmentFields,
    ]
  );

  // Calculate total order price using useMemo for derived state
  const totalPrice = useMemo(() => {
    return shipmentFields
      .reduce((total, shipmentField) => {
        const result = priceCalculationResults[shipmentField.fieldId];
        if (
          result?.transportable &&
          result.prices &&
          result.prices.length > 0
        ) {
          return total + result.prices[0].finalPrice;
        }
        return total;
      }, 0)
      .toFixed(2);
  }, [shipmentFields, priceCalculationResults]);

  // Check if any shipments cannot be transported
  const hasNonTransportableShipments = useCallback(() => {
    return shipmentFields.some(
      (field) =>
        priceCalculationResults[field.fieldId] &&
        !priceCalculationResults[field.fieldId].transportable
    );
  }, [shipmentFields, priceCalculationResults]);

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
        const [countriesData, courierServicesData, currenciesData] =
          await Promise.all([
            fetchCountries(),
            fetchCourierServices(),
            fetchCurrencies(),
          ]);

        console.log("[Data Loading] Countries:", countriesData.slice(0, 2));
        console.log(
          "[Data Loading] Courier Services:",
          courierServicesData.slice(0, 2)
        );
        console.log("[Data Loading] Currencies:", currenciesData.slice(0, 2));

        setCountries(countriesData);
        setCourierServices(courierServicesData);
        setDetailedCourierServices(courierServicesData);
        setCurrencies(currenciesData);

        if (countriesData.length > 0) {
          setValue("shipments.0.country", countriesData[0].code, {
            shouldValidate: true,
          });
        }

        if (courierServicesData.length > 0) {
          console.log(
            "[Data Loading] Courier Services:",
            courierServicesData[0]
          );
          const serviceId =
            courierServicesData[0].courier_service_id ||
            courierServicesData[0].id;
          console.log("[Data Loading] Using courier service ID:", serviceId);
          setValue(`shipments.0.courierService` as any, serviceId as any, {
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

        const defaultCourierServices = [
          { id: "fedex", name: "FedEx" },
          { id: "dhl", name: "DHL" },
          { id: "ups", name: "UPS" },
        ];

        setCountries(defaultCountries);
        setCourierServices(defaultCourierServices);

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
      receivingDate: new Date(),
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
          price: undefined,
          quantity: undefined,
        },
      ],
      invoiceUrl: undefined,
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

  // Helper function to transform shipment data for Supabase
  const transformShipmentData = useCallback(
    (
      shipmentData: ShipmentFormData,
      userId: string,
      orderId: string,
      priceResult: PriceCalculationResult | undefined
    ) => {
      const { length, width, height } = shipmentData.dimensions;
      const packageVolume =
        typeof length === "number" &&
        typeof width === "number" &&
        typeof height === "number"
          ? length * width * height // Store directly in cm³
          : 0;

      const shipmentPrice = priceResult?.prices?.[0]?.finalPrice || 0;
      const weightPrice = priceResult?.prices?.[0]?.weightPrice || 0;
      const dimensionalPrice = priceResult?.prices?.[0]?.dimensionPrice || 0;

      // Extract phone details
      const phoneDetails = getPhoneDetails(shipmentData.receiver.phone || "");
      console.log("Phone details for receiver:", phoneDetails);

      console.log("Final Prices:", {
        shipmentPrice,
        weightPrice,
        dimensionalPrice,
      });

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
        user_id: userId,
        order_id: orderId,
        shipment_type: shipmentData.shipmentType,
        shipment_country_code: shipmentData.country,
        warehouse_id: shipmentData.warehouseId,
        purchased_date: shipmentData.purchasedDate?.toISOString(),
        purchased_site: shipmentData.purchasedSite,
        receiving_date: shipmentData.receivingDate?.toISOString(),
        notes: shipmentData.notes,
        shipment_courier_service_id: shipmentData.courierService,
        package_type: shipmentData.packageType,
        package_length: shipmentData.dimensions.length || 0,
        package_width: shipmentData.dimensions.width || 0,
        package_height: shipmentData.dimensions.height || 0,
        package_volume: packageVolume,
        is_pickup_needed: shipmentData.isPickupNeeded,

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

        pickup_address_line1: shipmentData.isPickupNeeded
          ? shipmentData.pickup?.addressLine1
          : null,
        pickup_address_line2: shipmentData.isPickupNeeded
          ? shipmentData.pickup?.addressLine2 || null
          : null,
        pickup_address_line3: shipmentData.isPickupNeeded
          ? shipmentData.pickup?.addressLine3 || null
          : null,
        pickup_address_line4: shipmentData.isPickupNeeded
          ? shipmentData.pickup?.addressLine4 || null
          : null,
        pickup_country: shipmentData.isPickupNeeded
          ? shipmentData.country
          : null,
        pickup_date: shipmentData.isPickupNeeded
          ? shipmentData.pickup?.date?.toISOString()
          : null,
        pickup_phonenumber: shipmentData.isPickupNeeded
          ? getPhoneDetails(shipmentData.pickup?.phoneNumber || "")
              .nationalNumber
          : null,
        pickup_phone_code: shipmentData.isPickupNeeded
          ? shipmentData.pickup?.phoneCode || ""
          : null,
        pickup_instructions: shipmentData.isPickupNeeded
          ? shipmentData.pickup?.instructions || null
          : null,
        pickup_postalcode: shipmentData.isPickupNeeded
          ? shipmentData.pickup?.postalCode
          : null,

        status_timeline: statusTimeline,

        source: "logistics",
        current_status: initialStatus,
        ecommerce_order_total_price: 0,
        grand_total: shipmentPrice,
        shipment_price: shipmentPrice,
        shipment_dimentional_price: dimensionalPrice,
        shipment_weight_price: weightPrice,
        payment_charges: 0,
        price_details_advance_paid: 0,
        price_details_arrears_amount: 0,
        price_details_discount: 0,
        price_details_other_charges: 0,
        price_details_packing_charges: 0,
        price_details_quantity: 0,
        price_details_tax: 0,
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
        declared_value: item.price || 0,
        quantity: item.quantity || 1,
        total_price: item.price || 0,
        source: "drop_and_ship",
      };
    },
    []
  );

  // --- Submit Handler ---
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

    const userId = user.id;

    try {
      // 1. Create logistics order
      const { data: orderData, error: orderError } = await supabase
        .from("logistics_orders")
        .insert({ user_id: userId, number_of_shipments: data.shipments.length })
        .select()
        .single();

      if (orderError) throw orderError;
      const orderId: string = orderData.logistics_order_id;
      console.log("Order ID:", orderId);

      const results = [];
      // 2. Process each shipment
      for (let i = 0; i < data.shipments.length; i++) {
        const shipmentData = data.shipments[i];
        const fieldId = shipmentFields[i]?.fieldId;
        const priceResult = fieldId
          ? priceCalculationResults[fieldId]
          : undefined;
        const transformedShipment = transformShipmentData(
          shipmentData,
          userId,
          orderId,
          priceResult
        );

        // Create shipment
        const { data: shipment, error: shipmentError } = await supabase
          .from("shipments")
          .insert(transformedShipment)
          .select()
          .single();

        if (shipmentError) throw shipmentError;
        const shipmentId: string = shipment.shipment_id;

        // 3. Process items
        if (shipmentData.items && shipmentData.items.length > 0) {
          const itemsToInsert = shipmentData.items.map((item) =>
            transformItemData(item, shipmentId)
          );
          const { data: items, error: itemsError } = await supabase
            .from("shipment_items")
            .insert(itemsToInsert)
            .select();

          if (itemsError) throw itemsError;
          results.push({ shipment, items });
        } else {
          results.push({ shipment, items: [] });
        }
      }

      toast({
        title: "Success",
        description: `Created ${results.length} shipment(s)`,
      });
      console.log("[Create Shipment] User state before navigation:", user);
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
    }
  };
  // --- End Submit Handler ---

  // Price Calculation Trigger Effect
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const nameString = name || "";
      if (
        nameString.match(
          /^shipments\.\d+\.(country|totalWeight|courierService|dimensions)/
        )
      ) {
        const shipmentIndexMatch = nameString.match(/^shipments\.(\d+)/);
        if (shipmentIndexMatch && shipmentIndexMatch[1]) {
          const shipmentIndex = parseInt(shipmentIndexMatch[1], 10);
          if (!isNaN(shipmentIndex) && shipmentIndex < shipmentFields.length) {
            // Check index validity
            console.log(
              `[Price Trigger] Change detected in shipment index ${shipmentIndex}, field: ${nameString}`
            );
            if (currencies.length > 0 && detailedCourierServices.length > 0) {
              calculateShipmentPrice(shipmentIndex);
            } else {
              console.log(
                `[Price Trigger] Skipping calculation for index ${shipmentIndex} - dependencies not loaded.`
              );
            }
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [
    watch,
    calculateShipmentPrice,
    currencies,
    detailedCourierServices,
    shipmentFields.length,
  ]); // Add shipmentFields.length dependency

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
          <FormHeader
            totalPrice={totalPrice}
            hasNonTransportableShipments={hasNonTransportableShipments()}
            isSubmitting={isSubmitting}
            showTermsDialog={showTermsDialog}
            setShowTermsDialog={setShowTermsDialog}
            onSubmit={() => {
              // Programmatically trigger form submission
              const form = document.getElementById(
                "order-form"
              ) as HTMLFormElement;
              if (form) {
                form.requestSubmit();
              }
            }}
          />

          {/* handleSubmit(onSubmitHandler) */}
          <form
            id="order-form"
            onSubmit={handleSubmit(
              // Success callback - only runs if validation passes
              (data) => {
                console.log("✅ VALIDATION PASSED - All form values:", data);
                console.log("Shipments:", data.shipments);
                // console.log(JSON.stringify(data));

                // Print specific shipment details
                data.shipments.forEach((shipment, index) => {
                  console.log(`Shipment ${index + 1}:`, {
                    shipmentType: shipment.shipmentType,
                    country: shipment.country,
                    warehouseId: shipment.warehouseId,
                    purchasedDate: shipment.purchasedDate,
                    purchasedSite: shipment.purchasedSite,
                    receivingDate: shipment.receivingDate,
                    notes: shipment.notes,
                    courierService: shipment.courierService,
                    receiver: shipment.receiver,
                    items: shipment.items,
                  });
                });

                // Submit the form data
                onSubmitHandler(data);
              },
              // Error callback - runs if validation fails
              (errors) => {
                console.log("❌ VALIDATION FAILED");
                console.log("Validation errors:", errors);

                // Get current form values even with validation errors
                const currentValues = getValues();
                console.log(
                  "Current form values (with errors):",
                  currentValues
                );

                // Show only dimension validation errors in toast messages
                const dimensionErrorMessages: string[] = [];

                // Log all errors but only collect dimension errors for toast

                // Show toast only for dimension validation errors
                if (dimensionErrorMessages.length > 0) {
                  toast({
                    title: "📦 Dimension Validation Error",
                    description: (
                      <div className="space-y-1">
                        {dimensionErrorMessages.map((msg, idx) => (
                          <div key={idx} className="text-sm">
                            {msg}
                          </div>
                        ))}
                      </div>
                    ),
                    variant: "destructive",
                    duration: 6000,
                  });
                }
              }
            )}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Shipments</h3>
                <div className="flex gap-2">
                  {/* <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      console.log("🧪 MANUAL VALIDATION TEST");
                      const isValid = await handleSubmit(
                        () => {
                          console.log("✅ Form is valid!");
                          toast({
                            title: "✅ Validation Passed",
                            description: "All form fields are valid!",
                            variant: "default",
                          });
                        },
                        (errors) => {
                          console.log("❌ Form has errors:", errors);

                          // Show only dimension validation errors in toast for test
                          const dimensionErrorMessages: string[] = [];

                          if (errors.shipments) {
                            errors.shipments.forEach(
                              (shipmentErrors, index) => {
                                if (shipmentErrors) {
                                  // Only collect dimensions errors for toast
                                  if (shipmentErrors.dimensions) {
                                    // Check for nested error structure
                                    let errorMessage = null;
                                    if (
                                      typeof shipmentErrors.dimensions
                                        .message === "string"
                                    ) {
                                      errorMessage =
                                        shipmentErrors.dimensions.message;
                                    } else if (
                                      shipmentErrors.dimensions.root?.message
                                    ) {
                                      errorMessage =
                                        shipmentErrors.dimensions.root.message;
                                    }

                                    if (errorMessage) {
                                      dimensionErrorMessages.push(
                                        `Shipment ${index + 1}: ${errorMessage}`
                                      );
                                    }
                                  }
                                }
                              }
                            );
                          }

                          if (dimensionErrorMessages.length > 0) {
                            toast({
                              title: "🧪 Dimension Test Failed",
                              description: (
                                <div className="space-y-1">
                                  {dimensionErrorMessages.map((msg, idx) => (
                                    <div key={idx} className="text-sm">
                                      {msg}
                                    </div>
                                  ))}
                                </div>
                              ),
                              variant: "destructive",
                              duration: 6000,
                            });
                          } else {
                            // Only show dimension success if there are NO validation errors at all
                            // If there are other errors but no dimension errors, don't show anything
                            console.log(
                              "No dimension errors found in validation test"
                            );
                          }
                        }
                      )();
                    }}
                  >
                    Test Validation
                  </Button> */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={addShipment}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Shipment
                  </Button>
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
                  />
                ))}
              </Accordion>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="gap-1"
                  type="button"
                  onClick={addShipment}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Another Shipment
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
