// "use client";

// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useToast } from "@/components/ui/use-toast";
// import {
//   IdentityVerificationSchema,
//   PROOF_TYPES,
//   type IdentityVerificationFormData,
// } from "@/lib/schemas/identitySchema";
// import { getSupabaseBrowserClient } from "@/lib/supabase";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   AlertTriangle,
//   CheckCircle,
//   Clock,
//   FileImage,
//   Loader2,
//   Pause,
//   RefreshCw,
//   Upload,
//   X,
// } from "lucide-react";
// import { useRef, useState } from "react";
// import { useForm } from "react-hook-form";

// // Verification status types
// export type VerificationStatus =
//   | "pending"
//   | "approved"
//   | "rejected"
//   | undefined;

// interface IdentityVerificationProps {
//   isVerified: boolean;
//   userId?: string;
//   identityVerificationId?: string;
//   isLoading?: boolean;
//   verificationStatus?: VerificationStatus;
//   verificationRejectionReason?: string;
// }

// // File upload custom component for better UX
// interface FileUploadProps {
//   label: string;
//   isRequired?: boolean;
//   file: File | null;
//   preview: string;
//   onFileSelect: (file: File | null) => void;
//   onRemove: () => void;
//   error?: string;
//   isUploading?: boolean;
//   uploadedUrl?: string;
// }

// function FileUpload({
//   label,
//   isRequired = false,
//   file,
//   preview,
//   onFileSelect,
//   onRemove,
//   error,
//   isUploading = false,
//   uploadedUrl = "",
// }: FileUploadProps) {
//   const inputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0] || null;
//     onFileSelect(selectedFile);
//   };

//   return (
//     <div className="space-y-2">
//       <div className="flex items-center gap-1">
//         <span className="text-sm font-medium">{label}</span>
//         {isRequired && <span className="text-red-500">*</span>}
//       </div>

//       <div
//         className={`border-2 border-dashed rounded-lg p-4 ${
//           error
//             ? "border-red-300 bg-red-50"
//             : uploadedUrl
//             ? "border-green-300 bg-green-50"
//             : "border-gray-300"
//         }`}
//       >
//         {preview ? (
//           <div className="relative">
//             <img
//               src={preview}
//               alt={`${label} preview`}
//               className="max-h-48 mx-auto rounded"
//             />
//             {isUploading && (
//               <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
//                 <div className="text-white text-center">
//                   <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
//                   <p className="text-sm">Uploading...</p>
//                 </div>
//               </div>
//             )}
//             {uploadedUrl && !isUploading && (
//               <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
//                 ✓ Uploaded
//               </div>
//             )}
//             <Button
//               type="button"
//               variant="destructive"
//               size="sm"
//               className="absolute top-2 right-2"
//               onClick={onRemove}
//               disabled={isUploading}
//             >
//               <X className="h-4 w-4" />
//             </Button>
//           </div>
//         ) : (
//           <div className="text-center">
//             {isUploading ? (
//               <>
//                 <Loader2 className="h-12 w-12 mx-auto mb-2 text-blue-500 animate-spin" />
//                 <p className="text-sm mb-2 text-blue-600">
//                   Uploading {label.toLowerCase()}...
//                 </p>
//               </>
//             ) : (
//               <>
//                 <FileImage
//                   className={`h-12 w-12 mx-auto mb-2 ${
//                     error ? "text-red-400" : "text-gray-400"
//                   }`}
//                 />
//                 <p
//                   className={`text-sm mb-2 ${
//                     error ? "text-red-600" : "text-gray-600"
//                   }`}
//                 >
//                   Click to upload {label.toLowerCase()}
//                 </p>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => inputRef.current?.click()}
//                   disabled={isUploading}
//                 >
//                   <Upload className="h-4 w-4 mr-2" />
//                   Choose File
//                 </Button>
//               </>
//             )}
//           </div>
//         )}
//         <Input
//           ref={inputRef}
//           type="file"
//           accept="image/*"
//           className="hidden"
//           onChange={handleFileChange}
//         />
//       </div>
//       {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
//     </div>
//   );
// }

// // Helper function to upload file to R2 using signed URL
// async function uploadFileToR2(file: File): Promise<string> {
//   // Get signed URL
//   const signedUrlResponse = await fetch(
//     "/api/identity-verification-signed-url",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         fileType: file.type,
//       }),
//     }
//   );

//   if (!signedUrlResponse.ok) {
//     const errorData = await signedUrlResponse.json();
//     throw new Error(errorData.error || "Failed to get upload URL");
//   }

//   const { signedUrl, key } = await signedUrlResponse.json();

//   // Upload file directly to R2
//   const uploadResponse = await fetch(signedUrl, {
//     method: "PUT",
//     body: file,
//     headers: {
//       "Content-Type": file.type,
//     },
//   });

//   if (!uploadResponse.ok) {
//     throw new Error("Failed to upload file to storage");
//   }

//   return key;
// }

// // Supabase submission function - handles both new submissions and re-uploads
// async function submitIdentityVerification(data: {
//   userId: string;
//   proofType: string;
//   frontImageUrl: string;
//   backImageUrl: string | null;
//   existingVerificationId?: string; // For re-upload: update existing record
// }) {
//   try {
//     const supabase = getSupabaseBrowserClient();

//     // If re-uploading (existing verification ID provided), update existing record
//     if (data.existingVerificationId) {
//       const { data: verificationData, error: verificationError } =
//         await supabase
//           .from("identity_verification")
//           .update({
//             doc_type: data.proofType,
//             doc_url_front: data.frontImageUrl,
//             doc_url_back: data.backImageUrl,
//             status: "pending",
//             submitted_at: new Date().toISOString(),
//           })
//           .eq("identity_verification_id", data.existingVerificationId)
//           .select("identity_verification_id")
//           .single();

//       if (verificationError) {
//         console.error("Identity verification update error:", verificationError);
//         throw new Error("Failed to update verification request");
//       }

//       console.log("Re-upload verification data:", verificationData);

//       return {
//         success: true,
//         identity_verification_id: verificationData.identity_verification_id,
//         message: "Identity verification re-submitted successfully",
//         status: "pending",
//         isReupload: true,
//       };
//     }

//     // New submission: Insert into identity_verification table
//     const { data: verificationData, error: verificationError } = await supabase
//       .from("identity_verification")
//       .insert({
//         user_id: data.userId,
//         doc_type: data.proofType,
//         doc_url_front: data.frontImageUrl,
//         doc_url_back: data.backImageUrl,
//         status: "pending",
//         submitted_at: new Date().toISOString(),
//       })
//       .select("identity_verification_id")
//       .single();

//     if (verificationError) {
//       console.error("Identity verification insert error:", verificationError);
//       throw new Error("Failed to save verification request");
//     }

//     // Update users table with identity_verification_id
//     const { error: userUpdateError } = await supabase
//       .from("users")
//       .update({
//         identity_verification_id: verificationData.identity_verification_id,
//       })
//       .eq("user_id", data.userId);

//     if (userUpdateError) {
//       console.error("User update error:", userUpdateError);
//       throw new Error("Failed to update user record");
//     }

//     console.log("Verification data:", verificationData);

//     return {
//       success: true,
//       identity_verification_id: verificationData.identity_verification_id,
//       message: "Identity verification submitted successfully",
//       status: "pending",
//       isReupload: false,
//     };
//   } catch (error) {
//     console.error("Identity verification submission error:", error);
//     throw error;
//   }
// }

// export function IdentityVerificationDialog({
//   userId,
//   identityVerificationId,
//   verificationStatus,
//   verificationRejectionReason,
//   children,
//   onSuccess,
// }: {
//   userId?: string;
//   identityVerificationId?: string;
//   verificationStatus?: VerificationStatus;
//   verificationRejectionReason?: string;
//   children?: React.ReactNode;
//   onSuccess?: () => void;
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [frontPreview, setFrontPreview] = useState<string>("");
//   const [backPreview, setBackPreview] = useState<string>("");
//   const [frontImageUrl, setFrontImageUrl] = useState<string>("");
//   const [backImageUrl, setBackImageUrl] = useState<string>("");
//   const [frontUploading, setFrontUploading] = useState(false);
//   const [backUploading, setBackUploading] = useState(false);

//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   // React Hook Form setup with Zod validation
//   const form = useForm<IdentityVerificationFormData>({
//     resolver: zodResolver(IdentityVerificationSchema),
//     defaultValues: {
//       proofType: undefined,
//       frontImage: undefined as any,
//       backImage: undefined,
//     },
//   });

//   const {
//     watch,
//     setValue,
//     formState: { errors },
//   } = form;
//   const selectedProofType = watch("proofType");

//   // Find if the selected proof type requires back image
//   const proofConfig = PROOF_TYPES.find(
//     (type: { value: string; requiresBack?: boolean }) =>
//       type.value === selectedProofType
//   );
//   const requiresBackImage = proofConfig?.requiresBack || false;

//   // React Query mutation for API call
//   const verificationMutation = useMutation({
//     mutationFn: submitIdentityVerification,
//     onSuccess: (data) => {
//       toast({
//         title: "Verification Submitted",
//         description: `Your identity verification has been submitted for review (ID: ${data.identity_verification_id}). You'll be notified once it's processed.`,
//         variant: "default",
//       });

//       // Invalidate queries to refresh user data
//       if (userId) {
//         queryClient.invalidateQueries({
//           queryKey: ["identityVerificationData", userId],
//         });
//       }

//       if (onSuccess) {
//         onSuccess();
//       }

//       // Reset form and close dialog
//       form.reset();
//       setFrontPreview("");
//       setBackPreview("");
//       setFrontImageUrl("");
//       setBackImageUrl("");
//       setIsOpen(false);
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Submission Failed",
//         description:
//           error.message || "Failed to submit verification. Please try again.",
//         variant: "destructive",
//       });
//     },
//   });

//   // Handle file selection with preview and immediate upload
//   const handleFileSelect = async (
//     file: File | null,
//     type: "frontImage" | "backImage"
//   ) => {
//     if (!file) return;

//     // Set the file in form
//     setValue(type, file, { shouldValidate: true });

//     // Create preview
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const preview = e.target?.result as string;
//       if (type === "frontImage") {
//         setFrontPreview(preview);
//       } else {
//         setBackPreview(preview);
//       }
//     };
//     reader.readAsDataURL(file);

//     // Start upload immediately
//     try {
//       if (type === "frontImage") {
//         setFrontUploading(true);
//       } else {
//         setBackUploading(true);
//       }

//       const uploadedUrl = await uploadFileToR2(file);

//       if (type === "frontImage") {
//         setFrontImageUrl(uploadedUrl);
//         setFrontUploading(false);
//       } else {
//         setBackImageUrl(uploadedUrl);
//         setBackUploading(false);
//       }

//       toast({
//         title: "Upload Complete",
//         description: `${
//           type === "frontImage" ? "Front" : "Back"
//         } image uploaded successfully`,
//         variant: "default",
//       });
//     } catch (error) {
//       if (type === "frontImage") {
//         setFrontUploading(false);
//       } else {
//         setBackUploading(false);
//       }

//       toast({
//         title: "Upload Failed",
//         description:
//           error instanceof Error ? error.message : "Failed to upload image",
//         variant: "destructive",
//       });

//       // Clear the file from form on upload failure
//       setValue(type, undefined);
//       if (type === "frontImage") {
//         setFrontPreview("");
//       } else {
//         setBackPreview("");
//       }
//     }
//   };

//   // Handle file removal
//   const handleFileRemove = (type: "frontImage" | "backImage") => {
//     setValue(type, undefined, { shouldValidate: true });
//     if (type === "frontImage") {
//       setFrontPreview("");
//       setFrontImageUrl("");
//     } else {
//       setBackPreview("");
//       setBackImageUrl("");
//     }
//   };

//   // Form submission
//   const onSubmit = (data: IdentityVerificationFormData) => {
//     if (!userId) {
//       toast({
//         title: "Error",
//         description: "User ID is required for verification",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!frontImageUrl) {
//       toast({
//         title: "Error",
//         description: "Front image must be uploaded before submission",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Check if back image is required but not uploaded
//     if (requiresBackImage && !backImageUrl) {
//       toast({
//         title: "Error",
//         description: "Back image is required for this document type",
//         variant: "destructive",
//       });
//       return;
//     }

//     verificationMutation.mutate({
//       userId,
//       proofType: data.proofType,
//       frontImageUrl,
//       backImageUrl: requiresBackImage ? backImageUrl : null,
//     });
//   };

//   // Determine the verification state
//   const isPending = identityVerificationId && verificationStatus === "pending";
//   const isRejected =
//     identityVerificationId && verificationStatus === "rejected";

//   // Helper to render the appropriate trigger/status display
//   const renderTriggerOrStatus = () => {
//     // If children is provided, always use it as trigger (unless pending)
//     if (children) {
//       // If pending, don't show children as trigger - just show pending badge
//       if (isPending) {
//         return (
//           <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded">
//             <Pause className="h-4 w-4 text-yellow-600" />
//             <span className="text-sm font-medium text-yellow-600">
//               Pending Review
//             </span>
//           </div>
//         );
//       }
//       return <DialogTrigger asChild>{children}</DialogTrigger>;
//     }

//     // No children provided - use default buttons
//     if (isPending) {
//       return (
//         <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded">
//           <Pause className="h-4 w-4 text-yellow-600" />
//           <span className="text-sm font-medium text-yellow-600">
//             Pending Review
//           </span>
//         </div>
//       );
//     }

//     if (isRejected) {
//       return (
//         <DialogTrigger asChild>
//           <Button className="bg-red-50 text-red-600 hover:bg-red-100">
//             <RefreshCw className="h-4 w-4 mr-2" />
//             Re-upload
//           </Button>
//         </DialogTrigger>
//       );
//     }

//     // Default: not submitted
//     return (
//       <DialogTrigger asChild>
//         <Button className="bg-[#f5e5ff] text-[#9c4cd2] hover:bg-[#ede0ff]">
//           Verify Identity
//         </Button>
//       </DialogTrigger>
//     );
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       {renderTriggerOrStatus()}
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Identity Verification</DialogTitle>
//           <DialogDescription>
//             {isRejected ? (
//               <span className="text-red-600">
//                 Your previous verification was rejected.
//                 {verificationRejectionReason &&
//                   ` Reason: ${verificationRejectionReason}`}{" "}
//                 Please re-upload valid documents.
//               </span>
//             ) : (
//               "Upload a valid government-issued ID to verify your identity. All information is securely processed and encrypted."
//             )}
//           </DialogDescription>
//         </DialogHeader>

//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//             {/* Document Type Selection */}
//             <FormField
//               control={form.control}
//               name="proofType"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Document Type *</FormLabel>
//                   <Select
//                     onValueChange={(value) => {
//                       field.onChange(value);
//                       setValue("frontImage", undefined as any);
//                       setValue("backImage", undefined);
//                       setFrontPreview("");
//                       setBackPreview("");
//                       setFrontImageUrl("");
//                       setBackImageUrl("");
//                     }}
//                     value={field.value}
//                   >
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select document type" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {PROOF_TYPES.map(
//                         (type: { value: string; label: string }) => (
//                           <SelectItem key={type.value} value={type.value}>
//                             {type.label}
//                           </SelectItem>
//                         )
//                       )}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Front Image Upload */}
//             <FormField
//               control={form.control}
//               name="frontImage"
//               render={() => (
//                 <FormItem>
//                   <FileUpload
//                     label="Front Side of Document"
//                     isRequired
//                     file={watch("frontImage") || null}
//                     preview={frontPreview}
//                     onFileSelect={(file) =>
//                       handleFileSelect(file, "frontImage")
//                     }
//                     onRemove={() => handleFileRemove("frontImage")}
//                     error={errors.frontImage?.message}
//                     isUploading={frontUploading}
//                     uploadedUrl={frontImageUrl}
//                   />
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Back Image Upload (conditional) */}
//             {requiresBackImage && (
//               <FormField
//                 control={form.control}
//                 name="backImage"
//                 render={() => (
//                   <FormItem>
//                     <FileUpload
//                       label="Back Side of Document"
//                       isRequired
//                       file={watch("backImage") || null}
//                       preview={backPreview}
//                       onFileSelect={(file) =>
//                         handleFileSelect(file, "backImage")
//                       }
//                       onRemove={() => handleFileRemove("backImage")}
//                       error={errors.backImage?.message}
//                       isUploading={backUploading}
//                       uploadedUrl={backImageUrl}
//                     />
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             )}

//             {/* Info Box */}
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//               <h4 className="font-medium text-blue-900 mb-2">
//                 Important Notes:
//               </h4>
//               <ul className="text-sm text-blue-800 space-y-1">
//                 <li>• Ensure all text and details are clearly visible</li>
//                 <li>• Images should be well-lit and in focus</li>
//                 <li>• Maximum file size: 5MB per image</li>
//                 <li>• Accepted formats: PNG, JPG, JPEG, WebP only</li>
//                 <li>• Files are securely stored with encrypted naming</li>
//                 <li>• Verification usually takes 24-48 hours</li>
//               </ul>
//             </div>

//             {/* Submit Buttons */}
//             <div className="flex justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setIsOpen(false)}
//                 disabled={verificationMutation.isPending}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 disabled={
//                   verificationMutation.isPending ||
//                   frontUploading ||
//                   backUploading ||
//                   !frontImageUrl ||
//                   (requiresBackImage && !backImageUrl)
//                 }
//                 className="bg-[#9c4cd2] hover:bg-[#8a44c1]"
//               >
//                 {verificationMutation.isPending ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Submitting...
//                   </>
//                 ) : frontUploading || backUploading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Uploading...
//                   </>
//                 ) : !frontImageUrl ? (
//                   "Upload Front Image First"
//                 ) : requiresBackImage && !backImageUrl ? (
//                   "Upload Back Image First"
//                 ) : (
//                   "Submit for Verification"
//                 )}
//               </Button>
//             </div>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// }

// export function IdentityVerificationV2({
//   isVerified,
//   userId,
//   identityVerificationId,
//   isLoading,
// }: IdentityVerificationProps) {
//   // Determine if user has pending verification (submitted but not yet approved)
//   const isPending = !isVerified && !!identityVerificationId;

//   return (
//     <div className="rounded-lg border border-[#e2e2e2] p-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="font-medium text-[#3f3f3f]">Identity Verification</h3>
//           <p className="text-sm text-[#a2a2a2]">
//             {isVerified
//               ? "Your identity has been verified"
//               : isPending
//               ? "Your documents are being reviewed"
//               : "Verify your identity for enhanced security"}
//           </p>
//         </div>

//         {isLoading ? (
//           <Loader2 className="h-4 w-4 animate-spin" />
//         ) : isVerified ? (
//           // State: Verified - Show green verified badge
//           <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1.5">
//             <CheckCircle className="h-4 w-4 text-green-600" />
//             <span className="text-sm font-medium text-green-700">Verified</span>
//           </div>
//         ) : isPending ? (
//           // State: Pending Review - Show pending badge with re-upload option
//           <div className="flex items-center gap-2">
//             <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5">
//               <Clock className="h-4 w-4 text-amber-600" />
//               <span className="text-sm font-medium text-amber-700">
//                 Pending Review
//               </span>
//             </div>
//             <IdentityVerificationDialog
//               userId={userId}
//               identityVerificationId={identityVerificationId}
//               isReupload={true}
//             >
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
//               >
//                 <RefreshCw className="h-3 w-3 mr-1" />
//                 Re-upload
//               </Button>
//             </IdentityVerificationDialog>
//           </div>
//         ) : (
//           // State: Not Verified - Show verify identity button
//           <IdentityVerificationDialog
//             userId={userId}
//             identityVerificationId={identityVerificationId}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

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
  RefreshCw,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

// Verification status types
export type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | undefined;

interface IdentityVerificationProps {
  isVerified: boolean;
  userId?: string;
  identityVerificationId?: string;
  isLoading?: boolean;
  verificationStatus?: VerificationStatus;
  verificationRejectionReason?: string;
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
export function IdentityVerificationDialog({
  userId,
  identityVerificationId,
  verificationStatus,
  verificationRejectionReason,
  children,
  onSuccess,
}: {
  userId?: string;
  identityVerificationId?: string;
  verificationStatus?: VerificationStatus;
  verificationRejectionReason?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}) {
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
    (type: { value: string; requiresBack?: boolean }) =>
      type.value === selectedProofType
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

      if (onSuccess) {
        onSuccess();
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

  // Determine the verification state
  const isPending = identityVerificationId && verificationStatus === "pending";
  const isRejected =
    identityVerificationId && verificationStatus === "rejected";

  // Helper to render the appropriate trigger/status display
  const renderTriggerOrStatus = () => {
    // If children is provided, always use it as trigger (unless pending)
    if (children) {
      // If pending, don't show children as trigger - just show pending badge
      if (isPending) {
        return (
          <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded">
            <Pause className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">
              Pending Review
            </span>
          </div>
        );
      }
      return <DialogTrigger asChild>{children}</DialogTrigger>;
    }

    // No children provided - use default buttons
    if (isPending) {
      return (
        <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded">
          <Pause className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-600">
            Pending Review
          </span>
        </div>
      );
    }

    if (isRejected) {
      return (
        <DialogTrigger asChild>
          <Button className="bg-red-50 text-red-600 hover:bg-red-100">
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-upload
          </Button>
        </DialogTrigger>
      );
    }

    // Default: not submitted
    return (
      <DialogTrigger asChild>
        <Button className="bg-[#f5e5ff] text-[#9c4cd2] hover:bg-[#ede0ff]">
          Verify Identity
        </Button>
      </DialogTrigger>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {renderTriggerOrStatus()}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Identity Verification</DialogTitle>
          <DialogDescription>
            {isRejected ? (
              <span className="text-red-600">
                Your previous verification was rejected.
                {verificationRejectionReason &&
                  ` Reason: ${verificationRejectionReason}`}{" "}
                Please re-upload valid documents.
              </span>
            ) : (
              "Upload a valid government-issued ID to verify your identity. All information is securely processed and encrypted."
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Document Type Selection */}
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 text-amber-600">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-amber-800 mb-1">
                    Important: Name Verification
                  </h4>
                  <p className="text-[12px] text-amber-700 leading-relaxed">
                    Ensure the name on the provided document matches the account
                    profile name exactly to avoid verification delays or
                    rejection.
                  </p>
                </div>
              </div>
            </div>
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
                      {PROOF_TYPES.map(
                        (type: { value: string; label: string }) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        )
                      )}
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
  );
}
export function IdentityVerificationV2({
  isVerified,
  userId,
  identityVerificationId,
  isLoading,
  verificationStatus,
  verificationRejectionReason,
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
    (type: { value: string; requiresBack?: boolean }) =>
      type.value === selectedProofType
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

  // Helper function to determine the verification state
  const getVerificationState = () => {
    if (isVerified) return "approved";
    if (identityVerificationId && verificationStatus === "pending")
      return "pending";
    if (identityVerificationId && verificationStatus === "rejected")
      return "rejected";
    return "not_submitted";
  };

  const verificationState = getVerificationState();

  // Helper function to get the description text based on state
  const getDescription = () => {
    switch (verificationState) {
      case "approved":
        return "Your identity has been verified";
      case "pending":
        return "Your verification is being reviewed. We'll notify you once it's processed.";
      case "rejected":
        return (
          verificationRejectionReason ||
          "Your verification was rejected. Please re-upload valid documents."
        );
      default:
        return "Verify your identity for enhanced security";
    }
  };

  return (
    <div className="rounded-lg border border-[#e2e2e2] p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-[#3f3f3f]">Identity Verification</h3>
          <p
            className={`text-sm ${
              verificationState === "rejected"
                ? "text-red-600"
                : "text-[#a2a2a2]"
            }`}
          >
            {getDescription()}
          </p>
        </div>

        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : verificationState === "approved" ? (
          <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Verified</span>
          </div>
        ) : verificationState === "pending" ? (
          <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded">
            <Pause className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">
              Pending Review
            </span>
          </div>
        ) : verificationState === "rejected" ? (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-50 text-red-600 hover:bg-red-100">
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-upload
              </Button>
            </DialogTrigger>
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
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 text-amber-600">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-amber-800 mb-1">
                          Important: Name Verification
                        </h4>
                        <p className="text-[12px] text-amber-700 leading-relaxed">
                          Ensure the name on the provided document matches the
                          account profile name exactly to avoid verification
                          delays or rejection.
                        </p>
                      </div>
                    </div>
                  </div>

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
                            {PROOF_TYPES.map(
                              (type: { value: string; label: string }) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              )
                            )}
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
        ) : (
          // Not submitted state - show verify button
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#f5e5ff] text-[#9c4cd2] hover:bg-[#ede0ff]">
                Verify Identity
              </Button>
            </DialogTrigger>
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
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 text-amber-600">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-amber-800 mb-1">
                          Important: Name Verification
                        </h4>
                        <p className="text-[12px] text-amber-700 leading-relaxed">
                          Ensure the name on the provided document matches the
                          account profile name exactly to avoid verification
                          delays or rejection.
                        </p>
                      </div>
                    </div>
                  </div>
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
                            {PROOF_TYPES.map(
                              (type: { value: string; label: string }) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              )
                            )}
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
