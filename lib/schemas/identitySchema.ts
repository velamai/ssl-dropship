import { z } from "zod";

// Proof types enum for better type safety
export const PROOF_TYPES = [
  {
    value: "gov-id",
    label: "Government ID (With Address Proof)",
    requiresBack: false,
  },
  { value: "passport", label: "Passport", requiresBack: true },
  { value: "driving_license", label: "Driving License", requiresBack: true },
] as const;

// Custom file validation for Cloudflare R2 storage
const fileSchema = z
  .instanceof(File, { message: "Please select a file" })
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: "File size must be less than 5MB",
  })
  .refine(
    (file) => {
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];
      return allowedTypes.includes(file.type);
    },
    {
      message: "File must be PNG, JPG, JPEG, or WebP format",
    }
  );

// Base identity verification schema
const baseSchema = z.object({
  proofType: z.enum(["passport", "driving_license", "gov-id"], {
    required_error: "Please select a document type",
    invalid_type_error: "Invalid document type selected",
  }),
  frontImage: fileSchema,
});

// Extended schema with conditional back image validation
export const IdentityVerificationSchema = baseSchema
  .extend({
    backImage: fileSchema.optional(),
  })
  .refine(
    (data) => {
      // Find the proof type configuration
      const proofConfig = PROOF_TYPES.find(
        (type) => type.value === data.proofType
      );

      // If this proof type requires back image, validate it exists
      if (proofConfig?.requiresBack) {
        return data.backImage !== undefined;
      }

      return true;
    },
    {
      message: "Back side image is required for this document type",
      path: ["backImage"], // This will target the backImage field for error display
    }
  );

// TypeScript type inference
export type IdentityVerificationFormData = z.infer<
  typeof IdentityVerificationSchema
>;
export type ProofType = (typeof PROOF_TYPES)[number]["value"];
