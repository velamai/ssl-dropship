"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, Upload, FileImage, X } from "lucide-react";

interface IdentityVerificationProps {
  isVerified: boolean;
  onVerificationSubmit?: (data: {
    proofType: string;
    frontImage: File;
    backImage?: File;
  }) => Promise<void>;
  onChange?: (data: {
    proofType: string;
    frontImage: File | null;
    backImage: File | null;
  }) => void;
}

export const PROOF_TYPES = [
  {
    value: "gov-id",
    label: "Government ID (With Address Proof)",
    requiresBack: true,
  },
  { value: "passport", label: "Passport", requiresBack: false },
  { value: "driving_license", label: "Driving License", requiresBack: true },
] as const;

export function IdentityVerification({
  isVerified,
  onVerificationSubmit,
  onChange,
}: IdentityVerificationProps) {
  // Dialog state removed; inline rendering
  const [proofType, setProofType] = useState<string>("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedProofType = PROOF_TYPES.find(
    (type) => type.value === proofType
  );
  const requiresBackImage = selectedProofType?.requiresBack || false;
  const isProofSelected = !!proofType;
  const isFrontSelected = !!frontImage;
  const isBackSelected = !!backImage;
  const isFormValid =
    isProofSelected &&
    isFrontSelected &&
    (!requiresBackImage || isBackSelected);

  const emitChange = (
    updated: Partial<{
      proofType: string;
      frontImage: File | null;
      backImage: File | null;
    }>
  ) => {
    const payload = {
      proofType,
      frontImage,
      backImage,
      ...updated,
    };
    onChange?.({
      proofType: payload.proofType,
      frontImage: payload.frontImage,
      backImage: payload.backImage,
    });
  };

  const handleImageSelect = (file: File | null, type: "front" | "back") => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      if (type === "front") {
        setFrontImage(file);
        setFrontPreview(preview);
        emitChange({ frontImage: file });
      } else {
        setBackImage(file);
        setBackPreview(preview);
        emitChange({ backImage: file });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type: "front" | "back") => {
    if (type === "front") {
      setFrontImage(null);
      setFrontPreview("");
      if (frontInputRef.current) frontInputRef.current.value = "";
      emitChange({ frontImage: null });
    } else {
      setBackImage(null);
      setBackPreview("");
      if (backInputRef.current) backInputRef.current.value = "";
      emitChange({ backImage: null });
    }
  };

  const handleProofTypeChange = (value: string) => {
    setProofType(value);
    emitChange({ proofType: value });
  };

  const resetIdentityState = () => {
    setProofType("");
    setFrontImage(null);
    setBackImage(null);
    setFrontPreview("");
    setBackPreview("");
    if (frontInputRef.current) frontInputRef.current.value = "";
    if (backInputRef.current) backInputRef.current.value = "";
    emitChange({ proofType: "", frontImage: null, backImage: null });
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {isVerified ? (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1.5">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Verified</span>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <h4 className="font-medium text-[#3f3f3f] mb-1">
            Identity Verification{" "}
            <span className="text-[12px] text-[#a2a2a2]">(Optional)</span>
          </h4>
          <p className="text-sm text-[#a2a2a2] mb-4">
            Upload a valid government-issued ID to verify your account. This is
            optional but recommended. All information is securely processed and
            encrypted.
          </p>
          <div className="space-y-6">
            {/* Proof Type Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="proof-type">Document Type</Label>
                {proofType && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#9c4cd2] hover:text-[#7a2da6]"
                    onClick={resetIdentityState}
                  >
                    Clear selection
                  </Button>
                )}
              </div>
              <Select value={proofType} onValueChange={handleProofTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {PROOF_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Front Image Upload */}
            <div className="space-y-2">
              <Label>Front Side of Document</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {frontPreview ? (
                  <div className="relative">
                    <img
                      src={frontPreview}
                      alt="Front side preview"
                      className="max-h-48 mx-auto rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage("front")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload front side
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!isProofSelected}
                      onClick={() => frontInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
                <Input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleImageSelect(e.target.files?.[0] || null, "front")
                  }
                />
              </div>
            </div>

            {/* Back Image Upload (conditional) */}
            {requiresBackImage && (
              <div className="space-y-2">
                <Label>Back Side of Document</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {backPreview ? (
                    <div className="relative">
                      <img
                        src={backPreview}
                        alt="Back side preview"
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage("back")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload back side
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!isProofSelected}
                        onClick={() => backInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  )}
                  <Input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageSelect(e.target.files?.[0] || null, "back")
                    }
                  />
                </div>
              </div>
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
                <li>• Accepted formats: JPG, PNG, WebP</li>
                <li>• Verification usually takes 24-48 hours</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
