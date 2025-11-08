import { z } from "zod";
import { parsePhoneNumber, isValidPhoneNumber } from "react-phone-number-input";

// Helper function to generate UUID (consider moving to a utils file)
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Schema for individual items within a shipment
export const ItemSchema = z.object({
  uuid: z
    .string()
    .uuid()
    .default(() => generateUUID()), // Trigger new UUID generation
  productUrl: z
    .string()
    .trim()
    .min(1, "Product URL is required")
    .url({ message: "Product URL must be a valid URL" }),
  productName: z.string().trim().min(1, "Product name is required"),
  productNote: z.string().trim().optional(),
  imageUrl: z
    .union([
      z.string().url({ message: "Image URL must be a valid URL" }),
      z.literal(""),
    ])
    .optional(),
  price: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : Number(val),
    z
      .number({ invalid_type_error: "Price must be a number" })
      .positive({ message: "Price must be positive" })
      .optional()
  ),
  quantity: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : Number(val),
    z
      .number({ invalid_type_error: "Quantity must be a number" })
      .int({ message: "Quantity must be a whole number" })
      .positive({ message: "Quantity must be positive" })
      .optional()
  ),
});

// Schema for package dimensions
export const DimensionsSchema = z
  .object({
    length: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number({ invalid_type_error: "Length must be a number" }).positive({ message: "Length must be positive" }).optional()),
    width: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number({ invalid_type_error: "Width must be a number" }).positive({ message: "Width must be positive" }).optional()),
    height: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number({ invalid_type_error: "Height must be a number" }).positive({ message: "Height must be positive" }).optional()),
  })
  .refine(
    (data) => {
      const fields = [data.length, data.width, data.height];
      const providedCount = fields.filter(
        (field) => field !== undefined && field > 0
      ).length;
      // Valid if either 0 or all 3 fields are provided (removed strict validation here)
      // Individual field validation will be handled at the shipment level based on package type
      return providedCount === 0 || providedCount === 3;
    },
    {
      message:
        "If providing dimensions, please provide all three (Length, Width, Height).",
      // No path specified - error attaches to the dimensions object itself
    }
  );

// Schema for pickup details (conditionally required)
export const PickupSchema = z.object({
  addressLine1: z.string().trim().min(1, "Pickup Address Line 1 is required"),
  addressLine2: z.string().trim().min(1, "Pickup Address Line 2 is required"),
  addressLine3: z.string().optional(),
  addressLine4: z.string().optional(),
  postalCode: z.string().trim().min(1, "Pickup Postal Code is required"),
  // Assuming country is derived from shipment country
  date: z.preprocess((arg) => {
    if (!arg) return undefined;
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return undefined;
  }, z.date({ required_error: "Pickup date is required" })), // Use z.date if input is a Date object
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Pickup phone number is required")
    .refine((value) => isValidPhoneNumber(value), {
      message: "Please enter a valid phone number",
    }),
  phoneCode: z.string().optional(), // This will be computed from phone and stored in database
  instructions: z.string().optional(),
});

// Phone number validation utility

// Helper function to extract phone details
export const getPhoneDetails = (phone: string) => {
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

// Schema for receiver information
export const ReceiverSchema = z.object({
  firstName: z.string().trim().min(1, "Receiver first name is required"),
  lastName: z.string().trim().min(1, "Receiver last name is required"),
  company: z.string().optional(),
  vatTax: z.string().optional(), // Add specific VAT validation if needed
  phone: z
    .string()
    .trim()
    .min(1, "Receiver phone number is required")
    .refine((value) => isValidPhoneNumber(value), {
      message: "Please enter a valid phone number",
    }),
  phoneCode: z.string().optional(), // This will be computed from phone and stored in database
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .min(1, "Receiver email is required"),
  addressLine1: z.string().trim().min(1, "Receiver Address Line 1 is required"),
  addressLine2: z.string().trim().min(1, "Receiver Address Line 2 is required"),
  addressLine3: z.string().optional(),
  addressLine4: z.string().optional(),
  postalCode: z.string().trim().optional(),
});

// Schema for a single shipment
export const ShipmentSchema = z
  .object({
    shipmentType: z.string().default("link"), // Consider z.enum(["export", "import"])
    country: z.string().trim().min(1, "Destination country is required"),
    warehouseId: z.string().optional(), // Warehouse selection for warehouse type shipments
    courierService: z.string().optional(), // Courier service selection
    purchasedDate: z.preprocess((arg) => {
      if (!arg) return undefined;
      if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
      return undefined;
    }, z.date().optional()),
    purchasedSite: z
      .string()
      .trim()
      .url({ message: "Purchased site must be a valid URL" })
      .optional(),
    packageType: z.enum(["box", "envelope"], {
      required_error: "Package type is required",
      invalid_type_error: "Package type must be either 'box' or 'envelope'",
    }),
    dimensions: DimensionsSchema,
    isPickupNeeded: z.boolean().default(false),
    pickup: z.any().optional(),
    receiver: ReceiverSchema,
    items: z.array(ItemSchema).min(1, "At least one item is required"),
    // Optional production invoice URLs uploaded via signed URL flow
    invoiceUrls: z
      .array(z.string().url({ message: "Invoice URL must be a valid URL" }))
      .optional(),
    // Optional product image URLs (max 10 images)
    productImageUrls: z
      .array(z.string().url({ message: "Image URL must be a valid URL" }))
      .max(10, "Maximum 10 product images allowed")
      .optional(),
    // Optional free-form notes for the shipment
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate warehouse selection only for warehouse shipments
    if (data.shipmentType === "warehouse") {
      if (!data.warehouseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Warehouse address is required.",
          path: ["warehouseId"],
        });
      }
      if (!data.purchasedDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Purchased date is required for warehouse shipments.",
          path: ["purchasedDate"],
        });
      }
      if (!data.purchasedSite) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Purchased site is required for warehouse shipments.",
          path: ["purchasedSite"],
        });
      }
    }
  });

// Schema for the entire order form
export const OrderSchema = z.object({
  shipments: z
    .array(ShipmentSchema)
    .min(1, "At least one shipment is required."),
});

// Infer TypeScript types from schemas
export type ItemFormData = z.infer<typeof ItemSchema>;
export type DimensionsFormData = z.infer<typeof DimensionsSchema>;
export type PickupFormData = z.infer<typeof PickupSchema>;
export type ReceiverFormData = z.infer<typeof ReceiverSchema>;
export type ShipmentFormData = z.infer<typeof ShipmentSchema>;
export type OrderFormData = z.infer<typeof OrderSchema>;
