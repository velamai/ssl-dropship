"use client";

import { CountryFlag } from "@/components/country-flag";
import { PriceDetails } from "@/components/price-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { PriceCalculationResult } from "@/lib/price-calculator";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { getCountryCode } from "@/lib/utils";
import {
  FileText,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  Package,
  Truck,
  Upload,
  User2,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  Control,
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { parsePhoneNumber } from "react-phone-number-input";

// Helper function to get phone details
const getPhoneDetails = (phone: string) => {
  if (!phone)
    return { nationalNumber: "", countryCode: "", country: "", isValid: false };

  try {
    const phoneNumber = parsePhoneNumber(phone);
    if (phoneNumber) {
      return {
        nationalNumber: phoneNumber.nationalNumber,
        countryCode: phoneNumber.countryCallingCode,
        country: phoneNumber.country || "",
        isValid: phoneNumber.isValid(),
      };
    }
  } catch (error) {
    console.error("Error parsing phone number:", error);
  }

  return { nationalNumber: "", countryCode: "", country: "", isValid: false };
};

interface ShipmentDetailsTabProps {
  index: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  getValues: UseFormGetValues<OrderFormData>;
  countries: any[];
  courierServices: any[];
  shipmentType: string;
  priceCalculationResult: PriceCalculationResult | undefined;
  trigger: (name?: any) => Promise<boolean>;
}

export function ShipmentDetailsTab({
  index,
  control,
  register,
  errors,
  watch,
  setValue,
  getValues,
  countries,
  courierServices: detailedCourierServices,
  shipmentType,
  priceCalculationResult,
  trigger,
}: ShipmentDetailsTabProps) {
  const [localFilePreviews, setLocalFilePreviews] = useState<{
    [key: string]: string;
  }>({});
  const [imageFiles, setImageFiles] = useState<{ [key: string]: boolean }>({});
  const [productImagePreviews, setProductImagePreviews] = useState<{
    [key: string]: string;
  }>({});

  // Fetch warehouses for selection
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();

  // Helper function to check if file is an image
  const isImageType = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  const watchedPackageType = watch(`shipments.${index}.packageType`);
  const watchedIsPickupNeeded = watch(`shipments.${index}.isPickupNeeded`);
  const watchedShipmentType = watch(`shipments.${index}.shipmentType`);
  const watchedWarehouseId = watch(`shipments.${index}.warehouseId`);

  const filteredCourierServices = useMemo(() => {
    if (!detailedCourierServices) return [];
    return detailedCourierServices.filter((service) => {
      return service.type === shipmentType || service.type === "both";
    });
  }, [detailedCourierServices, shipmentType]);

  // Effect to set default courier service when filter changes
  useEffect(() => {
    const currentCourierService = getValues(
      `shipments.${index}.courierService`
    );
    const isCurrentServiceValid = filteredCourierServices.some(
      (service) =>
        (service.courier_service_id || service.id) === currentCourierService
    );

    if (filteredCourierServices.length > 0 && !isCurrentServiceValid) {
      const firstServiceId =
        filteredCourierServices[0].courier_service_id ||
        filteredCourierServices[0].id;
      setValue(`shipments.${index}.courierService`, firstServiceId, {
        shouldValidate: true,
      });
    }
    // Add getValues to dependency array
  }, [filteredCourierServices, setValue, getValues, index]);

  // Effect to clear dimensions when package type changes to envelope
  useEffect(() => {
    if (watchedPackageType === "envelope") {
      setValue(`shipments.${index}.dimensions.length`, undefined, {
        shouldValidate: true,
      });
      setValue(`shipments.${index}.dimensions.width`, undefined, {
        shouldValidate: true,
      });
      setValue(`shipments.${index}.dimensions.height`, undefined, {
        shouldValidate: true,
      });
    }
  }, [watchedPackageType, setValue, index]);

  // Effect to clear pickup data when pickup is disabled
  useEffect(() => {
    if (!watchedIsPickupNeeded) {
      setValue(`shipments.${index}.pickup.addressLine1`, "", {
        shouldValidate: false,
      });
      setValue(`shipments.${index}.pickup.addressLine2`, "", {
        shouldValidate: false,
      });
      setValue(`shipments.${index}.pickup.addressLine3`, "", {
        shouldValidate: false,
      });
      setValue(`shipments.${index}.pickup.addressLine4`, "", {
        shouldValidate: false,
      });
      setValue(`shipments.${index}.pickup.postalCode`, "", {
        shouldValidate: false,
      });
      setValue(`shipments.${index}.pickup.date`, undefined, {
        shouldValidate: false,
      });
      setValue(`shipments.${index}.pickup.phoneNumber`, "", {
        shouldValidate: false,
      });
      setValue(`shipments.${index}.pickup.phoneCode`, "", {
        shouldValidate: false,
      });
      setValue(`shipments.${index}.pickup.instructions`, "", {
        shouldValidate: false,
      });
    }
  }, [watchedIsPickupNeeded, setValue, index]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Truck className="h-4 w-4 mr-2 text-primary" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`shipments.${index}.shipmentType`}>
                  Order Type
                </Label>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <div className="space-y-2">
                        <p className="font-semibold">Service Options:</p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>(a) Warehouse Service:</strong> Order
                            products from any online store and send them to our
                            warehouse in the selected country. Once received, we
                            forward the parcel to your destination address.
                          </p>
                          <p>
                            <strong>(b) Link-to-Ship Service:</strong> Share a
                            product link (e.g., Amazon, eBay, AliExpress), and
                            we will purchase the item on your behalf and ship it
                            directly to your destination.
                          </p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Controller
                name={`shipments.${index}.shipmentType`}
                control={control}
                defaultValue="link"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="link"
                        id={`shipments.${index}.shipmentType-link`}
                      />
                      <Label
                        htmlFor={`shipments.${index}.shipmentType-link`}
                        className="cursor-pointer font-normal"
                      >
                        Link to Ship service
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="warehouse"
                        id={`shipments.${index}.shipmentType-warehouse`}
                      />
                      <Label
                        htmlFor={`shipments.${index}.shipmentType-warehouse`}
                        className="cursor-pointer font-normal"
                      >
                        Warehouse service
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
              <ErrorMessage error={errors.shipments?.[index]?.shipmentType} />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`shipments.${index}.country`}>
                Receiving Country
              </Label>
              <Controller
                name={`shipments.${index}.country`}
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={`shipments.${index}.country`}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <ErrorMessage error={errors.shipments?.[index]?.country} />
            </div>

            {watchedShipmentType === "warehouse" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`shipments.${index}.purchasedDate`}>
                    Purchased Date *
                  </Label>
                  <Controller
                    name={`shipments.${index}.purchasedDate`}
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        name={field.name}
                        required
                      />
                    )}
                  />
                  <ErrorMessage
                    error={errors.shipments?.[index]?.purchasedDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`shipments.${index}.purchasedSite`}>
                    Purchased Site *
                  </Label>
                  <Input
                    id={`shipments.${index}.purchasedSite`}
                    {...register(`shipments.${index}.purchasedSite`)}
                    type="text"
                    placeholder="Enter purchased site"
                    list="purchased-sites"
                    autoComplete="off"
                  />
                  <ErrorMessage
                    error={errors.shipments?.[index]?.purchasedSite}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              {priceCalculationResult && (
                <div className="md:col-span-2 mt-4">
                  <PriceDetails result={priceCalculationResult} />
                </div>
              )}
            </div>

            {/* Notes */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" />
              Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {watchedShipmentType === "warehouse" && (
              <div className="mt-6 border-t border-border pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`shipments.${index}.invoiceUrl`}
                    className="text-sm font-semibold text-foreground"
                  >
                    Product Invoice
                  </Label>

                  {(getValues(`shipments.${index}.invoiceUrls`) || []).length >
                    0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setValue(`shipments.${index}.invoiceUrls`, [], {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setLocalFilePreviews({});
                        setImageFiles({});
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="relative group">
                  {/* Dropzone-like area */}
                  <label
                    htmlFor={`shipments.${index}.invoiceFile`}
                    className="relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-muted-foreground/40 rounded-xl cursor-pointer hover:border-primary/70 hover:bg-muted/40 transition-colors overflow-hidden"
                  >
                    {/* Background image with blur effect */}
                    {Object.keys(localFilePreviews).length > 0 && (
                      <div className="absolute inset-0">
                        {Object.values(localFilePreviews).map(
                          (preview, idx) => (
                            <img
                              key={idx}
                              src={preview}
                              alt="Preview"
                              className="w-full h-full object-cover filter blur-sm opacity-30"
                            />
                          )
                        )}
                      </div>
                    )}

                    {/* Content overlay */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                      <span className="text-sm text-muted-foreground group-hover:text-primary">
                        {Object.keys(localFilePreviews).length > 0
                          ? "Click to add more files"
                          : "Click to upload or drag PDF/Images here"}
                      </span>
                    </div>
                    <Input
                      id={`shipments.${index}.invoiceFile`}
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;

                        // Set local previews for images
                        const newPreviews = { ...localFilePreviews };
                        const newImageFiles = { ...imageFiles };

                        for (const file of files) {
                          const fileIsImage = isImageType(file.type);
                          const fileId = `${file.name}-${
                            file.size
                          }-${Date.now()}`;
                          newImageFiles[fileId] = fileIsImage;

                          if (fileIsImage) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              newPreviews[fileId] = e.target?.result as string;
                              setLocalFilePreviews(newPreviews);
                            };
                            reader.readAsDataURL(file);
                          }
                        }

                        setImageFiles(newImageFiles);

                        try {
                          // Get signed URLs for all files
                          const fileTypes = files.map(
                            (file) => file.type || "application/pdf"
                          );
                          const res = await fetch("/api/invoice-signed-url", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              fileTypes,
                            }),
                          });
                          if (!res.ok)
                            throw new Error("Failed to get signed URLs");
                          const { results } = await res.json();

                          // Upload all files
                          const uploadPromises = files.map(
                            async (file, idx) => {
                              const { signedUrl, publicUrl } = results[idx];
                              const putRes = await fetch(signedUrl, {
                                method: "PUT",
                                headers: {
                                  "Content-Type":
                                    file.type || "application/pdf",
                                },
                                body: file,
                              });
                              if (!putRes.ok)
                                throw new Error(
                                  `Failed to upload file: ${file.name}`
                                );
                              return publicUrl;
                            }
                          );

                          const uploadedUrls = await Promise.all(
                            uploadPromises
                          );

                          // Update form with all URLs
                          const currentUrls =
                            getValues(`shipments.${index}.invoiceUrls`) || [];
                          setValue(
                            `shipments.${index}.invoiceUrls`,
                            [...currentUrls, ...uploadedUrls],
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        } catch (err) {
                          console.error(err);
                          // Clear previews on error
                          setLocalFilePreviews({});
                          setImageFiles({});
                        } finally {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>

                  {/* Preview area */}
                  {(getValues(`shipments.${index}.invoiceUrls`) || []).length >
                    0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {getValues(`shipments.${index}.invoiceUrls`)?.map(
                        (url: string, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-border bg-muted/30"
                          >
                            {Object.values(localFilePreviews).length > idx ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={Object.values(localFilePreviews)[idx]}
                                  alt="Uploaded file preview"
                                  className="size-20 object-cover rounded border"
                                />

                                {/* <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const currentUrls =
                                    getValues(
                                      `shipments.${index}.invoiceUrls`
                                    ) || [];
                                  const newUrls = currentUrls.filter(
                                    (_, i) => i !== idx
                                  );
                                  setValue(
                                    `shipments.${index}.invoiceUrls`,
                                    newUrls,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                  const newPreviews = { ...localFilePreviews };
                                  delete Object.keys(newPreviews)[idx];
                                  setLocalFilePreviews(newPreviews);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button> */}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-foreground">
                                    PDF uploaded successfully
                                  </p>
                                  <p className="text-xs text-muted-foreground break-all">
                                    {url}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    const currentUrls =
                                      getValues(
                                        `shipments.${index}.invoiceUrls`
                                      ) || [];
                                    const newUrls = currentUrls.filter(
                                      (_, i) => i !== idx
                                    );
                                    setValue(
                                      `shipments.${index}.invoiceUrls`,
                                      newUrls,
                                      {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      }
                                    );
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`shipments.${index}.notes`}>Order Notes</Label>
              <Textarea
                id={`shipments.${index}.notes`}
                {...register(`shipments.${index}.notes`)}
                placeholder="Add any notes for this order"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Images Upload Card */}
      {watchedShipmentType === "warehouse" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Package className="h-4 w-4 mr-2 text-primary" />
              Product Images (Max 10)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mt-6 border-t border-border pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`shipments.${index}.productImageFile`}
                  className="text-sm font-semibold text-foreground"
                >
                  Upload Product Images
                </Label>

                {(getValues(`shipments.${index}.productImageUrls`) || [])
                  .length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setValue(`shipments.${index}.productImageUrls`, [], {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setProductImagePreviews({});
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="relative group">
                {/* Dropzone-like area */}
                <label
                  htmlFor={`shipments.${index}.productImageFile`}
                  className="relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-muted-foreground/40 rounded-xl cursor-pointer hover:border-primary/70 hover:bg-muted/40 transition-colors overflow-hidden"
                >
                  {/* Background image with blur effect */}
                  {Object.keys(productImagePreviews).length > 0 && (
                    <div className="absolute inset-0">
                      {Object.values(productImagePreviews).map(
                        (preview, idx) => (
                          <img
                            key={idx}
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover filter blur-sm opacity-30"
                          />
                        )
                      )}
                    </div>
                  )}

                  {/* Content overlay */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                    <span className="text-sm text-muted-foreground group-hover:text-primary">
                      {Object.keys(productImagePreviews).length > 0
                        ? `${
                            Object.keys(productImagePreviews).length
                          }/10 images - Click to add more`
                        : "Click to upload or drag images here (Max 10)"}
                    </span>
                  </div>
                  <Input
                    id={`shipments.${index}.productImageFile`}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;

                      const currentUrls =
                        getValues(`shipments.${index}.productImageUrls`) || [];
                      const totalImages = currentUrls.length + files.length;

                      if (totalImages > 10) {
                        alert(
                          `Cannot upload more than 10 images. You have ${currentUrls.length} images and trying to add ${files.length}.`
                        );
                        return;
                      }

                      // Set local previews for images
                      const newPreviews = { ...productImagePreviews };

                      for (const file of files) {
                        const fileId = `${file.name}-${
                          file.size
                        }-${Date.now()}`;

                        const reader = new FileReader();
                        reader.onload = (e) => {
                          newPreviews[fileId] = e.target?.result as string;
                          setProductImagePreviews(newPreviews);
                        };
                        reader.readAsDataURL(file);
                      }

                      try {
                        // Get signed URLs for all files
                        const fileTypes = files.map(
                          (file) => file.type || "image/jpeg"
                        );
                        const res = await fetch("/api/invoice-signed-url", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            fileTypes,
                            uploadType: "product-images",
                          }),
                        });
                        if (!res.ok)
                          throw new Error("Failed to get signed URLs");
                        const { results } = await res.json();

                        // Upload all files
                        const uploadPromises = files.map(async (file, idx) => {
                          const { signedUrl, publicUrl } = results[idx];
                          const putRes = await fetch(signedUrl, {
                            method: "PUT",
                            headers: {
                              "Content-Type": file.type || "image/jpeg",
                            },
                            body: file,
                          });
                          if (!putRes.ok)
                            throw new Error(
                              `Failed to upload file: ${file.name}`
                            );
                          return publicUrl;
                        });

                        const uploadedUrls = await Promise.all(uploadPromises);

                        // Update form with all URLs
                        const updatedUrls = [...currentUrls, ...uploadedUrls];
                        setValue(
                          `shipments.${index}.productImageUrls`,
                          updatedUrls,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      } catch (err) {
                        console.error(err);
                        // Clear previews on error
                        setProductImagePreviews({});
                      } finally {
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </label>

                {/* Preview area */}
                {(getValues(`shipments.${index}.productImageUrls`) || [])
                  .length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {getValues(`shipments.${index}.productImageUrls`)?.map(
                      (url: string, idx: number) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-border bg-muted/30"
                        >
                          {Object.values(productImagePreviews).length > idx ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={Object.values(productImagePreviews)[idx]}
                                alt="Product image preview"
                                className="size-20 object-cover rounded border"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <img
                                src={url}
                                alt="Product image"
                                className="size-20 object-cover rounded border"
                              />

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const currentUrls =
                                    getValues(
                                      `shipments.${index}.productImageUrls`
                                    ) || [];
                                  const newUrls = currentUrls.filter(
                                    (_, i) => i !== idx
                                  );
                                  setValue(
                                    `shipments.${index}.productImageUrls`,
                                    newUrls,
                                    {
                                      shouldValidate: true,
                                      shouldDirty: true,
                                    }
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {`${
                  (getValues(`shipments.${index}.productImageUrls`) || [])
                    .length
                }/10 images uploaded`}
              </p>
              <ErrorMessage
                error={errors.shipments?.[index]?.productImageUrls}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warehouse Selection Card */}
      {watchedShipmentType === "warehouse" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Warehouse className="h-4 w-4 mr-2 text-primary" />
              Warehouse Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {warehousesLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading warehouses...
                </div>
              </div>
            ) : warehouses && warehouses.data.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {warehouses.data.map((warehouse: any) => (
                  <div
                    key={warehouse.warehouse_id}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                      watchedWarehouseId === warehouse.warehouse_id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setValue(
                        `shipments.${index}.warehouseId`,
                        warehouse.warehouse_id,
                        {
                          shouldValidate: true,
                        }
                      );
                    }}
                  >
                    {/* Radio button indicator */}
                    <div className="absolute top-3 right-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          watchedWarehouseId === warehouse.warehouse_id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {watchedWarehouseId === warehouse.warehouse_id && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Header with warehouse name and country */}
                    <div className="pb-3 border-b border-border mb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <CountryFlag
                          countryCode={getCountryCode(warehouse.country)}
                          size="md"
                        />
                        <div className="flex-1 pr-6">
                          <h3 className="font-semibold text-sm">
                            {warehouse.name || "Unnamed Warehouse"}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Information rows with icons */}
                    <div className="space-y-2 text-xs">
                      {/* User Name */}
                      <div className="flex items-start gap-2">
                        <User2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Name:</p>
                          <p className="text-xs font-medium text-foreground break-words">
                            {warehouses?.userFirstName}{" "}
                            {warehouses?.userLastName}{" "}
                            {`${warehouse.country_code}${warehouses.userWarehouseId}`}
                          </p>
                        </div>
                      </div>

                      {/* Address Line 1 */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Address:
                          </p>
                          <p className="text-xs font-medium text-foreground break-words">
                            {warehouse.address_line1}{" "}
                            {`${warehouse.country_code}${warehouses.userWarehouseId}`}
                          </p>
                        </div>
                      </div>

                      {/* Address Line 2 */}
                      {warehouse.address_line2 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground break-words">
                              {warehouse.address_line2}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* City */}
                      {warehouse.address_line3 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                              City:
                            </p>
                            <p className="text-xs font-medium text-foreground">
                              {warehouse.address_line3}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Zip Code */}
                      <div className="flex items-start gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            Zip Code:
                          </p>
                          <p className="text-xs font-medium text-foreground">
                            {warehouse.postal_code}
                          </p>
                        </div>
                      </div>

                      {/* Country */}
                      <div className="flex items-start gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            Country:
                          </p>
                          <p className="text-xs font-medium text-foreground">
                            {warehouse.country}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground">
                  No warehouses available
                </div>
              </div>
            )}
            <ErrorMessage error={errors.shipments?.[index]?.warehouseId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
