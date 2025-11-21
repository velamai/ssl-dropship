"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PriceCalculationResult } from "@/lib/price-calculator";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { MapPin, Package, ShoppingBag } from "lucide-react";
import type {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { ItemsManagementTab } from "./items-management-tab";
import { ReceiverInfoTab } from "./receiver-info-tab";
import { ShipmentDetailsTab } from "./shipment-details-tab";
import { ShipmentSummary } from "./shipment-summary";

interface ShipmentCardProps {
  index: number;
  fieldId: string;
  countries: any[];
  courierServices: any[];
  shipmentType: string;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  getValues: UseFormGetValues<OrderFormData>;
  trigger: (name?: any) => Promise<boolean>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  expandedItems: { [key: string]: string | null };
  toggleItemExpansion: (itemUuid: string) => void;
  priceCalculationResult: PriceCalculationResult | undefined;
  onRemove: () => void;
  onPriceChange?: () => void;
  isVerified?: boolean;
}

export function ShipmentCard({
  index,
  fieldId,
  countries,
  courierServices,
  shipmentType,
  control,
  register,
  errors,
  watch,
  setValue,
  getValues,
  trigger,
  activeTab,
  setActiveTab,
  expandedItems,
  toggleItemExpansion,
  priceCalculationResult,
  onRemove,
  onPriceChange,
  isVerified = true,
}: ShipmentCardProps) {
  const watchedShipment = watch(`shipments.${index}`);
  const countryName =
    countries.find((c) => c.code === watchedShipment?.country)?.name ||
    "Select Country";
  const courierName =
    courierServices.find(
      (c) => (c.courier_service_id || c.id) === watchedShipment?.courierService
    )?.name || "Select Courier";
  const calculatedPrice =
    priceCalculationResult?.transportable &&
      priceCalculationResult?.prices?.[0]?.finalPrice
      ? priceCalculationResult.prices[0].finalPrice.toFixed(2)
      : "";
  const isTransportable =
    !priceCalculationResult || priceCalculationResult.transportable;
  const itemCount = watchedShipment?.items?.length ?? 0;
  const shipmentTitle = `Shipment #${index + 1}`;

  return (
    <AccordionItem
      value={`shipment-${fieldId}`}
      className="border rounded-lg overflow-hidden bg-white shadow-sm"
    >
      <AccordionTrigger className="px-4 md:px-6 py-4 hover:no-underline">
        <ShipmentSummary
          index={index}
          title={shipmentTitle}
          countryName={countryName}
          // weight={watchedShipment?.totalWeight?.toString() ?? ""}
          courierName={courierName}
          price={calculatedPrice}
          isTransportable={isTransportable}
          onRemove={onRemove}
          isDefault={index === 0}
          itemCount={itemCount}
        />
      </AccordionTrigger>
      <AccordionContent className="px-4 md:px-6 pt-2 pb-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab((prev) => ({ ...prev, [fieldId]: value }))
          }
          className="w-full"
        >
          <TabsList className=" hidden  mb-6 sm:grid w-full grid-cols-3 gap-2">
            <TabsTrigger
              value="details"
              className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Package className="h-4 w-4 mr-2" />
              Order Details
            </TabsTrigger>
            <TabsTrigger
              value="receiver"
              disabled={!isVerified}
              // className="text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
              className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Receiver Details
            </TabsTrigger>
            <TabsTrigger
              value="items"
              disabled={!isVerified}
              className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Product Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <ShipmentDetailsTab
              index={index}
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              getValues={getValues}
              countries={countries}
              courierServices={courierServices}
              shipmentType={shipmentType}
              priceCalculationResult={priceCalculationResult}
              trigger={trigger}
            />
          </TabsContent>

          <TabsContent value="receiver">
            <ReceiverInfoTab
              index={index}
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
            />
          </TabsContent>

          <TabsContent value="items">
            <ItemsManagementTab
              index={index}
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              expandedItems={expandedItems}
              toggleItemExpansion={toggleItemExpansion}
              onPriceChange={onPriceChange}
            />
          </TabsContent>
        </Tabs>
        {/* Prev / Next navigation */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const order = ["details", "receiver", "items"] as const;
              const currentIndex = order.indexOf(activeTab as any);
              const prev = order[Math.max(0, currentIndex - 1)];
              setActiveTab((prevTabs) => ({ ...prevTabs, [fieldId]: prev }));
            }}
            disabled={activeTab === "details"}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>

          {activeTab !== "items" && (
            <Button
              type="button"
              onClick={async () => {
                const order = ["details", "receiver", "items"] as const;
                const currentIndex = order.indexOf(activeTab as any);
                // Fields to validate per step
                const fieldsByStep: Record<string, string[]> = {
                  details: [
                    `shipments.${index}.shipmentType`,
                    `shipments.${index}.country`,
                    `shipments.${index}.receivingDate`,
                    `shipments.${index}.notes`,
                    `shipments.${index}.warehouseId`,
                  ],
                  receiver: [
                    `shipments.${index}.receiver.firstName`,
                    `shipments.${index}.receiver.lastName`,
                    `shipments.${index}.receiver.email`,
                    `shipments.${index}.receiver.addressLine1`,
                    `shipments.${index}.receiver.addressLine2`,
                    `shipments.${index}.receiver.postalCode`,
                    `shipments.${index}.receiver.phone`,
                  ],
                  items: [`shipments.${index}.items`],
                };
                const currentStep = order[currentIndex];
                const ok = await trigger(fieldsByStep[currentStep]);
                if (!ok) return;
                const next =
                  order[Math.min(order.length - 1, currentIndex + 1)];
                setActiveTab((prevTabs) => ({ ...prevTabs, [fieldId]: next }));
              }}
              className="w-full sm:w-auto"
              disabled={!isVerified}
            >
              Next
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
