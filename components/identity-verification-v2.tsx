"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  IdentityVerificationSchema,
  PROOF_TYPES,
  type IdentityVerificationFormData,
} from "@/lib/schemas/identitySchema";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  FileImage,
  Loader2,
  Pause,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface IdentityVerificationProps {
  isVerified: boolean;
  userId?: string;
  identityVerificationId?: string;
  isLoading?: boolean;
}

// File upload custom component for better UX
interface FileUploadProps {
  label: string;
  isRequired?: boolean;
  file: File | null;
  preview: string;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  error?: string;
  isUploading?: boolean;
  uploadedUrl?: string;
}

function FileUpload({
  label,
  isRequired = false,
  file,
  preview,
  onFileSelect,
  onRemove,
  error,
  isUploading = false,
  uploadedUrl = "",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileSelect(selectedFile);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">{label}</span>
        {isRequired && <span className="text-red-500">*</span>}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-4 ${
          error
            ? "border-red-300 bg-red-50"
            : uploadedUrl
            ? "border-green-300 bg-green-50"
            : "border-gray-300"
        }`}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={`${label} preview`}
              className="max-h-48 mx-auto rounded"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                <div className="text-white text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Uploading...</p>
                </div>
              </div>
            )}
            {uploadedUrl && !isUploading && (
              <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                ✓ Uploaded
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={onRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto mb-2 text-blue-500 animate-spin" />
                <p className="text-sm mb-2 text-blue-600">
                  Uploading {label.toLowerCase()}...
                </p>
              </>
            ) : (
              <>
                <FileImage
                  className={`h-12 w-12 mx-auto mb-2 ${
                    error ? "text-red-400" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm mb-2 ${
                    error ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  Click to upload {label.toLowerCase()}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </>
            )}
          </div>
        )}
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// Helper function to upload file to R2 using signed URL
async function uploadFileToR2(file: File): Promise<string> {
  // Get signed URL
  const signedUrlResponse = await fetch(
    "/api/identity-verification-signed-url",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileType: file.type,
      }),
    }
  );

  if (!signedUrlResponse.ok) {
    const errorData = await signedUrlResponse.json();
    throw new Error(errorData.error || "Failed to get upload URL");
  }

  const { signedUrl, key } = await signedUrlResponse.json();

  // Upload file directly to R2
  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to storage");
  }

  return key;
}

// Supabase submission function
async function submitIdentityVerification(data: {
  userId: string;
  proofType: string;
  frontImageUrl: string;
  backImageUrl: string | null;
}) {
  try {
    const supabase = getSupabaseBrowserClient();

    // Insert into identity_verification table
    const { data: verificationData, error: verificationError } = await supabase
      .from("identity_verification")
      .insert({
        user_id: data.userId,
        doc_type: data.proofType,
        doc_url_front: data.frontImageUrl,
        doc_url_back: data.backImageUrl,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select("identity_verification_id")
      .single();

    if (verificationError) {
      console.error("Identity verification insert error:", verificationError);
      throw new Error("Failed to save verification request");
    }

    // Update users table with identity_verification_id
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        identity_verification_id: verificationData.identity_verification_id,
      })
      .eq("user_id", data.userId);

    if (userUpdateError) {
      console.error("User update error:", userUpdateError);
      throw new Error("Failed to update user record");
    }

    console.log("Verification data:", verificationData);

    return {
      success: true,
      identity_verification_id: verificationData.identity_verification_id,
      message: "Identity verification submitted successfully",
      status: "pending",
    };
  } catch (error) {
    console.error("Identity verification submission error:", error);
    throw error;
  }
}

export function IdentityVerificationV2({
  isVerified,
  userId,
  identityVerificationId,
  isLoading,
}: IdentityVerificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  const [frontImageUrl, setFrontImageUrl] = useState<string>("");
  const [backImageUrl, setBackImageUrl] = useState<string>("");
  const [frontUploading, setFrontUploading] = useState(false);
  const [backUploading, setBackUploading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // React Hook Form setup with Zod validation
  const form = useForm<IdentityVerificationFormData>({
    resolver: zodResolver(IdentityVerificationSchema),
    defaultValues: {
      proofType: undefined,
      frontImage: undefined as any,
      backImage: undefined,
    },
  });

  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const selectedProofType = watch("proofType");

  // Find if the selected proof type requires back image
  const proofConfig = PROOF_TYPES.find(
    (type) => type.value === selectedProofType
  );
  const requiresBackImage = proofConfig?.requiresBack || false;

  // React Query mutation for API call
  const verificationMutation = useMutation({
    mutationFn: submitIdentityVerification,
    onSuccess: (data) => {
      toast({
        title: "Verification Submitted",
        description: `Your identity verification has been submitted for review (ID: ${data.identity_verification_id}). You'll be notified once it's processed.`,
        variant: "default",
      });

      // Invalidate queries to refresh user data
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["identityVerificationData", userId],
        });
      }

      // Reset form and close dialog
      form.reset();
      setFrontPreview("");
      setBackPreview("");
      setFrontImageUrl("");
      setBackImageUrl("");
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description:
          error.message || "Failed to submit verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection with preview and immediate upload
  const handleFileSelect = async (
    file: File | null,
    type: "frontImage" | "backImage"
  ) => {
    if (!file) return;

    // Set the file in form
    setValue(type, file, { shouldValidate: true });

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (type === "frontImage") {
        setFrontPreview(preview);
      } else {
        setBackPreview(preview);
      }
    };
    reader.readAsDataURL(file);

    // Start upload immediately
    try {
      if (type === "frontImage") {
        setFrontUploading(true);
      } else {
        setBackUploading(true);
      }

      const uploadedUrl = await uploadFileToR2(file);

      if (type === "frontImage") {
        setFrontImageUrl(uploadedUrl);
        setFrontUploading(false);
      } else {
        setBackImageUrl(uploadedUrl);
        setBackUploading(false);
      }

      toast({
        title: "Upload Complete",
        description: `${
          type === "frontImage" ? "Front" : "Back"
        } image uploaded successfully`,
        variant: "default",
      });
    } catch (error) {
      if (type === "frontImage") {
        setFrontUploading(false);
      } else {
        setBackUploading(false);
      }

      toast({
        title: "Upload Failed",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });

      // Clear the file from form on upload failure
      setValue(type, undefined);
      if (type === "frontImage") {
        setFrontPreview("");
      } else {
        setBackPreview("");
      }
    }
  };

  // Handle file removal
  const handleFileRemove = (type: "frontImage" | "backImage") => {
    setValue(type, undefined, { shouldValidate: true });
    if (type === "frontImage") {
      setFrontPreview("");
      setFrontImageUrl("");
    } else {
      setBackPreview("");
      setBackImageUrl("");
    }
  };

  // Form submission
  const onSubmit = (data: IdentityVerificationFormData) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is required for verification",
        variant: "destructive",
      });
      return;
    }

    if (!frontImageUrl) {
      toast({
        title: "Error",
        description: "Front image must be uploaded before submission",
        variant: "destructive",
      });
      return;
    }

    // Check if back image is required but not uploaded
    if (requiresBackImage && !backImageUrl) {
      toast({
        title: "Error",
        description: "Back image is required for this document type",
        variant: "destructive",
      });
      return;
    }

    verificationMutation.mutate({
      userId,
      proofType: data.proofType,
      frontImageUrl,
      backImageUrl: requiresBackImage ? backImageUrl : null,
    });
  };

  return (
    <div className="rounded-lg border border-[#e2e2e2] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-[#3f3f3f]">Identity Verification</h3>
          <p className="text-sm text-[#a2a2a2]">
            {isVerified
              ? "Your identity has been verified"
              : "Verify your identity for enhanced security"}
          </p>
        </div>

        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isVerified ? (
          <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Verified</span>
          </div>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {identityVerificationId ? (
              <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded">
                <Pause className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-600">
                  Pending Review
                </span>
              </div>
            ) : (
              <DialogTrigger asChild>
                <Button className="bg-[#f5e5ff] text-[#9c4cd2] hover:bg-[#ede0ff]">
                  Verify Identity
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Identity Verification</DialogTitle>
                <DialogDescription>
                  Upload a valid government-issued ID to verify your identity.
                  All information is securely processed and encrypted.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Document Type Selection */}
                  <FormField
                    control={form.control}
                    name="proofType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setValue("frontImage", undefined as any);
                            setValue("backImage", undefined);
                            setFrontPreview("");
                            setBackPreview("");
                            setFrontImageUrl("");
                            setBackImageUrl("");
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROOF_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Front Image Upload */}
                  <FormField
                    control={form.control}
                    name="frontImage"
                    render={() => (
                      <FormItem>
                        <FileUpload
                          label="Front Side of Document"
                          isRequired
                          file={watch("frontImage") || null}
                          preview={frontPreview}
                          onFileSelect={(file) =>
                            handleFileSelect(file, "frontImage")
                          }
                          onRemove={() => handleFileRemove("frontImage")}
                          error={errors.frontImage?.message}
                          isUploading={frontUploading}
                          uploadedUrl={frontImageUrl}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Back Image Upload (conditional) */}
                  {requiresBackImage && (
                    <FormField
                      control={form.control}
                      name="backImage"
                      render={() => (
                        <FormItem>
                          <FileUpload
                            label="Back Side of Document"
                            isRequired
                            file={watch("backImage") || null}
                            preview={backPreview}
                            onFileSelect={(file) =>
                              handleFileSelect(file, "backImage")
                            }
                            onRemove={() => handleFileRemove("backImage")}
                            error={errors.backImage?.message}
                            isUploading={backUploading}
                            uploadedUrl={backImageUrl}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Important Notes:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Ensure all text and details are clearly visible</li>
                      <li>• Images should be well-lit and in focus</li>
                      <li>• Maximum file size: 5MB per image</li>
                      <li>• Accepted formats: PNG, JPG, JPEG, WebP only</li>
                      <li>• Files are securely stored with encrypted naming</li>
                      <li>• Verification usually takes 24-48 hours</li>
                    </ul>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      disabled={verificationMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        verificationMutation.isPending ||
                        frontUploading ||
                        backUploading ||
                        !frontImageUrl ||
                        (requiresBackImage && !backImageUrl)
                      }
                      className="bg-[#9c4cd2] hover:bg-[#8a44c1]"
                    >
                      {verificationMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : frontUploading || backUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : !frontImageUrl ? (
                        "Upload Front Image First"
                      ) : requiresBackImage && !backImageUrl ? (
                        "Upload Back Image First"
                      ) : (
                        "Submit for Verification"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
