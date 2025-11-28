"use client";

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
import {
  CURRENCY_OPTIONS,
  type CurrencyCode,
  type OrderFormData,
} from "@/lib/schemas/shipmentSchema";
import { fetchProductData, isEcommerceDomain } from "@/lib/product-scraper";
import { AlertTriangle, ChevronDown, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

interface ShipmentItemProps {
  shipmentIndex: number;
  itemIndex: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  showDeleteButton?: boolean;
}

export function ShipmentItem({
  shipmentIndex,
  itemIndex,
  control,
  register,
  errors,
  watch,
  setValue,
  isExpanded,
  onToggleExpand,
  onDelete,
  showDeleteButton = true,
}: ShipmentItemProps) {
  const itemProductUrl = watch(
    `shipments.${shipmentIndex}.items.${itemIndex}.productUrl`
  );
  const itemProductName = watch(
    `shipments.${shipmentIndex}.items.${itemIndex}.productName`
  );
  const itemImageUrl = watch(
    `shipments.${shipmentIndex}.items.${itemIndex}.imageUrl`
  );

  // State for loading and debouncing
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isUnsupportedDomain, setIsUnsupportedDomain] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Watch for productUrl changes and trigger scraping
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't scrape if URL is empty or invalid
    if (!itemProductUrl || itemProductUrl.trim() === "") {
      setIsUnsupportedDomain(false);
      return;
    }

    // Validate URL format and check domain
    try {
      const urlObj = new URL(itemProductUrl);
      const hostname = urlObj.hostname.toLowerCase();
      const domainCheck = isEcommerceDomain(hostname);
      setIsUnsupportedDomain(!domainCheck.valid);
    } catch {
      // Invalid URL format, don't scrape
      setIsUnsupportedDomain(false);
      return;
    }

    // Debounce the API call (wait 700ms after user stops typing)
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingProduct(true);
      try {
        const productData = await fetchProductData(itemProductUrl);

        // Get current field values to check if they're empty
        const currentProductName = watch(
          `shipments.${shipmentIndex}.items.${itemIndex}.productName`
        );
        const currentPrice = watch(
          `shipments.${shipmentIndex}.items.${itemIndex}.price`
        );
        const currentImageUrl = watch(
          `shipments.${shipmentIndex}.items.${itemIndex}.imageUrl`
        );

        // Auto-populate fields only if they are empty
        // This allows scraping to fill empty fields but respects user input
        if (
          productData.title &&
          (!currentProductName || currentProductName.trim() === "")
        ) {
          setValue(
            `shipments.${shipmentIndex}.items.${itemIndex}.productName`,
            productData.title,
            { shouldValidate: true, shouldDirty: true }
          );
        }

        if (
          productData.price &&
          productData.price > 0 &&
          (!currentPrice || currentPrice === 0)
        ) {
          setValue(
            `shipments.${shipmentIndex}.items.${itemIndex}.price`,
            productData.price,
            { shouldValidate: true, shouldDirty: true }
          );
        }

        if (
          productData.image &&
          (!currentImageUrl || currentImageUrl.trim() === "")
        ) {
          setValue(
            `shipments.${shipmentIndex}.items.${itemIndex}.imageUrl`,
            productData.image,
            { shouldValidate: true, shouldDirty: true }
          );
        }
      } catch (error) {
        // Silently fail - don't show error, just let user continue
        // Fields remain editable
        // Error is silently ignored in create-shipments page
        // (Errors are shown in product-price-calculator page)
      } finally {
        setIsLoadingProduct(false);
      }
    }, 700);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [itemProductUrl, shipmentIndex, itemIndex, setValue, watch]);

  return (
    <div className="rounded border overflow-hidden">
      <div
        className="flex justify-between items-center p-3 cursor-pointer bg-muted/20 hover:bg-muted/30"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Product #{itemIndex + 1}</span>
          {!isExpanded && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {itemProductName || itemProductUrl || "No product name"}
            </span>
          )}
        </div>
        <div className="flex items-center">
          {showDeleteButton && (
            <div
              role="button"
              className="h-6 w-6 p-0 mr-1 inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          <div
            className="h-4 w-4 transition-transform duration-200"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.productUrl`}
              >
                Product URL *
              </Label>
              <div className="relative">
                <Input
                  id={`shipments.${shipmentIndex}.items.${itemIndex}.productUrl`}
                  {...register(
                    `shipments.${shipmentIndex}.items.${itemIndex}.productUrl`
                  )}
                  type="url"
                  placeholder="https://example.com/product"
                  className={isLoadingProduct ? "pr-10" : ""}
                />
                {isLoadingProduct && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <ErrorMessage
                error={
                  errors.shipments?.[shipmentIndex]?.items?.[itemIndex]
                    ?.productUrl
                }
              />
              {/* Warning for unsupported domain */}
              {isUnsupportedDomain &&
                itemProductUrl &&
                itemProductUrl.trim() !== "" && (
                  <div className="flex items-start gap-2 mt-1 text-xs text-blue-600 dark:text-blue-500">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      Please make sure the entered link is a product URL from a
                      supported e-commerce platform.
                    </span>
                  </div>
                )}
              {/* Product Image Display */}
              {itemImageUrl && itemImageUrl.trim() !== "" && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={itemImageUrl}
                    alt={itemProductName || "Product image"}
                    className="max-w-[200px] max-h-[200px] rounded-md border border-border object-cover"
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setValue(
                        `shipments.${shipmentIndex}.items.${itemIndex}.imageUrl`,
                        "",
                        { shouldValidate: true, shouldDirty: true }
                      );
                    }}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.productName`}
              >
                Product Name *
              </Label>
              <Input
                id={`shipments.${shipmentIndex}.items.${itemIndex}.productName`}
                {...register(
                  `shipments.${shipmentIndex}.items.${itemIndex}.productName`
                )}
                placeholder="Enter product name"
              />
              <ErrorMessage
                error={
                  errors.shipments?.[shipmentIndex]?.items?.[itemIndex]
                    ?.productName
                }
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.price`}
              >
                Price *
              </Label>
              <div className="flex gap-2">
                <Select
                  value={
                    watch(
                      `shipments.${shipmentIndex}.items.${itemIndex}.valueCurrency`
                    ) || "INR"
                  }
                  onValueChange={(value: CurrencyCode) =>
                    setValue(
                      `shipments.${shipmentIndex}.items.${itemIndex}.valueCurrency`,
                      value,
                      { shouldValidate: true, shouldDirty: true }
                    )
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id={`shipments.${shipmentIndex}.items.${itemIndex}.price`}
                  {...register(
                    `shipments.${shipmentIndex}.items.${itemIndex}.price`
                  )}
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1"
                />
              </div>
              <ErrorMessage
                error={
                  errors.shipments?.[shipmentIndex]?.items?.[itemIndex]?.price
                }
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.quantity`}
              >
                Quantity *
              </Label>
              <Input
                id={`shipments.${shipmentIndex}.items.${itemIndex}.quantity`}
                {...register(
                  `shipments.${shipmentIndex}.items.${itemIndex}.quantity`
                )}
                type="number"
                placeholder="1"
                min="1"
                step="1"
              />
              <ErrorMessage
                error={
                  errors.shipments?.[shipmentIndex]?.items?.[itemIndex]
                    ?.quantity
                }
              />
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <Label
              htmlFor={`shipments.${shipmentIndex}.items.${itemIndex}.productNote`}
            >
              Product Note
            </Label>
            <Textarea
              id={`shipments.${shipmentIndex}.items.${itemIndex}.productNote`}
              {...register(
                `shipments.${shipmentIndex}.items.${itemIndex}.productNote`
              )}
              placeholder="Enter any additional notes about this product"
              rows={3}
            />
            <ErrorMessage
              error={
                errors.shipments?.[shipmentIndex]?.items?.[itemIndex]
                  ?.productNote
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
