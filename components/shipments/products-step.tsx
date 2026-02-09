"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Package,
  ArrowRight,
  Plus,
  X,
  Link2,
  DollarSign,
  ImageIcon,
  Loader2,
  FileText,
  Upload,
  Calendar,
  Globe,
  Lightbulb,
  Info,
  Save,
  Store,
  ShoppingBag,
} from "lucide-react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch,
  type UseFormSetValue,
} from "react-hook-form";
import type { OrderFormData } from "@/lib/schemas/shipmentSchema";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFieldArray, useWatch } from "react-hook-form";
import { useState, useEffect } from "react";
import { fetchProductData } from "@/lib/product-scraper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CountrySelector } from "@/components/product-price-calculator/country-selector";
import { useSourceCountries } from "@/lib/hooks/useSourceCountries";
import { Alert, AlertDescription } from "../ui/alert";

interface ProductsStepProps {
  index: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  onNext: () => void;
  isWarehouseService?: boolean;
  getValues?: any;
  onSaveDraft?: () => void;
  loadedDraftId?: string | null;
}

interface ProductImage {
  imageUrl: string; // The actual image URL from the API
  productUrl: string; // The product page URL
  name: string;
  loading: boolean;
  error?: string;
}

// Component for individual product item with its own query
function ProductItemWithQuery({
  index,
  itemIndex,
  control,
  register,
  errors,
  watch,
  setValue,
  removeItem,
  canRemove,
  isWarehouseService = false,
}: {
  index: number;
  itemIndex: number;
  control: Control<OrderFormData>;
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watch: UseFormWatch<OrderFormData>;
  setValue: UseFormSetValue<OrderFormData>;
  removeItem: (index: number) => void;
  canRemove: boolean;
  isWarehouseService?: boolean;
}) {
  const sourceCountryCode = useWatch({
    control,
    name: `shipments.${index}.sourceCountryCode`,
  }) as string | undefined;
  const isCurrencyLocked = !isWarehouseService && !!sourceCountryCode;
  // Watch the product URL for this specific item
  const productUrl = useWatch({
    control,
    name: `shipments.${index}.items.${itemIndex}.productUrl`,
  }) as string | undefined;

  const trimmedUrl = productUrl?.trim() || "";

  // Debounce the URL for query (300ms delay)
  const [debouncedUrl, setDebouncedUrl] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUrl(trimmedUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [trimmedUrl]);

  const isValidUrl = debouncedUrl.length > 0 && debouncedUrl.startsWith("http");

  // Use React Query to fetch product data when URL is valid (disabled for warehouse - link optional)
  const {
    data: productData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productData", index, itemIndex, debouncedUrl],
    queryFn: () => fetchProductData(debouncedUrl),
    enabled: isValidUrl && !isWarehouseService,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  // Get current item values
  const currentItem = useWatch({
    control,
    name: `shipments.${index}.items.${itemIndex}`,
  });

  // Auto-populate fields when product data is fetched - always update when new
  // productData arrives for the current URL (including when user re-enters a different link)
  useEffect(() => {
    if (productData && debouncedUrl) {
      if (productData.title) {
        setValue(
          `shipments.${index}.items.${itemIndex}.productName`,
          productData.title,
        );
      }

      if (productData.price && productData.price > 0) {
        setValue(
          `shipments.${index}.items.${itemIndex}.price`,
          productData.price,
        );
      }
      // Currency is NOT set from product - it comes from source country selected in Products step
    }
  }, [productData, debouncedUrl, index, itemIndex, setValue]);

  return (
    <div className="relative p-5 rounded-xl border bg-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
          {itemIndex + 1}
        </div>
        <h4 className="font-semibold text-base">Product {itemIndex + 1}</h4>
      </div>

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7"
          onClick={() => removeItem(itemIndex)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Product Name - first for warehouse */}
        <div className="space-y-2">
          <Label htmlFor={`shipments.${index}.items.${itemIndex}.productName`}>
            Product Name *
          </Label>
          <Input
            id={`shipments.${index}.items.${itemIndex}.productName`}
            {...register(`shipments.${index}.items.${itemIndex}.productName`)}
            placeholder="Product name"
          />
          <ErrorMessage
            error={errors.shipments?.[index]?.items?.[itemIndex]?.productName}
          />
        </div>

        {/* Product URL - optional for warehouse */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`shipments.${index}.items.${itemIndex}.productUrl`}>
            Product Link{!isWarehouseService && " *"}
          </Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id={`shipments.${index}.items.${itemIndex}.productUrl`}
              {...register(`shipments.${index}.items.${itemIndex}.productUrl`)}
              placeholder="https://example.com/product"
              className="pl-10"
            />
          </div>
          {isWarehouseService && (
            <p className="text-xs text-muted-foreground">
              Optional for warehouse orders
            </p>
          )}
          <ErrorMessage
            error={errors.shipments?.[index]?.items?.[itemIndex]?.productUrl}
          />
          {/* Inline reassurance when fetch fails - neutral message, not error */}
          {!isWarehouseService &&
            !isLoading &&
            isValidUrl &&
            (!!error || !productData?.image) && (
              <p className="text-xs text-muted-foreground mt-1">
                Enter the details below and continue – we&apos;ll use them for
                your order.
              </p>
            )}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label htmlFor={`shipments.${index}.items.${itemIndex}.quantity`}>
            Qty *
          </Label>
          <Input
            id={`shipments.${index}.items.${itemIndex}.quantity`}
            {...register(`shipments.${index}.items.${itemIndex}.quantity`, {
              valueAsNumber: true,
            })}
            type="number"
            min="1"
            placeholder="1"
          />
          <ErrorMessage
            error={errors.shipments?.[index]?.items?.[itemIndex]?.quantity}
          />
        </div>

        {/* Price / Item Value - optional for warehouse */}
        <div className="space-y-2">
          <Label htmlFor={`shipments.${index}.items.${itemIndex}.price`}>
            {isWarehouseService ? "Item Value" : "Item Price *"}
          </Label>
          <div className="relative">
            <Input
              id={`shipments.${index}.items.${itemIndex}.price`}
              {...register(`shipments.${index}.items.${itemIndex}.price`, {
                valueAsNumber: true,
              })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
          <ErrorMessage
            error={errors.shipments?.[index]?.items?.[itemIndex]?.price}
          />
        </div>

        {/* Currency - optional for warehouse */}
        <div className="space-y-2">
          <Label
            htmlFor={`shipments.${index}.items.${itemIndex}.valueCurrency`}
          >
            Currency{!isWarehouseService && " *"}
          </Label>
          <Controller
            name={`shipments.${index}.items.${itemIndex}.valueCurrency`}
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={isCurrencyLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isWarehouseService ? "Select (optional)" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="LKR">LKR</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="MYR">MYR</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <ErrorMessage
            error={errors.shipments?.[index]?.items?.[itemIndex]?.valueCurrency}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`shipments.${index}.items.${itemIndex}.productNote`}>
            Product Notes *
          </Label>
          <Textarea
            id={`shipments.${index}.items.${itemIndex}.productNote`}
            {...register(`shipments.${index}.items.${itemIndex}.productNote`)}
            placeholder="Please enter color, size and other details here"
            rows={2}
            className="resize-none"
          />
          <ErrorMessage
            error={errors.shipments?.[index]?.items?.[itemIndex]?.productNote}
          />
        </div>
      </div>
    </div>
  );
}

export function ProductsStep({
  index,
  control,
  register,
  errors,
  watch,
  setValue,
  onNext,
  isWarehouseService = false,
  getValues,
  onSaveDraft,
  loadedDraftId,
}: ProductsStepProps) {
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `shipments.${index}.items`,
  });

  // Watch all items to get product URLs for preview
  const watchedItems = watch(`shipments.${index}.items`);
  const queryClient = useQueryClient();

  // Watch source country for currency default
  const sourceCountryCode = useWatch({
    control,
    name: `shipments.${index}.sourceCountryCode`,
  }) as string | undefined;

  // Fetch source countries from Supabase
  const { data: sourceCountries, isLoading: isLoadingSourceCountries } =
    useSourceCountries();

  // When source country is selected, default item currency to that country's currency (link service only; warehouse currency is optional)
  const validCurrencies = ["INR", "USD", "GBP", "EUR", "LKR", "AED", "MYR", "SGD"] as const;
  useEffect(() => {
    if (!sourceCountryCode || !sourceCountries || itemFields.length === 0 || isWarehouseService) return;
    const sourceCurrency = sourceCountries.find(
      (c) => c.code === sourceCountryCode
    )?.currency;
    if (!sourceCurrency) return;
    const currency = validCurrencies.includes(sourceCurrency as (typeof validCurrencies)[number])
      ? sourceCurrency
      : "USD";
    itemFields.forEach((_, itemIndex) => {
      setValue(`shipments.${index}.items.${itemIndex}.valueCurrency`, currency as (typeof validCurrencies)[number]);
    });
  }, [sourceCountryCode, sourceCountries, index, itemFields.length, setValue]);

  // UI-only: purchase type for warehouse (Local Shop vs Online Ecommerce)
  const [purchaseSourceType, setPurchaseSourceType] = useState<
    "local" | "ecommerce"
  >("ecommerce");

  // State to track product images for preview panel
  const [productImages, setProductImages] = useState<{
    [key: number]: ProductImage;
  }>({});

  // State for invoice and product image uploads (warehouse service)
  const [localFilePreviews, setLocalFilePreviews] = useState<{
    [key: string]: string;
  }>({});
  const [imageFiles, setImageFiles] = useState<{ [key: string]: boolean }>({});
  const [productImagePreviews, setProductImagePreviews] = useState<{
    [key: string]: string;
  }>({});

  // Helper function to check if file is an image
  const isImageType = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  // Watch each product URL and get query state for preview
  useEffect(() => {
    if (!watchedItems || watchedItems.length === 0) {
      setProductImages({});
      return;
    }

    watchedItems.forEach((item, itemIndex) => {
      const productUrl = item?.productUrl?.trim() || "";

      if (!productUrl) {
        setProductImages((prev) => {
          const newImages = { ...prev };
          delete newImages[itemIndex];
          return newImages;
        });
        return;
      }

      // Find query for this item by checking cache
      // Query key pattern: ["productData", index, itemIndex, debouncedUrl]
      const cache = queryClient.getQueryCache();
      const queries = cache.findAll({
        queryKey: ["productData", index, itemIndex],
        exact: false,
      });

      // Find the most relevant query (one that matches or is close to current URL)
      const relevantQuery = queries.find((q) => {
        const key = q.queryKey;
        if (Array.isArray(key) && key.length >= 4) {
          const queryUrl = key[3] as string;
          // Match if URLs are similar (handles debouncing)
          return (
            queryUrl &&
            typeof queryUrl === "string" &&
            (queryUrl === productUrl ||
              queryUrl.startsWith(productUrl.substring(0, 20)) ||
              productUrl.startsWith(queryUrl.substring(0, 20)))
          );
        }
        return false;
      });

      if (relevantQuery) {
        const queryState = relevantQuery.state;
        const queryData = queryState.data as any;

        if (queryState.fetchStatus === "fetching") {
          // Show loading state
          setProductImages((prev) => ({
            ...prev,
            [itemIndex]: {
              imageUrl: "",
              productUrl: productUrl,
              name: item?.productName || "Product",
              loading: true,
            },
          }));
        } else if (queryData) {
          // Show fetched data - handle case where no image is available
          setProductImages((prev) => ({
            ...prev,
            [itemIndex]: {
              imageUrl: queryData.image || "",
              productUrl: productUrl,
              name: queryData.title || item?.productName || "Product",
              loading: false,
              error: queryData.image
                ? undefined
                : "Image couldn't be fetched automatically",
            },
          }));
        } else if (
          queryState.error ||
          (queryState.data === null && queryState.fetchStatus === "idle")
        ) {
          // Show error state or no data state
          setProductImages((prev) => ({
            ...prev,
            [itemIndex]: {
              imageUrl: "",
              productUrl: productUrl,
              name: item?.productName || "Product",
              loading: false,
              error: "Image couldn't be fetched automatically",
            },
          }));
        }
      } else if (productUrl.startsWith("http")) {
        // URL exists but no query found yet - show loading (waiting for debounce/query)
        setProductImages((prev) => ({
          ...prev,
          [itemIndex]: {
            imageUrl: "",
            productUrl: productUrl,
            name: item?.productName || "Product",
            loading: true,
          },
        }));
      }
    });
    // Subscribe to query cache changes to update preview reactively
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === "updated" || event?.type === "added") {
        // Re-run the preview update when queries change
        const updateTimer = setTimeout(() => {
          watchedItems.forEach((item, itemIndex) => {
            const productUrl = item?.productUrl?.trim() || "";
            if (!productUrl || !productUrl.startsWith("http")) return;

            const cache = queryClient.getQueryCache();
            const queries = cache.findAll({
              queryKey: ["productData", index, itemIndex],
              exact: false,
            });

            const relevantQuery = queries.find((q) => {
              const key = q.queryKey;
              if (Array.isArray(key) && key.length >= 4) {
                const queryUrl = key[3] as string;
                return (
                  queryUrl &&
                  typeof queryUrl === "string" &&
                  (queryUrl === productUrl ||
                    queryUrl.startsWith(productUrl.substring(0, 20)) ||
                    productUrl.startsWith(queryUrl.substring(0, 20)))
                );
              }
              return false;
            });

            if (relevantQuery) {
              const queryState = relevantQuery.state;
              const queryData = queryState.data as any;

              if (queryState.fetchStatus === "fetching") {
                setProductImages((prev) => ({
                  ...prev,
                  [itemIndex]: {
                    imageUrl: "",
                    productUrl: productUrl,
                    name: item?.productName || "Product",
                    loading: true,
                  },
                }));
              } else if (queryData) {
                setProductImages((prev) => ({
                  ...prev,
                  [itemIndex]: {
                    imageUrl: queryData.image || "",
                    productUrl: productUrl,
                    name: queryData.title || item?.productName || "Product",
                    loading: false,
                    error: queryData.image
                      ? undefined
                      : "Image couldn't be fetched automatically",
                  },
                }));
              } else if (
                queryState.error ||
                (queryState.data === null && queryState.fetchStatus === "idle")
              ) {
                setProductImages((prev) => ({
                  ...prev,
                  [itemIndex]: {
                    imageUrl: "",
                    productUrl: productUrl,
                    name: item?.productName || "Product",
                    loading: false,
                    error: "Image couldn't be fetched automatically",
                  },
                }));
              }
            }
          });
        }, 100);
        return () => clearTimeout(updateTimer);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [watchedItems, queryClient, index]);

  // Show Product Preview only when at least one image is successfully fetched
  const hasSuccessfulPreview = Object.values(productImages).some(
    (img) => !img.loading && !!img.imageUrl?.trim()
  );
  const successfulPreviewEntries = Object.entries(productImages).filter(
    ([_, img]) => !img.loading && !!img.imageUrl?.trim()
  );

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      {/* Left Column: Form */}
      <div className="space-y-6">
        {/* Warehouse: Purchase Information first (Source Country, purchase type, purchased site, date) */}
        {isWarehouseService && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Purchase Information
              </CardTitle>
              <CardDescription>
                Provide details about when and where you purchased the products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source Country - first */}
              <div className="space-y-2">
                <Label htmlFor={`shipments.${index}.sourceCountryCode`}>
                  Source Country (Warehouse Location) *
                </Label>
                <Controller
                  name={`shipments.${index}.sourceCountryCode`}
                  control={control}
                  render={({ field }) => (
                    <CountrySelector
                      type="source"
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      sourceCountries={sourceCountries}
                      disabled={isLoadingSourceCountries}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Select the country where the warehouse is located or where
                  products will be shipped from
                </p>
                <ErrorMessage
                  error={errors.shipments?.[index]?.sourceCountryCode}
                />
              </div>

              {/* Purchase Type Switch - UI only */}
              <div className="space-y-2">
                <Label>Purchase From</Label>
                <RadioGroup
                  value={purchaseSourceType}
                  onValueChange={(v) =>
                    setPurchaseSourceType(v as "local" | "ecommerce")
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="local" id="purchase-local" />
                    <Label htmlFor="purchase-local" className="flex items-center gap-2 font-normal cursor-pointer">
                      <Store className="h-4 w-4" />
                      Local Shop
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ecommerce" id="purchase-ecommerce" />
                    <Label htmlFor="purchase-ecommerce" className="flex items-center gap-2 font-normal cursor-pointer">
                      <ShoppingBag className="h-4 w-4" />
                      Online Ecommerce
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Purchased Site - dynamic placeholder based on purchase type */}
              <div className="space-y-2">
                <Label htmlFor={`shipments.${index}.purchasedSite`}>
                  Purchased Site *
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id={`shipments.${index}.purchasedSite`}
                    {...register(`shipments.${index}.purchasedSite`)}
                    type="text"
                    placeholder={
                      purchaseSourceType === "local"
                        ? "Enter store name"
                        : "Enter site name"
                    }
                    className="pl-10"
                  />
                </div>
                <ErrorMessage
                  error={errors.shipments?.[index]?.purchasedSite}
                />
              </div>

              {/* Purchased Date */}
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
            </CardContent>
          </Card>
        )}

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Details
            </CardTitle>
            <CardDescription>
              {isWarehouseService
                ? "Add your product details"
                : "Add product links and we'll fetch the details automatically"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Source Country - only for link service (warehouse has it in Purchase Information) */}
            {!isWarehouseService && (
              <div className="space-y-2">
                <Label htmlFor={`shipments.${index}.sourceCountryCode`}>
                  Source Country (Warehouse Location) *
                </Label>
                <Controller
                  name={`shipments.${index}.sourceCountryCode`}
                  control={control}
                  render={({ field }) => (
                    <CountrySelector
                      type="source"
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      sourceCountries={sourceCountries}
                      disabled={isLoadingSourceCountries}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Select the country where the warehouse is located or where
                  products will be shipped from
                </p>
                <ErrorMessage
                  error={errors.shipments?.[index]?.sourceCountryCode}
                />
              </div>
            )}

            <div className="space-y-4">
              {itemFields.map((field, itemIndex) => (
                <ProductItemWithQuery
                  key={field.id}
                  index={index}
                  itemIndex={itemIndex}
                  control={control}
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  removeItem={removeItem}
                  canRemove={itemFields.length > 1}
                  isWarehouseService={isWarehouseService}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const sourceCurrency = sourceCountries?.find(
                    (c) => c.code === sourceCountryCode
                  )?.currency;
                  const currency =
                    sourceCurrency &&
                    validCurrencies.includes(
                      sourceCurrency as (typeof validCurrencies)[number]
                    )
                      ? sourceCurrency
                      : "INR";
                  appendItem({
                    uuid: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
                      /[xy]/g,
                      (c) => {
                        const r = (Math.random() * 16) | 0;
                        const v = c === "x" ? r : (r & 0x3) | 0x8;
                        return v.toString(16);
                      },
                    ),
                    productUrl: "",
                    productName: "",
                    price: 0,
                    valueCurrency: currency as (typeof validCurrencies)[number],
                    quantity: 1,
                    productNote: "",
                  });
                }}
                className="w-full border-2 border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Product
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse: Product Images (Max 10) - third */}
        {isWarehouseService && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Product Images (Max 10)
              </CardTitle>
              <CardDescription>
                Upload images of your products (Maximum 10 images)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`shipments.${index}.productImageFile`}
                  className="text-sm font-semibold"
                >
                  Upload Product Images
                </Label>
                {getValues &&
                  (getValues(`shipments.${index}.productImageUrls`) || [])
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
                <label
                  htmlFor={`shipments.${index}.productImageFile`}
                  className="relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-muted-foreground/40 rounded-xl cursor-pointer hover:border-primary/70 hover:bg-muted/40 transition-colors overflow-hidden"
                >
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
                        ),
                      )}
                    </div>
                  )}

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
                      const files = Array.from(e.currentTarget.files || []);
                      if (files.length === 0) return;

                      const currentUrls =
                        getValues?.(`shipments.${index}.productImageUrls`) ||
                        [];
                      const totalImages = currentUrls.length + files.length;

                      if (totalImages > 10) {
                        alert(
                          `Cannot upload more than 10 images. You have ${currentUrls.length} images and trying to add ${files.length}.`,
                        );
                        return;
                      }

                      const newPreviews = { ...productImagePreviews };

                      for (const file of files) {
                        const fileId = `${file.name}-${
                          file.size
                        }-${Date.now()}`;

                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          newPreviews[fileId] = ev.target?.result as string;
                          setProductImagePreviews(newPreviews);
                        };
                        reader.readAsDataURL(file);
                      }

                      try {
                        const fileTypes = files.map(
                          (file) => file.type || "image/jpeg",
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

                        const uploadPromises = files.map(
                          async (file, idx) => {
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
                                `Failed to upload file: ${file.name}`,
                              );
                            return publicUrl;
                          },
                        );

                        const uploadedUrls =
                          await Promise.all(uploadPromises);

                        const updatedUrls = [...currentUrls, ...uploadedUrls];
                        setValue(
                          `shipments.${index}.productImageUrls`,
                          updatedUrls,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          },
                        );
                      } catch (err) {
                        console.error(err);
                        setProductImagePreviews({});
                      } finally {
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </label>

                {getValues &&
                  (getValues(`shipments.${index}.productImageUrls`) || [])
                    .length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {getValues(`shipments.${index}.productImageUrls`)?.map(
                        (url: string, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-border bg-muted/30"
                          >
                            {Object.values(productImagePreviews).length >
                            idx ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    Object.values(productImagePreviews)[idx]
                                  }
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
                                        `shipments.${index}.productImageUrls`,
                                      ) || [];
                                    const newUrls = currentUrls.filter(
                                      (_: unknown, i: number) => i !== idx,
                                    );
                                    setValue(
                                      `shipments.${index}.productImageUrls`,
                                      newUrls,
                                      {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      },
                                    );
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}
              </div>
              {getValues && (
                <p className="text-xs text-muted-foreground">
                  {`${
                    (getValues(`shipments.${index}.productImageUrls`) || [])
                      .length
                  }/10 images uploaded`}
                </p>
              )}
              <ErrorMessage
                error={errors.shipments?.[index]?.productImageUrls}
              />
            </CardContent>
          </Card>
        )}

        {/* Warehouse: Product Invoice - fourth (other details) */}
        {isWarehouseService && (
          <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Product Invoice
                </CardTitle>
                <CardDescription>
                  Upload invoice documents for your products (PDF or Images)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`shipments.${index}.invoiceFile`}
                    className="text-sm font-semibold"
                  >
                    Upload Invoice Files
                  </Label>
                  {getValues &&
                    (getValues(`shipments.${index}.invoiceUrls`) || []).length >
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
                  <label
                    htmlFor={`shipments.${index}.invoiceFile`}
                    className="relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-muted-foreground/40 rounded-xl cursor-pointer hover:border-primary/70 hover:bg-muted/40 transition-colors overflow-hidden"
                  >
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
                          ),
                        )}
                      </div>
                    )}

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
                          const fileTypes = files.map(
                            (file) => file.type || "application/pdf",
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
                                  `Failed to upload file: ${file.name}`,
                                );
                              return publicUrl;
                            },
                          );

                          const uploadedUrls =
                            await Promise.all(uploadPromises);

                          const currentUrls =
                            getValues?.(`shipments.${index}.invoiceUrls`) || [];
                          setValue(
                            `shipments.${index}.invoiceUrls`,
                            [...currentUrls, ...uploadedUrls],
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            },
                          );
                        } catch (err) {
                          console.error(err);
                          setLocalFilePreviews({});
                          setImageFiles({});
                        } finally {
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>

                  {getValues &&
                    (getValues(`shipments.${index}.invoiceUrls`) || []).length >
                      0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {getValues(`shipments.${index}.invoiceUrls`)?.map(
                          (url: string, idx: number) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-border bg-muted/30 p-2"
                            >
                              {Object.values(localFilePreviews).length > idx ? (
                                <img
                                  src={Object.values(localFilePreviews)[idx]}
                                  alt="Uploaded file preview"
                                  className="size-20 object-cover rounded border"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      Invoice {idx + 1}
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
                                          `shipments.${index}.invoiceUrls`,
                                        ) || [];
                                      const newUrls = currentUrls.filter(
                                        (_: any, i: number) => i !== idx,
                                      );
                                      setValue(
                                        `shipments.${index}.invoiceUrls`,
                                        newUrls,
                                        {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                        },
                                      );
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                </div>
                <ErrorMessage error={errors.shipments?.[index]?.invoiceUrls} />
              </CardContent>
            </Card>
        )}

        <div className="flex justify-between">
          <div>
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onSaveDraft}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {loadedDraftId && loadedDraftId !== "pending-checkout"
                  ? "Update Draft"
                  : "Save Draft"}
              </Button>
            )}
          </div>
          <Button type="button" onClick={onNext} size="lg">
            <span>
              Continue to {isWarehouseService ? "Warehouse" : "Delivery"}
            </span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Right Column: Image Preview - only show when we have successful images, or empty state */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          {/* Product Preview card: show only when empty (no URLs) or when at least one image fetched successfully */}
          {(Object.keys(productImages).length === 0 || hasSuccessfulPreview) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Preview
                </CardTitle>
                <CardDescription className="text-xs">
                  Images are automatically scraped from product links
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(productImages).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Add a product link to see preview
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {successfulPreviewEntries.map(([itemIndex, imageData]) => (
                      <div
                        key={itemIndex}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {Number(itemIndex) + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="space-y-2">
                              <div className="rounded-lg overflow-hidden bg-muted border">
                                <img
                                  src={imageData.imageUrl!}
                                  alt={imageData.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              </div>
                              <p className="text-xs font-medium line-clamp-2">
                                {imageData.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-sm text-primary">Tips</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary/70 mt-0.5">•</span>
                      <span>Images load automatically from product links</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/70 mt-0.5">•</span>
                      <span>
                        Product details auto-fill from major e-commerce
                        platforms
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary/70 mt-0.5">•</span>
                      <span>
                        If details don&apos;t load automatically, enter name and
                        price manually – your order will work the same
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
