"use client";

import { PriceDetails } from "@/components/price-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PriceCalculationResult } from "@/lib/price-calculator";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { FileText, Package, Truck, Upload, X } from "lucide-react";
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
}: ShipmentDetailsTabProps) {
  const [localFilePreviews, setLocalFilePreviews] = useState<{
    [key: string]: string;
  }>({});
  const [imageFiles, setImageFiles] = useState<{ [key: string]: boolean }>({});

  // Helper function to check if file is an image
  const isImageType = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  const watchedPackageType = watch(`shipments.${index}.packageType`);
  const watchedIsPickupNeeded = watch(`shipments.${index}.isPickupNeeded`);
  const watchedShipmentType = watch(`shipments.${index}.shipmentType`);

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

  const watchedDimensions = watch(`shipments.${index}.dimensions`);
  const calculateDimensionalVolume = () => {
    const { length, width, height } = watchedDimensions || {};
    if (
      typeof length === "number" &&
      typeof width === "number" &&
      typeof height === "number" &&
      length > 0 &&
      width > 0 &&
      height > 0
    ) {
      return (length * width * height).toFixed(2);
    }
    return null;
  };

  return (
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
            <Label htmlFor={`shipments.${index}.shipmentType`}>
              Order Type
            </Label>
            <Controller
              name={`shipments.${index}.shipmentType`}
              control={control}
              defaultValue="link"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id={`shipments.${index}.shipmentType`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link to Ship service</SelectItem>
                    <SelectItem value="warehouse">Warehouse service</SelectItem>
                  </SelectContent>
                </Select>
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
            <Label htmlFor={`shipments.${index}.receivingDate`}>
              Expected Receiving Date *
            </Label>
            <Controller
              name={`shipments.${index}.receivingDate`}
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
            <ErrorMessage error={errors.shipments?.[index]?.receivingDate} />
          </div>

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
                  Product Invoice (PDF/Images)
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
                      {Object.values(localFilePreviews).map((preview, idx) => (
                        <img
                          key={idx}
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover filter blur-sm opacity-30"
                        />
                      ))}
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
                        const uploadPromises = files.map(async (file, idx) => {
                          const { signedUrl, publicUrl } = results[idx];
                          const putRes = await fetch(signedUrl, {
                            method: "PUT",
                            headers: {
                              "Content-Type": file.type || "application/pdf",
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
  );
}
